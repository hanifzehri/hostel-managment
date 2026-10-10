const express = require('express');
const router = express.Router();
const {
  getSalaries,
  getSalaryById,
  createSalary,
  paySalary,
  generateBatchMonthlySalaries,
  deleteSalary,
} = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(authorize('superadmin', 'admin', 'accountant'), getSalaries)
  .post(authorize('superadmin', 'admin', 'accountant'), createSalary);

router.post('/generate-batch', authorize('superadmin', 'admin', 'accountant'), generateBatchMonthlySalaries);

router.route('/:id')
  .get(authorize('superadmin', 'admin', 'accountant'), getSalaryById)
  .delete(authorize('superadmin', 'admin'), deleteSalary);

router.put('/:id/pay', authorize('superadmin', 'admin', 'accountant'), paySalary);

module.exports = router;
