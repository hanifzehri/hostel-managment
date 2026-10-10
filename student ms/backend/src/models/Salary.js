const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema(
  {
    salaryId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    job: {
      type: String,
      required: true,
    },
    monthlySalary: {
      type: Number,
      required: true,
      min: [0, 'Salary cannot be negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    month: {
      type: String, // e.g. "October 2026"
      required: true,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    paymentDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Unpaid'],
      default: 'Unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online'],
      default: 'Bank Transfer',
    },
    notes: {
      type: String,
      default: '',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast payroll lookups and duplicate checks
SalarySchema.index({ staff: 1, month: 1, year: 1 });
SalarySchema.index({ paymentStatus: 1, year: 1 });

module.exports = mongoose.model('Salary', SalarySchema);
