const express = require('express');
const router = express.Router();
const {
  getCheckInOutLogs,
  processCheckIn,
  processCheckOut,
} = require('../controllers/checkInOutController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getCheckInOutLogs);
router.post('/', authorize('superadmin', 'admin', 'warden', 'security'), (req, res, next) => {
  if (req.body.type === 'Check-Out') return processCheckOut(req, res, next);
  return processCheckIn(req, res, next);
});
router.post('/check-in', authorize('superadmin', 'admin', 'warden', 'security'), processCheckIn);
router.post('/check-out', authorize('superadmin', 'admin', 'warden', 'security'), processCheckOut);

module.exports = router;

