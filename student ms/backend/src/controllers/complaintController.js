const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const { generateComplaintId } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, studentId } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (priority && priority !== 'All') query.priority = priority;
    if (studentId) query.student = studentId;

    // Student role scoping
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      query.student = req.user.studentRef;
    }

    const complaints = await Complaint.find(query)
      .populate('student', 'studentId fullName phone room bed block floor')
      .populate('assignedStaff', 'name designation phone')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res, next) => {
  try {
    const { studentId, category, description, priority = 'Medium', maintenanceCost = 0 } = req.body;

    const targetStudentId = req.user.role === 'student' && req.user.studentRef
      ? req.user.studentRef
      : studentId;

    const student = await Student.findById(targetStudentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const complaintId = await generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      student: student._id,
      category,
      description,
      priority,
      status: 'Open',
      maintenanceCost: Number(maintenanceCost) || 0,
      createdBy: req.user._id,
    });

    await logActivity({
      req,
      action: 'COMPLAINT_CREATED',
      module: 'Complaint',
      recordId: complaint._id,
      details: {
        complaintId,
        category,
        studentName: student.fullName,
      },
    });

    res.status(201).json({
      success: true,
      message: `Complaint ${complaintId} logged successfully.`,
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update complaint status & resolution
// @route   PUT /api/complaints/:id
// @access  Private (Admin, Super Admin, Warden)
const updateComplaint = async (req, res, next) => {
  try {
    const { status, resolution, assignedStaff, priority, maintenanceCost } = req.body;

    const complaint = await Complaint.findById(req.params.id).populate('student');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (status) {
      complaint.status = status;
      if (status === 'Resolved') {
        complaint.resolvedDate = new Date();
      }
    }
    if (resolution !== undefined) complaint.resolution = resolution;
    if (assignedStaff !== undefined) complaint.assignedStaff = assignedStaff;
    if (priority) complaint.priority = priority;
    if (maintenanceCost !== undefined) complaint.maintenanceCost = Number(maintenanceCost) || 0;

    await complaint.save();

    await logActivity({
      req,
      action: 'COMPLAINT_UPDATED',
      module: 'Complaint',
      recordId: complaint._id,
      details: {
        complaintId: complaint.complaintId,
        status: complaint.status,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getComplaints,
  createComplaint,
  updateComplaint,
};
