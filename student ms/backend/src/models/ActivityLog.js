const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System',
    },
    userRole: {
      type: String,
      default: 'Admin',
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
      enum: [
        'Auth',
        'Student',
        'Room',
        'Bed',
        'Admission',
        'CheckInOut',
        'Fee',
        'Payment',
        'Attendance',
        'Leave',
        'Visitor',
        'Complaint',
        'Staff',
        'Salary',
        'Finance',
        'Expense',
        'Inventory',
        'Announcement',
        'Settings',
        'Report',
        'System',
      ],
    },
    recordId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
