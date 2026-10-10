const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
      default: '',
    },
    cnic: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    job: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      default: 'Administration',
      trim: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Warden', 'Accountant', 'Receptionist', 'Security', 'Maintenance', 'Staff'],
      default: 'Staff',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: Number,
      required: true,
      default: 30000,
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Terminated'],
      default: 'Active',
    },
    photo: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Staff', StaffSchema);
