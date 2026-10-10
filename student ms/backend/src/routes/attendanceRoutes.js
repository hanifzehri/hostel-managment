const express = require('express');
const router = express.Router();
const {
  getDailyAttendance,
  markAttendance,
  markBulkAttendance,
  getMonthlyMatrix,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getDailyAttendance);
router.get('/monthly-matrix', getMonthlyMatrix);
router.post('/mark', authorize('superadmin', 'admin', 'warden'), markAttendance);
router.post('/bulk-mark', authorize('superadmin', 'admin', 'warden'), markBulkAttendance);

module.exports = router;
