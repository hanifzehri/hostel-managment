import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import {
  Banknote,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Calendar,
  Sparkles,
  DollarSign,
  User,
  CreditCard,
  Layers,
} from 'lucide-react';

const SalaryManagement = () => {
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [salaries, setSalaries] = useState([]);
  const [summary, setSummary] = useState({
    totalStaffSalaryExpense: 342000,
    totalPaid: 0,
    totalPending: 0,
    activeStaffCount: 10,
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Print voucher modal
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherRecord, setVoucherRecord] = useState(null);

  const monthsList = [
    'October 2026',
    'September 2026',
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
  ];

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (selectedMonth !== 'All') params.append('month', selectedMonth);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/salaries?${params.toString()}`);
      setSalaries(res.data.data || []);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
      error('Failed to load salary roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSalaries();
  };

  const handleGenerateBatch = async () => {
    try {
      setLoading(true);
      const res = await api.post('/salaries/generate-batch', { month: selectedMonth });
      success(res.data.message || 'Batch monthly salary slips processed.');
      fetchSalaries();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to generate monthly slips.');
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = (sal) => {
    setSelectedSalary(sal);
    setPayAmount(sal.pendingAmount || sal.monthlySalary);
    setPaymentMethod('Bank Transfer');
    setPaymentNotes(`Monthly salary disbursement for ${sal.month}`);
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedSalary) return;
    setModalLoading(true);
    try {
      const res = await api.put(`/salaries/${selectedSalary._id}/pay`, {
        amount: Number(payAmount),
        paymentMethod,
        notes: paymentNotes,
      });
      success(res.data.message || 'Salary payment recorded successfully.');
      setPaymentModalOpen(false);
      fetchSalaries();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record salary payment.');
    } finally {
      setModalLoading(false);
    }
  };

  const openVoucherModal = (sal) => {
    setVoucherRecord(sal);
    setVoucherModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Banknote className="w-4 h-4" />
            <span>Staff Payroll & Compensation Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Staff Salary Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage monthly compensations, calculate total salary expenses dynamically, and issue staff salary vouchers.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'accountant']) && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleGenerateBatch}
              variant="primary"
              size="sm"
              icon={Sparkles}
            >
              Generate {selectedMonth} Roster
            </Button>
          </div>
        )}
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff Salary Expense"
          value={`PKR ${(summary.totalStaffSalaryExpense || 342000).toLocaleString()}`}
          subtext="Calculated dynamically across 10 staff roles"
          icon={Banknote}
          color="indigo"
        />
        <StatCard
          title="Total Salaries Paid"
          value={`PKR ${(summary.totalPaid || 0).toLocaleString()}`}
          subtext={`${selectedMonth} disbursed payroll`}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Pending Staff Salaries"
          value={`PKR ${(summary.totalPending || 0).toLocaleString()}`}
          subtext="Awaiting disbursement this month"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Active Hostel Workers"
          value={summary.activeStaffCount || 10}
          subtext="Manager, cooks, guards, maintenance & helpers"
          icon={User}
          color="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by worker name, ID, or job..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Salary Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Computing staff payroll records..." size="lg" />
          </div>
        ) : salaries.length === 0 ? (
          <EmptyState
            title="No Salary Records Found"
            description={`No payroll records found for ${selectedMonth}. Click 'Generate Roster' to auto-populate slips for all 10 workers.`}
            action={
              <Button onClick={handleGenerateBatch} variant="primary" size="sm" icon={Sparkles}>
                Generate {selectedMonth} Roster
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Slip ID</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Job Responsibility</th>
                  <th className="py-3 px-4">Monthly Salary</th>
                  <th className="py-3 px-4">Salary Paid</th>
                  <th className="py-3 px-4">Salary Pending</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salaries.map((sal) => {
                  return (
                    <tr
                      key={sal._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {sal.salaryId}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                            {sal.staffName.charAt(0)}
                          </div>
                          <span>{sal.staffName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {sal.job}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                        PKR {sal.monthlySalary.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        PKR {(sal.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600 dark:text-rose-400">
                        PKR {(sal.pendingAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">
                        {sal.paymentDate ? new Date(sal.paymentDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            sal.paymentStatus === 'Paid'
                              ? 'success'
                              : sal.paymentStatus === 'Partial'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {sal.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {sal.paymentStatus !== 'Paid' && hasRole(['superadmin', 'admin', 'accountant']) && (
                          <Button
                            onClick={() => openPayModal(sal)}
                            variant="primary"
                            size="sm"
                            className="text-[11px] py-1 px-2.5"
                          >
                            Disburse
                          </Button>
                        )}
                        <Button
                          onClick={() => openVoucherModal(sal)}
                          variant="secondary"
                          size="sm"
                          icon={Printer}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Voucher
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disburse Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Disburse Salary — ${selectedSalary?.staffName}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
            <p className="text-slate-500 dark:text-slate-400">
              Worker: <strong className="text-slate-900 dark:text-white">{selectedSalary?.staffName}</strong> (
              {selectedSalary?.job})
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Monthly Salary: <strong className="text-slate-900 dark:text-white">PKR {selectedSalary?.monthlySalary.toLocaleString()}</strong>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Already Paid: <strong className="text-emerald-600">PKR {selectedSalary?.paidAmount?.toLocaleString()}</strong> | Remaining:{' '}
              <strong className="text-rose-500">PKR {selectedSalary?.pendingAmount?.toLocaleString()}</strong>
            </p>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Payment Amount (PKR) *
            </label>
            <input
              type="number"
              required
              min="1"
              max={selectedSalary?.pendingAmount || selectedSalary?.monthlySalary}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash Handover</option>
              <option value="Cheque">Crossed Cheque</option>
              <option value="Online">Online Banking (EasyPaisa/JazzCash)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Notes / Transaction Memo
            </label>
            <textarea
              rows="2"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button onClick={() => setPaymentModalOpen(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={modalLoading}>
              Confirm Disbursement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Salary Slip Modal */}
      <Modal
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        title="Official Staff Salary Voucher"
        size="lg"
      >
        {voucherRecord && (
          <div className="space-y-6">
            <div
              id="printable-salary-voucher"
              className="p-6 bg-white dark:bg-slate-900 border-2 border-indigo-950/20 dark:border-slate-700 rounded-2xl shadow-sm text-slate-900 dark:text-white select-none"
            >
              {/* Header */}
              <div className="border-b-2 border-indigo-900/40 pb-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-indigo-950 font-black flex items-center justify-center text-sm shadow">
                    RH
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-indigo-950 dark:text-white uppercase">
                    {settings.hostelName || 'Royal Hostel Khuzdar'}
                  </h2>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {settings.address || 'College Road, Khuzdar, Balochistan, Pakistan'}
                </p>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-400 mt-2">
                  Official Monthly Salary Disbursement Voucher
                </p>
              </div>

              {/* Voucher Meta */}
              <div className="grid grid-cols-2 gap-4 my-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Voucher ID:</span>
                  <span className="font-mono font-bold">{voucherRecord.salaryId}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold">Salary Month:</span>
                  <span className="font-bold">{voucherRecord.month}</span>
                </div>
              </div>

              {/* Staff Details */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Employee Name:</span>
                  <strong className="text-slate-900 dark:text-white">{voucherRecord.staffName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Job Responsibility:</span>
                  <strong>{voucherRecord.job}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Designated Monthly Salary:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    PKR {voucherRecord.monthlySalary.toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Amount Paid:</span>
                  <strong className="text-emerald-600">PKR {(voucherRecord.paidAmount || 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Balance Pending:</span>
                  <strong className="text-rose-500">PKR {(voucherRecord.pendingAmount || 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payment Status:</span>
                  <strong className="uppercase">{voucherRecord.paymentStatus}</strong>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs text-slate-500">
                <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-semibold">
                  Employee Signature / Thumb Impression
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-semibold">
                  Hostel Accountant / Warden Authorization
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button onClick={() => setVoucherModalOpen(false)} variant="secondary" size="sm">
                Close
              </Button>
              <Button onClick={() => window.print()} variant="primary" size="sm" icon={Printer}>
                Print Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalaryManagement;
