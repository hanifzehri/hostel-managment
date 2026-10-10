const express = require('express');
const router = express.Router();
const { getReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/:type', authorize('superadmin', 'admin', 'accountant'), getReport);

module.exports = router;
