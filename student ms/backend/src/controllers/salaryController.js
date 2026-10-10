const Salary = require('../models/Salary');
const Staff = require('../models/Staff');
const { generateSalaryId } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get salaries with search, month, status filters and dynamic payroll calculations
// @route   GET /api/salaries
// @access  Private
const getSalaries = async (req, res, next) => {
  try {
    const { month, year, status, search, staffId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (month && month !== 'All') {
      query.month = month;
    }

    if (year && year !== 'All') {
      query.year = Number(year);
    }

    if (status && status !== 'All') {
      query.paymentStatus = status;
    }

    if (staffId) {
      query.staff = staffId;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { salaryId: searchRegex },
        { staffName: searchRegex },
        { job: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [salaries, total, activeStaffCount, allActiveStaff] = await Promise.all([
      Salary.find(query).populate('staff', 'staffId name photo designation phone').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Salary.countDocuments(query),
      Staff.countDocuments({ status: 'Active' }),
      Staff.find({ status: 'Active' }).select('salary name designation'),
    ]);

    // Calculate dynamic staff salary expense
    // 1. From database Staff records: sum of monthly salaries of active staff members
    const baselineMonthlyPayroll = allActiveStaff.reduce((acc, st) => acc + (st.salary || 0), 0);

    // 2. From query filtered salary records:
    const aggregateSummary = await Salary.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$monthlySalary' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$pendingAmount' },
        },
      },
    ]);

    const summary = {
      totalStaffSalaryExpense: aggregateSummary[0]?.totalBudget || baselineMonthlyPayroll,
      baselineMonthlyPayroll,
      totalPaid: aggregateSummary[0]?.totalPaid || 0,
      totalPending: aggregateSummary[0]?.totalPending || 0,
      activeStaffCount,
      recordsCount: total,
    };

    res.status(200).json({
      success: true,
      data: salaries,
      summary,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single salary record
// @route   GET /api/salaries/:id
// @access  Private
const getSalaryById = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id).populate('staff');
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found.' });
    }
    res.status(200).json({ success: true, data: salary });
  } catch (err) {
    next(err);
  }
};

// @desc    Create individual salary record
// @route   POST /api/salaries
// @access  Private (Admin, Super Admin, Accountant)
const createSalary = async (req, res, next) => {
  try {
    const { staffId, month, year, monthlySalary, paidAmount = 0, paymentMethod = 'Bank Transfer', notes = '' } = req.body;

    const staffMember = await Staff.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const salaryAmount = Number(monthlySalary) || staffMember.salary || 30000;
    const paid = Number(paidAmount) || 0;
    const pending = Math.max(0, salaryAmount - paid);

    let paymentStatus = 'Unpaid';
    if (paid >= salaryAmount) {
      paymentStatus = 'Paid';
    } else if (paid > 0) {
      paymentStatus = 'Partial';
    }

    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    // Check duplicate
    const existing = await Salary.findOne({ staff: staffMember._id, month: currentMonth, year: currentYear });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Salary record already exists for ${staffMember.name} for ${currentMonth}.`,
      });
    }

    const salaryId = await generateSalaryId();

    const salaryRecord = await Salary.create({
      salaryId,
      staff: staffMember._id,
      staffName: staffMember.name,
      job: staffMember.job || staffMember.designation,
      monthlySalary: salaryAmount,
      paidAmount: paid,
      pendingAmount: pending,
      month: currentMonth,
      year: currentYear,
      paymentDate: paid > 0 ? new Date() : null,
      paymentStatus,
      paymentMethod,
      notes,
      paidBy: req.user?._id,
    });

    await logActivity({
      req,
      action: 'SALARY_SLIP_CREATED',
      module: 'Staff',
      recordId: salaryRecord._id,
      details: {
        staffName: staffMember.name,
        salaryId,
        month: currentMonth,
        amount: salaryAmount,
      },
    });

    res.status(201).json({
      success: true,
      message: `Salary slip generated for ${staffMember.name}.`,
      data: salaryRecord,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record or update salary payment
// @route   PUT /api/salaries/:id/pay
// @access  Private (Admin, Super Admin, Accountant)
const paySalary = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'Bank Transfer', paymentDate, notes = '' } = req.body;
    const payAmt = Number(amount);

    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid payment amount.' });
    }

    const salary = await Salary.findById(req.params.id).populate('staff');
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found.' });
    }

    salary.paidAmount = (salary.paidAmount || 0) + payAmt;
    salary.pendingAmount = Math.max(0, salary.monthlySalary - salary.paidAmount);

    if (salary.paidAmount >= salary.monthlySalary) {
      salary.paymentStatus = 'Paid';
    } else {
      salary.paymentStatus = 'Partial';
    }

    salary.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    salary.paymentMethod = paymentMethod;
    if (notes) {
      salary.notes = salary.notes ? `${salary.notes}; ${notes}` : notes;
    }
    salary.paidBy = req.user?._id;

    await salary.save();

    await logActivity({
      req,
      action: 'SALARY_PAYMENT_RECORDED',
      module: 'Staff',
      recordId: salary._id,
      details: {
        staffName: salary.staffName,
        paidNow: payAmt,
        totalPaid: salary.paidAmount,
        status: salary.paymentStatus,
      },
    });

    res.status(200).json({
      success: true,
      message: `Payment of PKR ${payAmt.toLocaleString()} recorded for ${salary.staffName}.`,
      data: salary,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate monthly salary slips for all active staff (Batch 1-Click)
// @route   POST /api/salaries/generate-batch
// @access  Private (Admin, Super Admin, Accountant)
const generateBatchMonthlySalaries = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const targetMonth = month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const activeStaff = await Staff.find({ status: 'Active' });
    if (!activeStaff.length) {
      return res.status(400).json({ success: false, message: 'No active staff members found to process salaries.' });
    }

    let createdCount = 0;
    const createdRecords = [];

    for (const staffMember of activeStaff) {
      const existing = await Salary.findOne({ staff: staffMember._id, month: targetMonth, year: targetYear });
      if (!existing) {
        const salaryId = await generateSalaryId();
        const rec = await Salary.create({
          salaryId,
          staff: staffMember._id,
          staffName: staffMember.name,
          job: staffMember.job || staffMember.designation,
          monthlySalary: staffMember.salary || 30000,
          paidAmount: 0,
          pendingAmount: staffMember.salary || 30000,
          month: targetMonth,
          year: targetYear,
          paymentStatus: 'Unpaid',
          paymentMethod: 'Bank Transfer',
          notes: 'Auto-generated monthly salary roster',
          paidBy: req.user?._id,
        });
        createdRecords.push(rec);
        createdCount++;
      }
    }

    await logActivity({
      req,
      action: 'SALARY_BATCH_GENERATED',
      module: 'Staff',
      details: { month: targetMonth, year: targetYear, generatedCount: createdCount },
    });

    res.status(200).json({
      success: true,
      message: `Successfully generated ${createdCount} salary slips for ${targetMonth}.`,
      count: createdCount,
      data: createdRecords,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete salary record
// @route   DELETE /api/salaries/:id
// @access  Private (Admin, Super Admin)
const deleteSalary = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Salary record not found.' });
    }

    await Salary.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Salary record deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSalaries,
  getSalaryById,
  createSalary,
  paySalary,
  generateBatchMonthlySalaries,
  deleteSalary,
};
