const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get leave requests
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res, next) => {
  try {
    const { status, studentId } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (studentId) query.student = studentId;

    // Student role scoping
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      query.student = req.user.studentRef;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('student', 'studentId fullName phone email profilePhoto room bed block floor')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Private
const createLeaveRequest = async (req, res, next) => {
  try {
    const { studentId, leaveType, startDate, endDate, reason, destination, emergencyContact } = req.body;

    const targetStudentId = req.user.role === 'student' && req.user.studentRef
      ? req.user.studentRef
      : studentId;

    const student = await Student.findById(targetStudentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const leave = await LeaveRequest.create({
      student: student._id,
      leaveType,
      startDate,
      endDate,
      reason,
      destination,
      emergencyContact: emergencyContact || student.emergencyPhone,
      status: 'Pending',
    });

    await logActivity({
      req,
      action: 'LEAVE_REQUESTED',
      module: 'Leave',
      recordId: leave._id,
      details: {
        studentName: student.fullName,
        studentId: student.studentId,
        leaveType,
        destination,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Review leave request (Approve / Reject)
// @route   PUT /api/leaves/:id/review
// @access  Private (Admin, Super Admin, Warden)
const reviewLeaveRequest = async (req, res, next) => {
  try {
    const { status, reviewNotes = '', returnStatus, actualReturnDate } = req.body;

    if (!['Approved', 'Rejected', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const leave = await LeaveRequest.findById(req.params.id).populate('student');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leave.status = status;
    leave.reviewNotes = reviewNotes;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    if (returnStatus) leave.returnStatus = returnStatus;
    if (actualReturnDate) leave.actualReturnDate = actualReturnDate;
    await leave.save();

    await logActivity({
      req,
      action: `LEAVE_${status.toUpperCase()}`,
      module: 'Leave',
      recordId: leave._id,
      details: {
        studentName: leave.student.fullName,
        studentId: leave.student.studentId,
        status,
        reviewNotes,
      },
    });

    res.status(200).json({
      success: true,
      message: `Leave request marked as ${status}.`,
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record student return from leave
// @route   PUT /api/leaves/:id/return
// @access  Private (Admin, Super Admin, Warden)
const markReturn = async (req, res, next) => {
  try {
    const { actualReturnDate = new Date(), returnNotes = '' } = req.body;

    const leave = await LeaveRequest.findById(req.params.id).populate('student');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const retDate = new Date(actualReturnDate);
    const scheduledEnd = new Date(leave.endDate);

    let returnStatus = 'Returned on Time';
    if (retDate.getTime() > scheduledEnd.getTime() + 24 * 60 * 60 * 1000) {
      returnStatus = 'Late Return';
    }

    leave.status = 'Completed';
    leave.actualReturnDate = retDate;
    leave.returnStatus = returnStatus;
    if (returnNotes) {
      leave.reviewNotes = leave.reviewNotes ? `${leave.reviewNotes} | Return: ${returnNotes}` : returnNotes;
    }
    await leave.save();

    await logActivity({
      req,
      action: 'LEAVE_RETURN_RECORDED',
      module: 'Leave',
      recordId: leave._id,
      details: {
        studentName: leave.student?.fullName,
        returnStatus,
        actualReturnDate: retDate,
      },
    });

    res.status(200).json({
      success: true,
      message: `Student return recorded as: ${returnStatus}.`,
      data: leave,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLeaves,
  createLeaveRequest,
  reviewLeaveRequest,
  markReturn,
};
