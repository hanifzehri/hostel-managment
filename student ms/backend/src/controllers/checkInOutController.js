const CheckInOut = require('../models/CheckInOut');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Fee = require('../models/Fee');
const { logActivity } = require('../utils/auditLogger');

// Helper to refresh room occupancy
const refreshRoom = async (roomId) => {
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

// @desc    Get check-in / check-out history logs
// @route   GET /api/check-in-out
// @access  Private
const getCheckInOutLogs = async (req, res, next) => {
  try {
    const { type, studentId } = req.query;
    const query = {};

    if (type) query.type = type;
    if (studentId) query.student = studentId;

    const logs = await CheckInOut.find(query)
      .populate('student', 'studentId fullName phone email profilePhoto')
      .populate('room', 'roomNumber block floor')
      .populate('bed', 'bedNumber')
      .populate('staff', 'name role')
      .sort({ dateTime: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process Check-In
// @route   POST /api/check-in-out/check-in
// @access  Private (Admin, Super Admin, Warden, Security)
const processCheckIn = async (req, res, next) => {
  try {
    const { studentId, bedId, dateTime = new Date(), notes = '' } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const targetBedId = bedId || student.bed;
    if (!targetBedId) {
      return res.status(400).json({ success: false, message: 'Bed ID is required for check-in.' });
    }

    const bed = await Bed.findById(targetBedId).populate('room');
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    if (bed.status === 'Occupied' && String(bed.currentStudent) !== String(student._id)) {
      return res.status(400).json({
        success: false,
        message: `Bed ${bed.bedNumber} is already occupied!`,
      });
    }

    // Update bed
    bed.status = 'Occupied';
    bed.currentStudent = student._id;
    await bed.save();

    // Update student
    student.studentStatus = 'Active';
    student.checkInDate = dateTime;
    student.room = bed.room._id;
    student.bed = bed._id;
    student.block = bed.room.block;
    student.floor = bed.room.floor;
    await student.save();

    await refreshRoom(bed.room._id);

    const checkInLog = await CheckInOut.create({
      type: 'CheckIn',
      student: student._id,
      room: bed.room._id,
      bed: bed._id,
      dateTime,
      staff: req.user._id,
      notes,
    });

    await logActivity({
      req,
      action: 'STUDENT_CHECK_IN',
      module: 'CheckInOut',
      recordId: checkInLog._id,
      details: {
        studentName: student.fullName,
        studentId: student.studentId,
        roomNumber: bed.room.roomNumber,
        bedNumber: bed.bedNumber,
      },
    });

    res.status(201).json({
      success: true,
      message: `${student.fullName} checked in successfully.`,
      data: checkInLog,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process Check-Out
// @route   POST /api/check-in-out/check-out
// @access  Private (Admin, Super Admin, Warden, Security)
const processCheckOut = async (req, res, next) => {
  try {
    const {
      studentId,
      dateTime = new Date(),
      reason = 'Session Completed',
      roomCondition = 'Good',
      returnedItems = ['Room Key', 'Hostel ID Card', 'Cupboard Key'],
      notes = '',
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Check pending dues
    const pendingFees = await Fee.find({
      student: student._id,
      status: { $in: ['Pending', 'Partial', 'Overdue'] },
    });

    const pendingTotal = pendingFees.reduce((acc, fee) => acc + (fee.remainingAmount || 0), 0);

    const roomId = student.room;
    const bedId = student.bed;

    // Vacate bed if currently occupied
    if (bedId) {
      const bed = await Bed.findById(bedId);
      if (bed) {
        bed.status = 'Available';
        bed.currentStudent = null;
        await bed.save();
      }
    }

    if (roomId) {
      await refreshRoom(roomId);
    }

    // Update student state to Checked Out
    student.studentStatus = 'Checked Out';
    student.actualCheckOutDate = dateTime;
    student.bed = null;
    await student.save();

    const checkOutLog = await CheckInOut.create({
      type: 'CheckOut',
      student: student._id,
      room: roomId,
      bed: bedId,
      dateTime,
      reason,
      roomCondition,
      pendingDues: pendingTotal,
      returnedItems,
      staff: req.user._id,
      notes,
    });

    await logActivity({
      req,
      action: 'STUDENT_CHECK_OUT',
      module: 'CheckInOut',
      recordId: checkOutLog._id,
      details: {
        studentName: student.fullName,
        studentId: student.studentId,
        reason,
        pendingDues: pendingTotal,
      },
    });

    res.status(201).json({
      success: true,
      message: `${student.fullName} checked out successfully. Bed vacated.`,
      data: checkOutLog,
      pendingDues: pendingTotal,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCheckInOutLogs,
  processCheckIn,
  processCheckOut,
};
