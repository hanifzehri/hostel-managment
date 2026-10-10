const mongoose = require('mongoose');

const CheckInOutSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['CheckIn', 'CheckOut'],
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: true,
    },
    dateTime: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: '',
    },
    roomCondition: {
      type: String,
      enum: ['Excellent', 'Good', 'Satisfactory', 'Damaged', 'Needs Cleaning'],
      default: 'Good',
    },
    pendingDues: {
      type: Number,
      default: 0,
    },
    returnedItems: {
      type: [String],
      default: ['Room Key', 'Hostel ID Card', 'Cupboard Key', 'Mattress / Bedding'],
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CheckInOut', CheckInOutSchema);
