const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Student = require('../models/Student');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get all rooms with filter, search, and bed metrics
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res, next) => {
  try {
    const { block, floor, roomType, status, search } = req.query;
    const query = {};

    if (block && block !== 'All') query.block = block;
    if (floor && floor !== 'All') query.floor = Number(floor);
    if (roomType && roomType !== 'All') query.roomType = roomType;
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.roomNumber = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const rooms = await Room.find(query).sort({ roomNumber: 1 });

    // Populate beds for each room
    const roomsWithBeds = await Promise.all(
      rooms.map(async (room) => {
        const beds = await Bed.find({ room: room._id }).populate(
          'currentStudent',
          'studentId fullName phone email profilePhoto studentStatus cnic institution admissionNumber'
        );
        return {
          ...room.toObject(),
          beds,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: roomsWithBeds.length,
      data: roomsWithBeds,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single room with populated beds and occupants
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const beds = await Bed.find({ room: room._id }).populate(
      'currentStudent',
      'studentId fullName phone email profilePhoto studentStatus emergencyPhone institution degree'
    );

    res.status(200).json({
      success: true,
      data: {
        ...room.toObject(),
        beds,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new room and auto-generate beds
// @route   POST /api/rooms
// @access  Private (Admin, Super Admin)
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, block, floor, roomType, capacity, monthlyFee, amenities, notes } = req.body;

    const existing = await Room.findOne({ roomNumber: roomNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Room Number '${roomNumber}' already exists in hostel database.`,
      });
    }

    const cap = Number(capacity) || 2;
    const room = await Room.create({
      roomNumber: roomNumber.toUpperCase().trim(),
      block: block || 'Block A',
      floor: Number(floor) || 1,
      roomType: roomType || (cap === 1 ? 'Single' : cap === 2 ? 'Double' : cap === 3 ? 'Triple' : 'Four Bed'),
      capacity: cap,
      currentOccupants: 0,
      availableBeds: cap,
      status: 'Available',
      monthlyFee: Number(monthlyFee) || 15000,
      amenities: amenities || ['Attached Bath', 'Study Desk', 'Cupboard', 'Ceiling Fan'],
      notes: notes || '',
    });

    // Auto-generate Beds (Bed A, Bed B, Bed C, etc.)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const bedsToCreate = [];
    for (let i = 0; i < cap; i++) {
      const letter = alphabet[i] || `${i + 1}`;
      bedsToCreate.push({
        bedNumber: `Bed ${letter}`,
        room: room._id,
        status: 'Available',
        currentStudent: null,
        monthlyRent: room.monthlyFee,
      });
    }

    const createdBeds = await Bed.insertMany(bedsToCreate);

    await logActivity({
      req,
      action: 'ROOM_CREATED',
      module: 'Room',
      recordId: room._id,
      details: { roomNumber: room.roomNumber, capacity: room.capacity, bedsCount: createdBeds.length },
    });

    res.status(201).json({
      success: true,
      message: `Room ${room.roomNumber} created with ${createdBeds.length} individual beds.`,
      data: {
        ...room.toObject(),
        beds: createdBeds,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update room details and configurable capacity
// @route   PUT /api/rooms/:id
// @access  Private (Admin, Super Admin)
const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const newCapacity = req.body.capacity !== undefined ? Number(req.body.capacity) : room.capacity;
    if (newCapacity < room.currentOccupants) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce room capacity to ${newCapacity}. Room currently has ${room.currentOccupants} occupants.`,
      });
    }

    // If capacity was increased, auto-create additional beds
    const currentBeds = await Bed.find({ room: room._id });
    if (newCapacity > currentBeds.length) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const bedsToCreate = [];
      for (let i = currentBeds.length; i < newCapacity; i++) {
        bedsToCreate.push({
          bedNumber: `Bed ${alphabet[i] || i + 1}`,
          room: room._id,
          status: 'Available',
          currentStudent: null,
          monthlyRent: room.monthlyFee,
        });
      }
      if (bedsToCreate.length > 0) {
        await Bed.insertMany(bedsToCreate);
      }
    }

    Object.assign(room, req.body);
    room.capacity = newCapacity;
    room.availableBeds = Math.max(0, newCapacity - room.currentOccupants);
    if (room.currentOccupants === 0) {
      room.status = 'Available';
    } else if (room.currentOccupants >= room.capacity) {
      room.status = 'Full';
    } else {
      room.status = 'Partially Occupied';
    }
    await room.save();

    await logActivity({
      req,
      action: 'ROOM_UPDATED',
      module: 'Room',
      recordId: room._id,
      details: { roomNumber: room.roomNumber, capacity: room.capacity },
    });

    res.status(200).json({
      success: true,
      message: 'Room updated successfully.',
      data: room,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete room (Only if no occupants)
// @route   DELETE /api/rooms/:id
// @access  Private (Admin, Super Admin)
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const occupiedBedsCount = await Bed.countDocuments({
      room: room._id,
      status: 'Occupied',
    });

    if (occupiedBedsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete Room ${room.roomNumber}. It currently has ${occupiedBedsCount} active occupants. Vacate all beds first!`,
      });
    }

    // Delete associated beds
    await Bed.deleteMany({ room: room._id });
    await Room.findByIdAndDelete(room._id);

    await logActivity({
      req,
      action: 'ROOM_DELETED',
      module: 'Room',
      recordId: room._id,
      details: { roomNumber: room.roomNumber },
    });

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} and its beds deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
