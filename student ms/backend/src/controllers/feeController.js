const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Room = require('../models/Room');
const { generateInvoiceNumber, generateReceiptNumber } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get fees with search, month, year, status filters
// @route   GET /api/fees
// @access  Private
const getFees = async (req, res, next) => {
  try {
    const { search, month, year, status, feeType, page = 1, limit = 10 } = req.query;
    const query = {};

    if (month && month !== 'All') query.month = month;
    if (year && year !== 'All') query.year = Number(year);
    if (status && status !== 'All') query.status = status;
    if (feeType && feeType !== 'All') query.feeType = feeType;

    // Student role scoping
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      query.student = req.user.studentRef;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let studentMatchIds = null;
    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchedStudents = await Student.find({
        $or: [{ fullName: searchRegex }, { studentId: searchRegex }, { phone: searchRegex }],
      }).select('_id');
      studentMatchIds = matchedStudents.map((s) => s._id);

      query.$or = [
        { invoiceNumber: searchRegex },
        { student: { $in: studentMatchIds } },
      ];
    }

    const [fees, total] = await Promise.all([
      Fee.find(query)
        .populate('student', 'studentId fullName phone email profilePhoto block room')
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Fee.countDocuments(query),
    ]);

    // Financial totals
    const financialSummary = await Fee.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$remainingAmount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: fees,
      summary: financialSummary[0] || { totalAmount: 0, totalPaid: 0, totalPending: 0 },
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

// @desc    Get single fee invoice with payment receipts
// @route   GET /api/fees/:id
// @access  Private
const getFeeById = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student')
      .populate('createdBy', 'name role');

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee invoice not found.' });
    }

    // Role ownership check for students
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      const studentId = fee.student?._id ? String(fee.student._id) : String(fee.student);
      if (studentId !== String(req.user.studentRef)) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own invoices.' });
      }
    }

    const payments = await Payment.find({ fee: fee._id })
      .populate('receivedBy', 'name role')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...fee.toObject(),
        payments,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create fee invoice
// @route   POST /api/fees
// @access  Private (Admin, Super Admin, Accountant)
const createFeeInvoice = async (req, res, next) => {
  try {
    const {
      studentId,
      month,
      year = new Date().getFullYear(),
      feeType = 'Hostel Fee',
      amount,
      discount = 0,
      fine = 0,
      dueDate,
      notes = '',
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const amt = Number(amount) || 0;
    const disc = Number(discount) || 0;
    const fn = Number(fine) || 0;
    const total = Math.max(0, amt - disc + fn);

    const invoiceNumber = await generateInvoiceNumber();

    const fee = await Fee.create({
      invoiceNumber,
      student: student._id,
      month,
      year: Number(year),
      feeType,
      amount: amt,
      discount: disc,
      fine: fn,
      total,
      paidAmount: 0,
      remainingAmount: total,
      dueDate: dueDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'Pending',
      notes,
      createdBy: req.user._id,
    });

    await logActivity({
      req,
      action: 'FEE_INVOICE_CREATED',
      module: 'Fee',
      recordId: fee._id,
      details: {
        invoiceNumber,
        studentName: student.fullName,
        studentId: student.studentId,
        total,
      },
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created for ${student.fullName}.`,
      data: fee,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record payment for invoice
// @route   POST /api/fees/:id/payments
// @access  Private (Admin, Super Admin, Accountant)
const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'Cash', transactionId = '', notes = '' } = req.body;
    const payAmt = Number(amount);

    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    const fee = await Fee.findById(req.params.id).populate('student');
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee invoice not found.' });
    }

    if (fee.remainingAmount <= 0) {
      return res.status(400).json({ success: false, message: 'This invoice has already been fully paid.' });
    }

    // Never accept an overpayment against an invoice balance.
    if (payAmt > Number(fee.remainingAmount)) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds the outstanding balance of ${Number(fee.remainingAmount).toFixed(2)}.`,
      });
    }

    const receiptNumber = await generateReceiptNumber();

    const payment = await Payment.create({
      receiptNumber,
      fee: fee._id,
      student: fee.student._id,
      amount: payAmt,
      paymentDate: new Date(),
      paymentMethod,
      transactionId,
      receivedBy: req.user._id,
      notes,
    });

    // Update fee paid amount and balance
    fee.paidAmount = (fee.paidAmount || 0) + payAmt;
    fee.remainingAmount = Math.max(0, fee.total - fee.paidAmount);
    fee.status = fee.remainingAmount === 0 ? 'Paid' : 'Partial';
    fee.paymentDate = new Date();
    fee.paymentMethod = paymentMethod;
    await fee.save();

    await logActivity({
      req,
      action: 'PAYMENT_RECORDED',
      module: 'Payment',
      recordId: payment._id,
      details: {
        receiptNumber,
        invoiceNumber: fee.invoiceNumber,
        studentName: fee.student.fullName,
        amount: payAmt,
        paymentMethod,
      },
    });

    res.status(201).json({
      success: true,
      message: `Payment of ${payAmt} recorded successfully. Receipt #${receiptNumber} generated.`,
      payment,
      fee,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk generate monthly fees for all active students
// @route   POST /api/fees/generate-bulk
// @access  Private (Admin, Super Admin, Accountant)
const generateBulkFees = async (req, res, next) => {
  try {
    const { month, year = new Date().getFullYear(), feeType = 'Hostel Fee', defaultAmount = 15000, dueDate } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required.' });
    }

    const activeStudents = await Student.find({ studentStatus: 'Active' });
    let createdCount = 0;
    let skippedCount = 0;

    for (const student of activeStudents) {
      // Check if invoice already exists for this student, month, year, and feeType
      const existing = await Fee.findOne({
        student: student._id,
        month,
        year: Number(year),
        feeType,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const invoiceNumber = await generateInvoiceNumber();
      const amount = Number(defaultAmount) || 15000;

      await Fee.create({
        invoiceNumber,
        student: student._id,
        month,
        year: Number(year),
        feeType,
        amount,
        discount: 0,
        fine: 0,
        total: amount,
        paidAmount: 0,
        remainingAmount: amount,
        dueDate: dueDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'Pending',
        notes: `Bulk generated ${feeType} for ${month} ${year}`,
        createdBy: req.user._id,
      });

      createdCount++;
    }

    await logActivity({
      req,
      action: 'BULK_FEES_GENERATED',
      module: 'Fee',
      details: { month, year, feeType, createdCount, skippedCount },
    });

    res.status(200).json({
      success: true,
      message: `Successfully generated ${createdCount} invoices for ${month} ${year}. (${skippedCount} already had invoices).`,
      createdCount,
      skippedCount,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFees,
  getFeeById,
  createFeeInvoice,
  recordPayment,
  generateBulkFees,
};
