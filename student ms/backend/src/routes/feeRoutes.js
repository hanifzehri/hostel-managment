const express = require('express');
const router = express.Router();
const {
  getFees,
  getFeeById,
  createFeeInvoice,
  recordPayment,
  generateBulkFees,
} = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getFees)
  .post(authorize('superadmin', 'admin', 'accountant'), createFeeInvoice);

router.post('/generate-bulk', authorize('superadmin', 'admin', 'accountant'), generateBulkFees);

router
  .route('/:id')
  .get(getFeeById);

router.post('/:id/payments', authorize('superadmin', 'admin', 'accountant'), recordPayment);

module.exports = router;
