const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Settings can be read publicly (e.g. for hostel name, logo on login and ID card verification)
router.get('/', getSettings);
router.put('/', protect, authorize('superadmin', 'admin'), updateSettings);

module.exports = router;
