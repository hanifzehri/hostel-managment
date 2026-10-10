const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const allowedRoles = authorize('superadmin', 'admin', 'warden', 'accountant', 'receptionist');

router.get('/', protect, allowedRoles, getDashboardStats);
router.get('/stats', protect, allowedRoles, getDashboardStats);

module.exports = router;

