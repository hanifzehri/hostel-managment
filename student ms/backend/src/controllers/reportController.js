const Student = require('../models/Student');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Visitor = require('../models/Visitor');
const Complaint = require('../models/Complaint');
const Staff = require('../models/Staff');
const Salary = require('../models/Salary');
const Expense = require('../models/Expense');
const Setting = require('../models/Setting');

// @desc    Generate comprehensive report dataset based on type
// @route   GET /api/reports/:type
// @access  Private
const getReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, block, status, month, year } = req.query;

    let data = [];
    let summary = {};

    switch (type) {
      case 'students': {
        const query = {};
        if (status && status !== 'All') query.studentStatus = status;
        if (block && block !== 'All') query.block = block;
        data = await Student.find(query)
          .populate('room', 'roomNumber block floor roomType')
          .populate('bed', 'bedNumber')
          .sort({ fullName: 1 });

        summary = {
          total: data.length,
          active: data.filter((s) => s.studentStatus === 'Active').length,
          checkedOut: data.filter((s) => s.studentStatus === 'Checked Out').length,
          inactive: data.filter((s) => s.studentStatus === 'Inactive').length,
        };
        break;
      }

      case 'occupancy':
      case 'rooms': {
        const query = {};
        if (block && block !== 'All') query.block = block;
        data = await Room.find(query).sort({ roomNumber: 1 });

        const totalRooms = data.length;
        const totalCapacity = data.reduce((acc, r) => acc + r.capacity, 0);
        const totalOccupants = data.reduce((acc, r) => acc + r.currentOccupants, 0);
        const totalAvailable = data.reduce((acc, r) => acc + r.availableBeds, 0);

        const fullRooms = data.filter((r) => r.availableBeds === 0).length;
        const availableRooms = data.filter((r) => r.currentOccupants === 0).length;
        const partiallyOccupiedRooms = totalRooms - fullRooms - availableRooms;

        summary = {
          totalRooms,
          totalCapacity,
          totalOccupants,
          totalAvailable,
          fullRooms,
          availableRooms,
          partiallyOccupiedRooms,
          occupancyRate: totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0,
        };
        break;
      }

      case 'fees': {
        const query = {};
        if (status && status !== 'All') query.status = status;
        if (month && month !== 'All') query.month = month;
        if (year) query.year = Number(year);

        data = await Fee.find(query)
          .populate('student', 'studentId fullName phone block admissionNumber room')
          .sort({ createdAt: -1 });

        const totalBilled = data.reduce((acc, f) => acc + f.total, 0);
        const totalPaid = data.reduce((acc, f) => acc + f.paidAmount, 0);
        const totalPending = data.reduce((acc, f) => acc + f.remainingAmount, 0);

        summary = {
          totalBilled,
          totalPaid,
          totalPending,
          invoiceCount: data.length,
          collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0,
        };
        break;
      }

      case 'expenses': {
        const query = {};
        if (month && month !== 'All') query.month = month;
        if (year && year !== 'All') query.year = Number(year);

        data = await Expense.find(query).sort({ date: -1 });

        const categoryTotals = {};
        let totalExpensesAmount = 0;
        data.forEach((exp) => {
          categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
          totalExpensesAmount += exp.amount;
        });

        summary = {
          totalExpensesAmount,
          recordCount: data.length,
          categoryBreakdown: categoryTotals,
        };
        break;
      }

      case 'salaries': {
        const query = {};
        if (month && month !== 'All') query.month = month;
        if (year && year !== 'All') query.year = Number(year);

        data = await Salary.find(query)
          .populate('staff', 'staffId name phone designation')
          .sort({ monthlySalary: -1 });

        const totalSalaryBudget = data.reduce((acc, s) => acc + s.monthlySalary, 0);
        const totalPaidSalary = data.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
        const totalPendingSalary = data.reduce((acc, s) => acc + (s.pendingAmount || 0), 0);

        summary = {
          totalStaffSalaryExpense: totalSalaryBudget,
          totalPaidSalary,
          totalPendingSalary,
          staffCount: data.length,
        };
        break;
      }

      case 'profit-loss': {
        const targetMonth = month && month !== 'All' ? month : new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const targetYear = year ? Number(year) : new Date().getFullYear();

        const [feeRecords, expenseRecords, salaryRecords, setting] = await Promise.all([
          Fee.find({ $or: [{ month: targetMonth }, { month: targetMonth.split(' ')[0] }] }),
          Expense.find({ $or: [{ month: targetMonth }, { month: targetMonth.split(' ')[0] }] }),
          Salary.find({ month: targetMonth }),
          Setting.findOne(),
        ]);

        const expectedStudentFees = feeRecords.reduce((acc, f) => acc + f.total, 0);
        const collectedRevenue = feeRecords.reduce((acc, f) => acc + f.paidAmount, 0);
        const pendingFees = expectedStudentFees - collectedRevenue;

        // Staff salary total
        const staffSalaryExpense = salaryRecords.reduce((acc, s) => acc + s.monthlySalary, 0);

        // Expense categories breakdown
        const expenseCategoryMap = {};
        let otherExpensesSum = 0;
        expenseRecords.forEach((e) => {
          expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
          otherExpensesSum += e.amount;
        });

        const totalExpenses = (expenseCategoryMap['Staff Salaries'] || 0) > 0
          ? otherExpensesSum
          : otherExpensesSum + staffSalaryExpense;

        const netProfit = collectedRevenue - totalExpenses;
        const isLoss = netProfit < 0;
        const profitMargin =
          collectedRevenue > 0
            ? Math.round(((netProfit / collectedRevenue) * 100) * 10) / 10
            : 0;

        summary = {
          month: targetMonth,
          year: targetYear,
          expectedStudentFees,
          collectedRevenue,
          pendingFees,
          staffSalaryExpense,
          expenseCategoryMap,
          totalExpenses,
          netProfit: Math.abs(netProfit),
          isLoss,
          profitLossStatus: isLoss ? 'Loss' : 'Profit',
          profitMargin,
        };

        data = [
          { item: 'Expected Student Fees', type: 'Income', amount: expectedStudentFees },
          { item: 'Collected Student Revenue', type: 'Income', amount: collectedRevenue },
          { item: 'Pending Student Fees', type: 'Receivable', amount: pendingFees },
          { item: 'Staff Salaries Expense', type: 'Expense', amount: staffSalaryExpense },
          ...Object.entries(expenseCategoryMap).map(([cat, amt]) => ({
            item: `${cat} Expense`,
            type: 'Expense',
            amount: amt,
          })),
          { item: 'Total Monthly Expenses', type: 'Total Expense', amount: totalExpenses },
          { item: isLoss ? 'Net Monthly Loss' : 'Net Monthly Profit', type: isLoss ? 'Loss' : 'Profit', amount: Math.abs(netProfit) },
        ];
        break;
      }

      case 'attendance': {
        const query = {};
        if (startDate && endDate) {
          query.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
          query.date = startDate;
        }

        data = await Attendance.find(query)
          .populate('student', 'studentId fullName room block')
          .sort({ date: -1 });

        summary = {
          totalRecords: data.length,
          present: data.filter((a) => a.status === 'Present').length,
          absent: data.filter((a) => a.status === 'Absent').length,
          late: data.filter((a) => a.status === 'Late').length,
          leave: data.filter((a) => a.status === 'Leave').length,
        };
        break;
      }

      case 'staff': {
        data = await Staff.find().sort({ designation: 1 });
        const totalSalary = data.reduce((acc, s) => acc + (s.salary || 0), 0);
        summary = {
          totalStaff: data.length,
          active: data.filter((s) => s.status === 'Active').length,
          monthlyPayroll: totalSalary,
        };
        break;
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown report category: ${type}` });
    }

    res.status(200).json({
      success: true,
      reportType: type,
      summary,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReport };
