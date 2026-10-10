const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['Home Visit', 'Medical', 'Academic', 'Emergency', 'Vacation', 'Other'],
      default: 'Home Visit',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContact: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
    actualReturnDate: {
      type: Date,
    },
    returnStatus: {
      type: String,
      enum: ['Pending Return', 'Returned on Time', 'Late Return', 'Not Returned'],
      default: 'Pending Return',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
