const Inventory = require('../models/Inventory');
const { logActivity } = require('../utils/auditLogger');

// @desc    Get inventory items
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res, next) => {
  try {
    const { category, condition, status, search } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (condition && condition !== 'All') query.condition = condition;
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.itemName = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const items = await Inventory.find(query)
      .populate('room', 'roomNumber block floor')
      .sort({ createdAt: -1 });

    const summary = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$quantity' },
          totalValue: { $sum: '$cost' },
        },
      },
    ]);

    const lowStockItems = items.filter((it) => it.quantity <= (it.minThreshold || 5));
    const lowStockCount = lowStockItems.length;

    res.status(200).json({
      success: true,
      count: items.length,
      summary: {
        totalItems: summary[0]?.totalItems || 0,
        totalValue: summary[0]?.totalValue || 0,
        lowStockCount,
      },
      lowStockItems,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (Admin, Super Admin)
const createInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.create(req.body);

    await logActivity({
      req,
      action: 'INVENTORY_ADDED',
      module: 'Inventory',
      recordId: item._id,
      details: { itemName: item.itemName, quantity: item.quantity },
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully.',
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Admin, Super Admin)
const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    Object.assign(item, req.body);
    await item.save();

    await logActivity({
      req,
      action: 'INVENTORY_UPDATED',
      module: 'Inventory',
      recordId: item._id,
      details: { itemName: item.itemName },
    });

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully.',
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin, Super Admin)
const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    await Inventory.findByIdAndDelete(req.params.id);

    await logActivity({
      req,
      action: 'INVENTORY_DELETED',
      module: 'Inventory',
      recordId: item._id,
      details: { itemName: item.itemName },
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from inventory.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};
