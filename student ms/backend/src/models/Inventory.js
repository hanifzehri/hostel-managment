const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Furniture', 'Appliance', 'Electronics', 'Bedding', 'Sanitary', 'Security', 'Other'],
      default: 'Furniture',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    minThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Damaged', 'Under Repair'],
      default: 'Good',
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    locationName: {
      type: String,
      default: 'General Store',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    cost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['In Use', 'In Storage', 'Disposed'],
      default: 'In Use',
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

module.exports = mongoose.model('Inventory', InventorySchema);
