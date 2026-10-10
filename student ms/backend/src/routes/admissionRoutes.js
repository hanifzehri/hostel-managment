const express = require('express');
const router = express.Router();
const {
  getAdmissions,
  createAdmission,
} = require('../controllers/admissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getAdmissions)
  .post(authorize('superadmin', 'admin', 'receptionist'), createAdmission);

module.exports = router;
