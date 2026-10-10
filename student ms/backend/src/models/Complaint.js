const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Room Maintenance',
        'Electrical',
        'Plumbing',
        'Cleanliness',
        'Mess / Food',
        'Internet / Wi-Fi',
        'Security',
        'Noise / Disturbance',
        'Other',
      ],
      default: 'Room Maintenance',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Open',
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
    },
    resolution: {
      type: String,
      default: '',
    },
    resolvedDate: {
      type: Date,
    },
    maintenanceCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', ComplaintSchema);
