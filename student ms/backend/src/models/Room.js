const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    block: {
      type: String,
      required: [true, 'Please provide hostel block'],
      trim: true,
      default: 'Block A',
    },
    floor: {
      type: Number,
      required: [true, 'Please provide floor number'],
      default: 1,
    },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Four Bed', 'Custom'],
      default: 'Double',
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide room capacity'],
      min: 1,
      default: 2,
    },
    currentOccupants: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBeds: {
      type: Number,
      default: 2,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Full', 'Maintenance', 'Reserved'],
      default: 'Available',
    },
    monthlyFee: {
      type: Number,
      default: 15000,
      min: 0,
    },
    amenities: {
      type: [String],
      default: ['Attached Bath', 'Study Desk', 'Cupboard', 'Ceiling Fan'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for populated beds
RoomSchema.virtual('beds', {
  ref: 'Bed',
  localField: '_id',
  foreignField: 'room',
  justOne: false,
});

module.exports = mongoose.model('Room', RoomSchema);
