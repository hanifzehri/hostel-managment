const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    feeType: {
      type: String,
      enum: ['Hostel Fee', 'Mess Fee', 'Security Deposit', 'Maintenance Fee', 'Utility Fee', 'Fine', 'Other'],
      default: 'Hostel Fee',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    fine: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Online', 'Card', 'Cheque', 'Other'],
      default: 'Cash',
    },
    status: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending', 'Overdue'],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

FeeSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'fee',
});

// Indexes for billing and financial aggregation
FeeSchema.index({ student: 1, month: 1, year: 1 });
FeeSchema.index({ status: 1, dueDate: 1 });
FeeSchema.index({ year: 1, month: 1 });

module.exports = mongoose.model('Fee', FeeSchema);
