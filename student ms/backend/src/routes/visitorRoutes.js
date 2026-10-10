const express = require('express');
const router = express.Router();
const {
  getVisitors,
  registerVisitor,
  checkoutVisitor,
} = require('../controllers/visitorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getVisitors)
  .post(authorize('superadmin', 'admin', 'warden', 'receptionist', 'security'), registerVisitor);

router.put('/:id/checkout', authorize('superadmin', 'admin', 'warden', 'receptionist', 'security'), checkoutVisitor);

module.exports = router;
