const Student = require('../models/Student');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Visitor = require('../models/Visitor');
const Complaint = require('../models/Complaint');
const ActivityLog = require('../models/ActivityLog');
const Setting = require('../models/Setting');
const RoomTransferHistory = require('../models/RoomTransferHistory');
const { generateStudentId, generateAdmissionNumber } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

// Helper to recalculate room occupancy and set proper status
const updateRoomOccupancy = async (roomId) => {
  if (!roomId) return;
  const room = await Room.findById(roomId);
  if (!room) return;

  const occupiedCount = await Bed.countDocuments({ room: roomId, status: 'Occupied' });
  const totalBeds = await Bed.countDocuments({ room: roomId });

  room.currentOccupants = occupiedCount;
  room.availableBeds = Math.max(0, (room.capacity || totalBeds) - occupiedCount);
  if (room.currentOccupants === 0) {
    room.status = 'Available';
  } else if (room.currentOccupants >= room.capacity) {
    room.status = 'Full';
  } else {
    room.status = 'Partially Occupied';
  }
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

    // 1. Enforce 40 Student Hostel Maximum Capacity
    const setting = await Setting.findOne();
    const maxStudents = setting?.maxStudentCapacity || 40;
    const activeStudentCount = await Student.countDocuments({
      studentStatus: { $in: ['Active', 'Pending'] },
    });

    if (activeStudentCount >= maxStudents) {
      return res.status(400).json({
        success: false,
        message: `Hostel capacity limit reached (${activeStudentCount}/${maxStudents} students). Cannot register additional residents.`,
      });
    }

    // 2. Mandatory CNIC Validation
    if (!studentData.cnic || !String(studentData.cnic).trim()) {
      return res.status(400).json({ success: false, message: 'CNIC number is required.' });
    }
    const cnicTrimmed = String(studentData.cnic).trim();
    if (!/^\d{5}-?\d{7}-?\d{1}$/.test(cnicTrimmed)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CNIC format. CNIC must be 13 digits (e.g. 54400-1234567-1).',
      });
    }
    studentData.cnic = cnicTrimmed;

    // 3. Mandatory Contact Number Validation
    if (!studentData.phone || !String(studentData.phone).trim()) {
      return res.status(400).json({ success: false, message: 'Contact number is required.' });
    }
    const phoneClean = String(studentData.phone).replace(/[\s-]/g, '');
    if (!(/^(\+92|0)?3\d{9}$/.test(phoneClean) || /^\+?\d{10,15}$/.test(phoneClean))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact number. Please provide a valid mobile number (e.g. 0300-1234567).',
      });
    }

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
        if (room.currentOccupants >= room.capacity) {
          return res.status(400).json({
            success: false,
            message: `Room ${room.roomNumber} is at maximum capacity (${room.capacity} occupants).`,
          });
        }
        studentData.block = room.block;
        studentData.floor = room.floor;
      }
    }

    // Sync profilePhoto and profilePicture
    if (studentData.profilePhoto && !studentData.profilePicture) {
      studentData.profilePicture = studentData.profilePhoto;
    } else if (studentData.profilePicture && !studentData.profilePhoto) {
      studentData.profilePhoto = studentData.profilePicture;
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
        cnic: student.cnic,
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

    // CNIC Validation & Uniqueness check on update
    if (req.body.cnic) {
      const cnicTrimmed = String(req.body.cnic).trim();
      if (!/^\d{5}-?\d{7}-?\d{1}$/.test(cnicTrimmed)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid CNIC format. CNIC must be 13 digits (e.g. 54400-1234567-1).',
        });
      }
      const existingCnic = await Student.findOne({
        _id: { $ne: student._id },
        cnic: cnicTrimmed,
      });
      if (existingCnic) {
        return res.status(400).json({
          success: false,
          message: `CNIC '${cnicTrimmed}' is already registered with student ${existingCnic.fullName}.`,
        });
      }
      req.body.cnic = cnicTrimmed;
    }

    // Phone Validation on update
    if (req.body.phone) {
      const phoneClean = String(req.body.phone).replace(/[\s-]/g, '');
      if (!(/^(\+92|0)?3\d{9}$/.test(phoneClean) || /^\+?\d{10,15}$/.test(phoneClean))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contact number. Please provide a valid mobile number (e.g. 0300-1234567).',
        });
      }
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

    // Sync profilePhoto and profilePicture
    if (req.body.profilePhoto && !req.body.profilePicture) {
      req.body.profilePicture = req.body.profilePhoto;
    } else if (req.body.profilePicture && !req.body.profilePhoto) {
      req.body.profilePhoto = req.body.profilePicture;
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

// @desc    Transfer student to another room
// @route   POST /api/students/:id/transfer-room
// @access  Private (Admin, Super Admin, Receptionist)
const transferRoom = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const { newRoomId, newBedId, reason } = req.body;
    if (!newRoomId) {
      return res.status(400).json({ success: false, message: 'Please select a destination room.' });
    }

    const targetRoom = await Room.findById(newRoomId);
    if (!targetRoom) {
      return res.status(404).json({ success: false, message: 'Destination room not found.' });
    }

    // Check if target room is the student's current room
    if (student.room && String(student.room) === String(targetRoom._id)) {
      return res.status(400).json({
        success: false,
        message: `Student is already residing in Room ${targetRoom.roomNumber}.`,
      });
    }

    // Prevent transfer to full rooms
    const occupiedCount = await Bed.countDocuments({ room: targetRoom._id, status: 'Occupied' });
    if (occupiedCount >= targetRoom.capacity || targetRoom.availableBeds <= 0 || targetRoom.status === 'Full') {
      return res.status(400).json({
        success: false,
        message: `Destination Room ${targetRoom.roomNumber} is at full capacity (${targetRoom.capacity} students). Transfer rejected.`,
      });
    }

    // Capture old room & bed details for audit trail
    const oldRoomId = student.room;
    let oldRoomNumber = 'Unassigned';
    let oldFloor = student.floor || 1;
    if (oldRoomId) {
      const oldRoom = await Room.findById(oldRoomId);
      if (oldRoom) {
        oldRoomNumber = oldRoom.roomNumber;
        oldFloor = oldRoom.floor;
      }
    }

    const oldBedId = student.bed;
    let oldBedNumber = 'None';
    if (oldBedId) {
      const oldBed = await Bed.findById(oldBedId);
      if (oldBed) {
        oldBedNumber = oldBed.bedNumber;
        oldBed.status = 'Available';
        oldBed.currentStudent = null;
        await oldBed.save();
      }
    }

    // Select or auto-assign bed in target room
    let targetBed = null;
    if (newBedId) {
      targetBed = await Bed.findOne({ _id: newBedId, room: targetRoom._id });
      if (!targetBed) {
        return res.status(404).json({ success: false, message: 'Selected bed does not exist in target room.' });
      }
      if (targetBed.status === 'Occupied' && String(targetBed.currentStudent) !== String(student._id)) {
        return res.status(400).json({
          success: false,
          message: `Bed ${targetBed.bedNumber} in Room ${targetRoom.roomNumber} is already occupied.`,
        });
      }
    } else {
      // Find first available bed in target room
      targetBed = await Bed.findOne({ room: targetRoom._id, status: 'Available' });
      if (!targetBed) {
        // If within capacity, create next bed
        const currentBedsCount = await Bed.countDocuments({ room: targetRoom._id });
        if (currentBedsCount < targetRoom.capacity) {
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          targetBed = await Bed.create({
            bedNumber: `Bed ${alphabet[currentBedsCount] || currentBedsCount + 1}`,
            room: targetRoom._id,
            status: 'Available',
            currentStudent: null,
            monthlyRent: targetRoom.monthlyFee,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: `No available beds in Room ${targetRoom.roomNumber}.`,
          });
        }
      }
    }

    // Occupy target bed
    targetBed.status = 'Occupied';
    targetBed.currentStudent = student._id;
    await targetBed.save();

    // Update student assignment
    student.room = targetRoom._id;
    student.bed = targetBed._id;
    student.floor = targetRoom.floor;
    student.block = targetRoom.block;
    await student.save();

    // Recalculate room occupancy for both rooms
    if (oldRoomId) {
      await updateRoomOccupancy(oldRoomId);
    }
    await updateRoomOccupancy(targetRoom._id);

    // Save transfer record in RoomTransferHistory
    const transferRecord = await RoomTransferHistory.create({
      student: student._id,
      studentId: student.studentId,
      studentName: student.fullName,
      fromRoom: oldRoomId || null,
      fromRoomNumber: oldRoomNumber,
      fromFloor: oldFloor,
      fromBed: oldBedId || null,
      fromBedNumber: oldBedNumber,
      toRoom: targetRoom._id,
      toRoomNumber: targetRoom.roomNumber,
      toFloor: targetRoom.floor,
      toBed: targetBed._id,
      toBedNumber: targetBed.bedNumber,
      reason: reason || 'Administrative room transfer requested by resident/hostel management.',
      transferredBy: req.user ? req.user._id : null,
      transferredByName: req.user ? req.user.name : 'Hostel Administrator',
      transferredAt: new Date(),
    });

    // Log to ActivityLog
    await logActivity({
      req,
      action: 'STUDENT_ROOM_TRANSFERRED',
      module: 'Student',
      recordId: student._id,
      details: {
        studentId: student.studentId,
        studentName: student.fullName,
        fromRoom: oldRoomNumber,
        toRoom: targetRoom.roomNumber,
        bed: targetBed.bedNumber,
        reason: reason || 'Room transfer',
      },
    });

    res.status(200).json({
      success: true,
      message: `Student ${student.fullName} transferred to Room ${targetRoom.roomNumber} (${targetBed.bedNumber}) successfully.`,
      student,
      transferRecord,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get transfer history for a student
// @route   GET /api/students/:id/transfer-history
// @access  Private
const getTransferHistory = async (req, res, next) => {
  try {
    const history = await RoomTransferHistory.find({ student: req.params.id })
      .populate('fromRoom', 'roomNumber floor')
      .populate('toRoom', 'roomNumber floor')
      .sort({ transferredAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload persistent student photograph
// @route   POST /api/students/upload-photo
// @access  Private
const uploadStudentPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully.',
      photoUrl,
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
  transferRoom,
  getTransferHistory,
  uploadStudentPhoto,
};
