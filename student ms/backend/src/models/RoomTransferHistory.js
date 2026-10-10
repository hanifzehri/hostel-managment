const mongoose = require('mongoose');

const RoomTransferHistorySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    fromRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    fromRoomNumber: {
      type: String,
      default: 'Unassigned',
    },
    fromFloor: {
      type: Number,
    },
    fromBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
    },
    fromBedNumber: {
      type: String,
      default: 'None',
    },
    toRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    toRoomNumber: {
      type: String,
      required: true,
    },
    toFloor: {
      type: Number,
      required: true,
    },
    toBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
    },
    toBedNumber: {
      type: String,
      default: 'Assigned Bed',
    },
    reason: {
      type: String,
      default: 'Administrative room transfer requested by resident/hostel management.',
      trim: true,
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    transferredByName: {
      type: String,
      default: 'Hostel Manager',
    },
    transferredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

RoomTransferHistorySchema.index({ student: 1, transferredAt: -1 });
RoomTransferHistorySchema.index({ toRoom: 1, transferredAt: -1 });

module.exports = mongoose.model('RoomTransferHistory', RoomTransferHistorySchema);
