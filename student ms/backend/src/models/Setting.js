const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    hostelName: {
      type: String,
      default: 'Royal Hostel Khuzdar',
    },
    hostelTagline: {
      type: String,
      default: 'Premier Student Residence & Academic Living',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: 'College Road, Khuzdar, Balochistan, Pakistan',
    },
    phone: {
      type: String,
      default: '+92 848 412345',
    },
    emergencyPhone: {
      type: String,
      default: '+92 333 7891234',
    },
    email: {
      type: String,
      default: 'admin@royalhostelkhuzdar.com',
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    academicYear: {
      type: String,
      default: '2026-2027',
    },
    rulesAndRegulations: {
      type: String,
      default: '1. Curfew time is strictly 10:00 PM.\n2. Visitors permitted in lobby between 4:00 PM - 8:00 PM.\n3. Keep your room and common areas clean.\n4. Smoking, alcohol, and weapons are strictly prohibited.\n5. Keep ID card visible at entrance gates.',
    },
    idCardValidityMonths: {
      type: Number,
      default: 12,
    },
    defaultMonthlyFee: {
      type: Number,
      default: 10000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', SettingSchema);
