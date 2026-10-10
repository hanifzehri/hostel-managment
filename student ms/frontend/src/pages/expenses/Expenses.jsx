import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  PieChart as PieIcon,
  Calendar,
  Layers,
  Edit,
  Trash2,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

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

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6', '#f97316',
  '#64748b', '#84cc16', '#a855f7', '#d946ef',
];

const Expenses = () => {
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalExpenseAmount: 0, categoryBreakdown: {} });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const initialForm = {
    category: 'Food',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    month: 'October 2026',
    paidBy: 'Hostel Administration',
    paymentMethod: 'Cash',
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const monthsList = [
    'October 2026',
    'September 2026',
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (selectedMonth !== 'All') params.append('month', selectedMonth);
      if (search) params.append('search', search);

      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.data.data || []);
      setSummary(res.data.summary || { totalExpenseAmount: 0, categoryBreakdown: {} });
      setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
      error('Failed to load expense records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, selectedMonth]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  const openAddModal = () => {
    setSelectedExpense(null);
    setFormData({ ...initialForm, month: selectedMonth });
    setModalOpen(true);
  };

  const openEditModal = (exp) => {
    setSelectedExpense(exp);
    setFormData({
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      date: new Date(exp.date).toISOString().split('T')[0],
      month: exp.month,
      paidBy: exp.paidBy || '',
      paymentMethod: exp.paymentMethod || 'Cash',
      notes: exp.notes || '',
    });
    setModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (selectedExpense) {
        await api.put(`/expenses/${selectedExpense._id}`, formData);
        success('Expense record updated successfully.');
      } else {
        await api.post('/expenses', formData);
        success('New hostel expense logged successfully.');
      }
      setModalOpen(false);
      fetchExpenses();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save expense.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/expenses/${deletingId}`);
      success('Expense record deleted successfully.');
      setDeleteConfirmOpen(false);
      fetchExpenses();
    } catch (err) {
      error('Failed to delete expense record.');
    }
  };

  // Pie chart data
  const pieData = Object.entries(summary.categoryBreakdown || {}).map(([cat, amt]) => ({
    name: cat,
    value: amt,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Operational Expenditure Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Expense Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track utility bills, staff payroll, food supplies, building lease, and campus maintenance expenditures.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'accountant']) && (
          <div className="flex items-center space-x-2">
            <Button onClick={openAddModal} variant="primary" size="sm" icon={Plus}>
              Log New Expense
            </Button>
          </div>
        )}
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Monthly Expenses"
          value={`PKR ${(summary.totalExpenseAmount || 0).toLocaleString()}`}
          subtext={`${selectedMonth} operational expenditures`}
          icon={DollarSign}
          color="rose"
        />
        <StatCard
          title="Top Cost Center"
          value={
            pieData.length > 0
              ? pieData.sort((a, b) => b.value - a.value)[0]?.name || 'Utilities'
              : 'N/A'
          }
          subtext="Highest single expense module"
          icon={Layers}
          color="amber"
        />
        <StatCard
          title="Recorded Expense Vouchers"
          value={pagination.total || 0}
          subtext="Audited invoices in active ledger"
          icon={Receipt}
          color="indigo"
        />
      </div>

      {/* Category Chart & Quick Breakdown */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="lg:col-span-1 flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Cost Allocation Breakdown
            </h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `PKR ${val.toLocaleString()}`}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Category Summary (Formula: Staff Salaries + Food + Utilities + Maintenance + Other)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pieData.map((entry, idx) => (
                <div
                  key={entry.name}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center space-x-2"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {entry.name}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      PKR {entry.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses by description, paid by, ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Loading expense ledger..." size="lg" />
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No Expenses Logged"
            description={`No expense entries found for ${selectedMonth} matching your criteria.`}
            action={
              <Button onClick={openAddModal} variant="primary" size="sm" icon={Plus}>
                Add First Expense
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Expense ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((exp) => (
                  <tr
                    key={exp._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {exp.expenseId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      PKR {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-semibold">
                      {exp.month}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {exp.paidBy || 'Hostel Admin'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="default">{exp.paymentMethod || 'Cash'}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {hasRole(['superadmin', 'admin', 'accountant']) && (
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {hasRole(['superadmin', 'admin']) && (
                        <button
                          onClick={() => {
                            setDeletingId(exp._id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedExpense ? `Edit Expense — ${selectedExpense.expenseId}` : 'Log Hostel Expense'}
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Amount (PKR) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Weekly grocery supply for hostel kitchen"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Month *
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online">Online Banking</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Paid By
            </label>
            <input
              type="text"
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              placeholder="e.g. Hostel Manager / Accountant"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Notes
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes or vendor reference..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button onClick={() => setModalOpen(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={modalLoading}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense voucher? This action cannot be undone."
      />
    </div>
  );
};

export default Expenses;
