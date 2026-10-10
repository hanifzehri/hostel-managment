const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: [true, 'Please provide bed identifier (e.g. Bed A)'],
      trim: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'],
      default: 'Available',
    },
    currentStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    monthlyRent: {
      type: Number,
      default: 0,
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

// Compound index to ensure bedNumber is unique within a room
BedSchema.index({ room: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bed', BedSchema);
