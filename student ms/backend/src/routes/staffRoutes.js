const express = require('express');
const router = express.Router();
const {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(authorize('superadmin', 'admin'), getStaff)
  .post(authorize('superadmin', 'admin'), createStaff);

router
  .route('/:id')
  .put(authorize('superadmin', 'admin'), updateStaff)
  .delete(authorize('superadmin', 'admin'), deleteStaff);

module.exports = router;
