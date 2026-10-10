const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for clean exact date indexing
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Leave'],
      default: 'Present',
    },
    remarks: {
      type: String,
      default: '',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
