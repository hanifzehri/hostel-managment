const express = require('express');
const router = express.Router();
const {
  getLeaves,
  createLeaveRequest,
  reviewLeaveRequest,
  markReturn,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getLeaves)
  .post(createLeaveRequest);

router.put('/:id/review', authorize('superadmin', 'admin', 'warden'), reviewLeaveRequest);
router.put('/:id/return', authorize('superadmin', 'admin', 'warden'), markReturn);

module.exports = router;
