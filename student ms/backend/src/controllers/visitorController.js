const Visitor = require('../models/Visitor');
const Student = require('../models/Student');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get visitor logs
// @route   GET /api/visitors
// @access  Private
const getVisitors = async (req, res, next) => {
  try {
    const { status, date, search } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (date) query.visitDate = date;

    // Student role scoping
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      query.student = req.user.studentRef;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ visitorName: searchRegex }, { cnic: searchRegex }, { phone: searchRegex }];
    }

    const visitors = await Visitor.find(query)
      .populate('student', 'studentId fullName room bed block floor phone')
      .populate('registeredBy', 'name role')
      .sort({ checkInTime: -1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register new visitor
// @route   POST /api/visitors
// @access  Private (Admin, Super Admin, Warden, Receptionist, Security)
const registerVisitor = async (req, res, next) => {
  try {
    const { visitorName, cnic, phone, studentId, relationship, purpose, notes } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const visitor = await Visitor.create({
      visitorName,
      cnic,
      phone,
      student: student._id,
      relationship,
      visitDate: new Date().toISOString().split('T')[0],
      checkInTime: new Date(),
      purpose,
      notes: notes || '',
      status: 'Active',
      registeredBy: req.user._id,
    });

    await logActivity({
      req,
      action: 'VISITOR_REGISTERED',
      module: 'Visitor',
      recordId: visitor._id,
      details: {
        visitorName,
        studentName: student.fullName,
        purpose,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Visitor registered successfully.',
      data: visitor,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process visitor checkout
// @route   PUT /api/visitors/:id/checkout
// @access  Private (Admin, Super Admin, Warden, Receptionist, Security)
const checkoutVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor record not found.' });
    }

    visitor.status = 'Checked Out';
    visitor.checkOutTime = new Date();
    await visitor.save();

    await logActivity({
      req,
      action: 'VISITOR_CHECKED_OUT',
      module: 'Visitor',
      recordId: visitor._id,
      details: {
        visitorName: visitor.visitorName,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Visitor check-out recorded.',
      data: visitor,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVisitors,
  registerVisitor,
  checkoutVisitor,
};
