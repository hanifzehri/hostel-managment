const express = require('express');
const router = express.Router();
const {
  getBeds,
  assignBed,
  vacateBed,
  updateBedStatus,
} = require('../controllers/bedController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', authorize('superadmin', 'admin', 'warden', 'receptionist'), getBeds);
router.post('/:id/assign', authorize('superadmin', 'admin', 'warden', 'receptionist'), assignBed);
router.post('/:id/vacate', authorize('superadmin', 'admin', 'warden', 'receptionist'), vacateBed);
router.put('/:id/status', authorize('superadmin', 'admin', 'warden'), updateBedStatus);

module.exports = router;
