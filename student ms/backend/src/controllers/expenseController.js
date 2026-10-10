const Expense = require('../models/Expense');
const { generateExpenseId } = require('../utils/idGenerator');
const { logActivity } = require('../utils/auditLogger');

const EXPENSE_CATEGORIES = [
  'Staff Salaries',
  'Food',
  'Electricity',
  'Gas',
  'Water',
  'Internet',
  'Maintenance',
  'Cleaning Supplies',
  'Laundry',
  'Rent',
  'Security',
  'Stationery',
  'Repairs',
  'Other',
];

// @desc    Get expenses with filter, search, summary calculations
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const { category, month, year, search, startDate, endDate, page = 1, limit = 15 } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (month && month !== 'All') {
      query.month = month;
    }

    if (year && year !== 'All') {
      query.year = Number(year);
    }

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { expenseId: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { paidBy: searchRegex },
        { notes: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total, categoryAgg] = await Promise.all([
      Expense.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum),
      Expense.countDocuments(query),
      Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalExpenseAmount = categoryAgg.reduce((sum, item) => sum + item.totalAmount, 0);

    const categoryBreakdown = {};
    categoryAgg.forEach((item) => {
      categoryBreakdown[item._id] = item.totalAmount;
    });

    res.status(200).json({
      success: true,
      data: expenses,
      summary: {
        totalExpenseAmount,
        totalExpensesCount: total,
        categoryBreakdown,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private (Admin, Super Admin, Accountant)
const createExpense = async (req, res, next) => {
  try {
    const { category, description, amount, date, month, year, paidBy, paymentMethod, notes } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount must be a valid positive number.' });
    }

    const expenseId = await generateExpenseId();
    const expenseDate = date ? new Date(date) : new Date();

    const expenseMonth =
      month ||
      expenseDate.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g. "October 2026"
    const expenseYear = year ? Number(year) : expenseDate.getFullYear();

    const expense = await Expense.create({
      expenseId,
      category: category || 'Other',
      description,
      amount: parsedAmount,
      date: expenseDate,
      month: expenseMonth,
      year: expenseYear,
      paidBy: paidBy || 'Hostel Administration',
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
      createdBy: req.user?._id,
    });

    await logActivity({
      req,
      action: 'EXPENSE_RECORDED',
      module: 'Finance',
      recordId: expense._id,
      details: {
        expenseId,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
      },
    });

    res.status(201).json({
      success: true,
      message: `Expense of PKR ${expense.amount.toLocaleString()} logged successfully.`,
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin, Super Admin, Accountant)
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }

    if (req.body.amount) {
      const parsedAmount = Number(req.body.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid expense amount.' });
      }
      req.body.amount = parsedAmount;
    }

    Object.assign(expense, req.body);
    await expense.save();

    await logActivity({
      req,
      action: 'EXPENSE_UPDATED',
      module: 'Finance',
      recordId: expense._id,
      details: { expenseId: expense.expenseId, amount: expense.amount },
    });

    res.status(200).json({
      success: true,
      message: 'Expense record updated successfully.',
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin, Super Admin)
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    await logActivity({
      req,
      action: 'EXPENSE_DELETED',
      module: 'Finance',
      recordId: expense._id,
      details: { expenseId: expense.expenseId, amount: expense.amount },
    });

    res.status(200).json({
      success: true,
      message: 'Expense record deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get expense categories list
// @route   GET /api/expenses/categories
// @access  Private
const getExpenseCategories = (req, res) => {
  res.status(200).json({ success: true, categories: EXPENSE_CATEGORIES });
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  EXPENSE_CATEGORIES,
};
