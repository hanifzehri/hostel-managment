const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/categories', getExpenseCategories);
router.route('/')
  .get(authorize('superadmin', 'admin', 'accountant'), getExpenses)
  .post(authorize('superadmin', 'admin', 'accountant'), createExpense);

router.route('/:id')
  .get(authorize('superadmin', 'admin', 'accountant'), getExpenseById)
  .put(authorize('superadmin', 'admin', 'accountant'), updateExpense)
  .delete(authorize('superadmin', 'admin'), deleteExpense);

module.exports = router;
