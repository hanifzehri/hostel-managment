const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', authorize('superadmin', 'admin'), getActivityLogs);

module.exports = router;
