const Student = require('../models/Student');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Visitor = require('../models/Visitor');
const Complaint = require('../models/Complaint');
const ActivityLog = require('../models/ActivityLog');
const { generateStudentId, generateAdmissionNumber } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

// Helper to recalculate room occupancy
const updateRoomOccupancy = async (roomId) => {
  if (!roomId) return;
  const room = await Room.findById(roomId);
  if (!room) return;

  const occupiedCount = await Bed.countDocuments({ room: roomId, status: 'Occupied' });
  const totalBeds = await Bed.countDocuments({ room: roomId });

  room.currentOccupants = occupiedCount;
  room.availableBeds = Math.max(0, (room.capacity || totalBeds) - occupiedCount);
  room.status = room.availableBeds === 0 ? 'Full' : 'Available';
  await room.save();
};

// @desc    Get all students with search, filter, pagination, sorting
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res, next) => {
  try {
    const {
      search,
      status,
      block,
      floor,
      gender,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Student role scoping
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      query._id = req.user.studentRef;
    }

    if (status && status !== 'All') {
      query.studentStatus = status;
    }

    if (block && block !== 'All') {
      query.block = block;
    }

    if (floor && floor !== 'All') {
      query.floor = Number(floor);
    }

    if (gender && gender !== 'All') {
      query.gender = gender;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchedRooms = await Room.find({ roomNumber: searchRegex }).select('_id');
      const roomIds = matchedRooms.map((r) => r._id);

      query.$or = [
        { fullName: searchRegex },
        { studentId: searchRegex },
        { cnic: searchRegex },
        { phone: searchRegex },
        { admissionNumber: searchRegex },
        { email: searchRegex },
        { institution: searchRegex },
        { department: searchRegex },
        { room: { $in: roomIds } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('room', 'roomNumber block floor roomType')
        .populate('bed', 'bedNumber status')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Student.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: students,
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

// @desc    Get single student full profile with all relations
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res, next) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'me') {
      if (!req.user || !req.user.studentRef) {
        return res.status(404).json({
          success: false,
          message: 'No student profile linked to your user account.',
        });
      }
      targetId = req.user.studentRef;
    }

    const student = await Student.findById(targetId)
      .populate('room')
      .populate('bed');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
    }

    // Role ownership check for students
    if (req.user && req.user.role === 'student' && req.user.studentRef) {
      if (String(student._id) !== String(req.user.studentRef)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view your own student profile.',
        });
      }
    }

    // Parallel fetch related data for comprehensive profile tabs
    const [fees, attendance, leaves, visitors, complaints, activities] = await Promise.all([
      Fee.find({ student: student._id }).sort({ createdAt: -1 }),
      Attendance.find({ student: student._id }).sort({ date: -1 }).limit(30),
      LeaveRequest.find({ student: student._id }).sort({ createdAt: -1 }),
      Visitor.find({ student: student._id }).sort({ checkInTime: -1 }),
      Complaint.find({ student: student._id }).sort({ createdAt: -1 }),
      ActivityLog.find({ recordId: String(student._id) }).sort({ createdAt: -1 }).limit(20),
    ]);

    // Attendance summary
    const totalAtt = attendance.length;
    const presentAtt = attendance.filter((a) => a.status === 'Present').length;
    const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    res.status(200).json({
      success: true,
      student,
      relations: {
        fees,
        attendance,
        attendanceStats: {
          total: totalAtt,
          present: presentAtt,
          percentage: attendancePercentage,
        },
        leaves,
        visitors,
        complaints,
        activities,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new student with bed assignment
// @route   POST /api/students
// @access  Private (Admin, Super Admin, Receptionist)
const createStudent = async (req, res, next) => {
  try {
    const studentData = { ...req.body };

    // Auto generate sequential student ID and admission number if not provided
    if (!studentData.studentId) {
      studentData.studentId = await generateStudentId();
    }
    if (!studentData.admissionNumber) {
      studentData.admissionNumber = await generateAdmissionNumber();
    }

    // Validate duplicate CNIC or Student ID
    const existing = await Student.findOne({
      $or: [
        { studentId: studentData.studentId.toUpperCase().trim() },
        { cnic: studentData.cnic.trim() },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.studentId === studentData.studentId.toUpperCase().trim()
            ? `Student ID '${studentData.studentId}' already exists.`
            : `CNIC '${studentData.cnic}' is already registered with student ${existing.fullName}.`,
      });
    }

    // If bed is assigned, ensure it is available and not double-booked
    let bed = null;
    let room = null;
    if (studentData.bed) {
      bed = await Bed.findById(studentData.bed);
      if (!bed) {
        return res.status(404).json({ success: false, message: 'Selected bed does not exist.' });
      }
      if (bed.status === 'Occupied') {
        return res.status(400).json({
          success: false,
          message: `Selected Bed '${bed.bedNumber}' is already occupied. Double-bed assignment prevented!`,
        });
      }
      studentData.room = bed.room;
      room = await Room.findById(bed.room);
      if (room) {
        studentData.block = room.block;
        studentData.floor = room.floor;
      }
    }

    const student = await Student.create(studentData);

    // If bed was selected, mark it occupied and link student
    if (bed) {
      bed.status = 'Occupied';
      bed.currentStudent = student._id;
      await bed.save();
      await updateRoomOccupancy(bed.room);
    }

    await logActivity({
      req,
      action: 'STUDENT_CREATED',
      module: 'Student',
      recordId: student._id,
      details: {
        studentId: student.studentId,
        name: student.fullName,
        room: room ? room.roomNumber : null,
        bed: bed ? bed.bedNumber : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      student,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin, Super Admin, Receptionist)
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const oldBedId = student.bed ? String(student.bed) : null;
    const newBedId = req.body.bed ? String(req.body.bed) : null;

    // Bed reassignment handling
    if (newBedId && newBedId !== oldBedId) {
      const newBed = await Bed.findById(newBedId);
      if (!newBed) {
        return res.status(404).json({ success: false, message: 'Assigned bed does not exist.' });
      }
      if (newBed.status === 'Occupied' && String(newBed.currentStudent) !== String(student._id)) {
        return res.status(400).json({
          success: false,
          message: `Bed '${newBed.bedNumber}' is currently occupied by another student!`,
        });
      }

      // Vacate old bed
      if (oldBedId) {
        const oldBed = await Bed.findById(oldBedId);
        if (oldBed) {
          oldBed.status = 'Available';
          oldBed.currentStudent = null;
          await oldBed.save();
          await updateRoomOccupancy(oldBed.room);
        }
      }

      // Occupy new bed
      newBed.status = 'Occupied';
      newBed.currentStudent = student._id;
      await newBed.save();

      req.body.room = newBed.room;
      const room = await Room.findById(newBed.room);
      if (room) {
        req.body.block = room.block;
        req.body.floor = room.floor;
      }
      await updateRoomOccupancy(newBed.room);
    }

    // Apply updates
    Object.assign(student, req.body);
    await student.save();

    await logActivity({
      req,
      action: 'STUDENT_UPDATED',
      module: 'Student',
      recordId: student._id,
      details: { studentId: student.studentId, name: student.fullName },
    });

    res.status(200).json({
      success: true,
      message: 'Student updated successfully.',
      student,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Deactivate / Soft-delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin, Super Admin)
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Soft deactivation preserves financial records and audit history
    student.studentStatus = 'Inactive';

    // Vacate bed if assigned
    if (student.bed) {
      const bed = await Bed.findById(student.bed);
      if (bed) {
        bed.status = 'Available';
        bed.currentStudent = null;
        await bed.save();
        await updateRoomOccupancy(bed.room);
      }
      student.bed = null;
    }

    await student.save();

    await logActivity({
      req,
      action: 'STUDENT_DEACTIVATED',
      module: 'Student',
      recordId: student._id,
      details: { studentId: student.studentId, name: student.fullName },
    });

    res.status(200).json({
      success: true,
      message: 'Student deactivated and bed vacated successfully. History preserved.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Safe public student verification for QR Code scanning
// @route   GET /api/students/verify/:identifier
// @access  Public
const verifyStudent = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    // Search by verificationToken or studentId
    const student = await Student.findOne({
      $or: [{ verificationToken: identifier }, { studentId: identifier.toUpperCase() }],
    })
      .populate('room', 'roomNumber block floor')
      .populate('bed', 'bedNumber');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record could not be verified. Invalid or expired identification code.',
      });
    }

    // Return safe verification payload without exposing private sensitive information
    const verificationData = {
      verified: true,
      studentId: student.studentId,
      fullName: student.fullName,
      profilePhoto: student.profilePhoto,
      status: student.studentStatus,
      institution: student.institution,
      degree: student.degree,
      block: student.block,
      roomNumber: student.room ? student.room.roomNumber : 'N/A',
      bedNumber: student.bed ? student.bed.bedNumber : 'N/A',
      admissionDate: student.admissionDate,
      validUntil: student.expectedCheckOutDate || 'Ongoing Session',
      emergencyPhone: student.emergencyPhone,
      timestamp: new Date(),
    };

    res.status(200).json({
      success: true,
      data: verificationData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload document to student profile
// @route   POST /api/students/:id/documents
// @access  Private
const uploadStudentDocument = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { title } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    student.documents.push({
      title: title || req.file.originalname,
      fileUrl,
      fileType: req.file.mimetype,
      uploadedAt: new Date(),
    });

    await student.save();

    await logActivity({
      req,
      action: 'DOCUMENT_UPLOADED',
      module: 'Student',
      recordId: student._id,
      details: { title: title || req.file.originalname, fileUrl },
    });

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      documents: student.documents,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  verifyStudent,
  uploadStudentDocument,
};
