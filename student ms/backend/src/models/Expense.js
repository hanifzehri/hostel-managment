const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    expenseId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify expense category'],
      enum: [
        'Staff Salaries',
        'Food',
        'Electricity',
        'Gas',
        'Water',
        'Internet',
        'Maintenance',
        'Cleaning Supplies',
        'Laundry',
        'Rent',
        'Security',
        'Stationery',
        'Repairs',
        'Other',
      ],
      default: 'Other',
    },
    description: {
      type: String,
      required: [true, 'Please provide an expense description'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide amount'],
      min: [0, 'Expense amount cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: String, // e.g. "October 2026"
      required: true,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    paidBy: {
      type: String,
      default: 'Hostel Administration',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Online', 'Cheque'],
      default: 'Cash',
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
  }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
