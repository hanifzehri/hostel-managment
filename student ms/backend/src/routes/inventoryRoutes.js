const express = require('express');
const router = express.Router();
const {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(authorize('superadmin', 'admin', 'warden'), getInventory)
  .post(authorize('superadmin', 'admin'), createInventoryItem);

router
  .route('/:id')
  .put(authorize('superadmin', 'admin'), updateInventoryItem)
  .delete(authorize('superadmin', 'admin'), deleteInventoryItem);

module.exports = router;
