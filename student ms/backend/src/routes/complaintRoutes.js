const express = require('express');
const router = express.Router();
const {
  getComplaints,
  createComplaint,
  updateComplaint,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getComplaints)
  .post(createComplaint);

router.put('/:id', authorize('superadmin', 'admin', 'warden'), updateComplaint);

module.exports = router;
