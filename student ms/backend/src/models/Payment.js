const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fee',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Online', 'Card', 'Cheque', 'Other'],
      default: 'Cash',
    },
    transactionId: {
      type: String,
      default: '',
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

module.exports = mongoose.model('Payment', PaymentSchema);
