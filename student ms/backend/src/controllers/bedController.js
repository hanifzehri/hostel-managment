const Bed = require('../models/Bed');
const Room = require('../models/Room');
const Student = require('../models/Student');
const { logActivity } = require('../utils/auditLogger');

// Helper to update room occupancy
const refreshRoom = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) return;
  const occupiedCount = await Bed.countDocuments({ room: roomId, status: 'Occupied' });
  const totalBeds = await Bed.countDocuments({ room: roomId });
  room.currentOccupants = occupiedCount;
  room.availableBeds = Math.max(0, (room.capacity || totalBeds) - occupiedCount);
  room.status = room.availableBeds === 0 ? 'Full' : 'Available';
  await room.save();
};

// @desc    Get all beds with optional room or status filters
// @route   GET /api/beds
// @access  Private
const getBeds = async (req, res, next) => {
  try {
    const { room, status } = req.query;
    const query = {};

    if (room) query.room = room;
    if (status) query.status = status;

    const beds = await Bed.find(query)
      .populate('room', 'roomNumber block floor roomType capacity')
      .populate('currentStudent', 'studentId fullName phone profilePhoto');

    res.status(200).json({
      success: true,
      count: beds.length,
      data: beds,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign bed to student
// @route   POST /api/beds/:id/assign
// @access  Private (Admin, Super Admin, Warden)
const assignBed = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const bedId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const bed = await Bed.findById(bedId).populate('room');
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bed.bedNumber} is already occupied! Double assignment strictly prevented.`,
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Check if student already has another active bed
    if (student.bed && String(student.bed) !== String(bed._id)) {
      const existingBed = await Bed.findById(student.bed);
      if (existingBed && existingBed.status === 'Occupied') {
        return res.status(400).json({
          success: false,
          message: `Student ${student.fullName} is already assigned to ${existingBed.bedNumber}. A student cannot have multiple beds simultaneously!`,
        });
      }
    }

    // Assign bed
    bed.status = 'Occupied';
    bed.currentStudent = student._id;
    await bed.save();

    // Link bed to student
    student.bed = bed._id;
    student.room = bed.room._id;
    student.block = bed.room.block;
    student.floor = bed.room.floor;
    student.studentStatus = 'Active';
    await student.save();

    await refreshRoom(bed.room._id);

    await logActivity({
      req,
      action: 'BED_ASSIGNED',
      module: 'Bed',
      recordId: bed._id,
      details: {
        bedNumber: bed.bedNumber,
        roomNumber: bed.room.roomNumber,
        studentName: student.fullName,
        studentId: student.studentId,
      },
    });

    res.status(200).json({
      success: true,
      message: `Bed ${bed.bedNumber} in Room ${bed.room.roomNumber} successfully assigned to ${student.fullName}.`,
      data: bed,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Vacate bed
// @route   POST /api/beds/:id/vacate
// @access  Private (Admin, Super Admin, Warden)
const vacateBed = async (req, res, next) => {
  try {
    const bedId = req.params.id;
    const bed = await Bed.findById(bedId).populate('room');

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    const previousStudentId = bed.currentStudent;

    bed.status = 'Available';
    bed.currentStudent = null;
    await bed.save();

    if (previousStudentId) {
      const student = await Student.findById(previousStudentId);
      if (student) {
        student.bed = null;
        await student.save();
      }
    }

    await refreshRoom(bed.room._id);

    await logActivity({
      req,
      action: 'BED_VACATED',
      module: 'Bed',
      recordId: bed._id,
      details: {
        bedNumber: bed.bedNumber,
        roomNumber: bed.room ? bed.room.roomNumber : '',
      },
    });

    res.status(200).json({
      success: true,
      message: `Bed ${bed.bedNumber} is now marked Available.`,
      data: bed,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update bed status (Maintenance, Reserved, Available)
// @route   PUT /api/beds/:id/status
// @access  Private (Admin, Super Admin, Warden)
const updateBedStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    if (bed.status === 'Occupied' && status !== 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Bed is currently occupied by a student. Vacate student before changing status.',
      });
    }

    bed.status = status;
    await bed.save();

    await refreshRoom(bed.room);

    res.status(200).json({
      success: true,
      message: `Bed status updated to ${status}.`,
      data: bed,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBeds,
  assignBed,
  vacateBed,
  updateBedStatus,
};
