import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  CreditCard,
  Plus,
  Printer,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Download,
} from 'lucide-react';

const Fees = () => {
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Active students for dropdown
  const [activeStudents, setActiveStudents] = useState([]);

  // New Invoice Form
  const initialInvoiceData = {
    studentId: '',
    month: new Date().toLocaleString('default', { month: 'short' }),
    year: new Date().getFullYear(),
    feeType: 'Hostel Fee',
    amount: 18000,
    discount: 0,
    fine: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  };
  const [invoiceData, setInvoiceData] = useState(initialInvoiceData);

  // Payment Form
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    transactionId: '',
    notes: 'Payment received.',
  });

  // Bulk Generation Form
  const [bulkData, setBulkData] = useState({
    month: new Date().toLocaleString('default', { month: 'short' }),
    year: new Date().getFullYear(),
    feeType: 'Hostel Fee',
    defaultAmount: 18000,
  });

  const fetchFees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (search) params.append('search', search);
      if (monthFilter !== 'All') params.append('month', monthFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await api.get(`/fees?${params.toString()}`);
      setFees(res.data.data || []);
      setSummary(res.data.summary || { totalAmount: 0, totalPaid: 0, totalPending: 0 });
      setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
      error('Failed to load fee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [pagination.page, monthFilter, statusFilter]);

  // Load active students for modals
  const loadStudents = async () => {
    try {
      const res = await api.get('/students?status=Active');
      const list = res.data.data || [];
      setActiveStudents(list);
      if (list[0]) setInvoiceData((prev) => ({ ...prev, studentId: list[0]._id }));
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    loadStudents();
    setCreateInvoiceOpen(true);
  };

  const openPaymentModal = (fee) => {
    setSelectedFee(fee);
    setPaymentData({
      amount: fee.remainingAmount,
      paymentMethod: 'Bank Transfer',
      transactionId: '',
      notes: 'Payment cleared.',
    });
    setRecordPaymentOpen(true);
  };

  const openReceiptModal = async (fee) => {
    try {
      const res = await api.get(`/fees/${fee._id}`);
      setSelectedFee(res.data.data);
      const payments = res.data.data.payments || [];
      setSelectedReceiptPayment(payments[0] || null);
      setReceiptModalOpen(true);
    } catch (err) {
      error('Failed to load invoice receipt.');
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/fees', invoiceData);
      success('Fee invoice generated successfully.');
      setCreateInvoiceOpen(false);
      fetchFees();
    } catch (err) {
      error(err.response?.data?.message || 'Invoice creation failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.post(`/fees/${selectedFee._id}/payments`, paymentData);
      success('Payment recorded successfully.');
      setRecordPaymentOpen(false);
      fetchFees();
      // Automatically show receipt preview
      openReceiptModal(res.data.fee);
    } catch (err) {
      error(err.response?.data?.message || 'Payment recording failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await api.post('/fees/generate-bulk', bulkData);
      success(res.data.message || 'Bulk fee invoices generated.');
      setBulkGenerateOpen(false);
      fetchFees();
    } catch (err) {
      error(err.response?.data?.message || 'Bulk generation failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Fee Billing & Collection Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track student billing, record multi-channel payments, and generate official printable receipts.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'accountant']) && (
          <div className="flex items-center space-x-2">
            <Button onClick={() => setBulkGenerateOpen(true)} variant="outline" size="sm" icon={Layers}>
              Bulk Generate Fees
            </Button>
            <Button onClick={openCreateModal} variant="primary" size="sm" icon={Plus}>
              New Fee Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {settings.currency} {summary.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">Collected Revenue</span>
          <p className="text-2xl font-black text-[#10B981] mt-1">
            {settings.currency} {summary.totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Outstanding Dues</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {settings.currency} {summary.totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="no-print bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFees()}
            placeholder="Search invoice #, student name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>

          <Button onClick={fetchFees} variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving fee invoices..." />
        ) : fees.length === 0 ? (
          <EmptyState
            title="No fee records found"
            description="Create your first fee invoice or run bulk generation for all active residents."
            actionLabel="Generate Invoice"
            onAction={openCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Billing Period</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fees.map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {fee.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {fee.student?.fullName || 'Student'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {fee.student?.studentId || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {fee.month} {fee.year}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{fee.feeType}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      {settings.currency} {fee.total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                      {settings.currency} {fee.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600 font-mono">
                      {settings.currency} {fee.remainingAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{fee.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {fee.remainingAmount > 0 && hasRole(['superadmin', 'admin', 'accountant']) && (
                          <button
                            onClick={() => openPaymentModal(fee)}
                            title="Collect Payment"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 font-bold transition-colors"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => openReceiptModal(fee)}
                          title="Print Receipt / Invoice"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        title="Record Fee Payment"
        subtitle={`Invoice #${selectedFee?.invoiceNumber} for ${selectedFee?.student?.fullName}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecordPayment} loading={modalLoading}>
              Confirm Payment & Print Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Payment Amount ({settings.currency}) *
            </label>
            <input
              type="number"
              min="1"
              max={selectedFee?.remainingAmount}
              required
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Remaining balance due: {settings.currency} {selectedFee?.remainingAmount?.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Payment Method
            </label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="Cash">Cash at Office</option>
              <option value="Bank Transfer">Bank Transfer (Online)</option>
              <option value="Online">Online Gateway / Mobile Wallet</option>
              <option value="Card">POS Card Terminal</option>
              <option value="Cheque">Bank Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Transaction ID / Ref #
            </label>
            <input
              type="text"
              value={paymentData.transactionId}
              onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
              placeholder="e.g. TXN-123456"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
        </form>
      </Modal>

      {/* Create Single Invoice Modal */}
      <Modal
        isOpen={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        title="Create Fee Invoice"
        subtitle="Issue personalized monthly or security fee invoice to a resident."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateInvoice} loading={modalLoading}>
              Generate Invoice
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Select Resident *
            </label>
            <select
              required
              value={invoiceData.studentId}
              onChange={(e) => setInvoiceData({ ...invoiceData, studentId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              {activeStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId} • Room {s.room?.roomNumber || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Month</label>
              <select
                value={invoiceData.month}
                onChange={(e) => setInvoiceData({ ...invoiceData, month: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Fee Type</label>
              <select
                value={invoiceData.feeType}
                onChange={(e) => setInvoiceData({ ...invoiceData, feeType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="Hostel Fee">Hostel Fee</option>
                <option value="Mess Fee">Mess Fee</option>
                <option value="Security Deposit">Security Deposit</option>
                <option value="Utility Fee">Utility Fee</option>
                <option value="Fine">Fine / Penalty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Amount ({settings.currency}) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={invoiceData.amount}
                onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Bulk Generate Modal */}
      <Modal
        isOpen={bulkGenerateOpen}
        onClose={() => setBulkGenerateOpen(false)}
        title="1-Click Bulk Monthly Fee Generation"
        subtitle="Automatically creates invoices for all active residents who have not yet been billed for the selected month."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkGenerateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkGenerate} loading={modalLoading}>
              Generate Invoices Now
            </Button>
          </>
        }
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Billing Month</label>
            <select
              value={bulkData.month}
              onChange={(e) => setBulkData({ ...bulkData, month: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Standard Amount ({settings.currency})
            </label>
            <input
              type="number"
              min="1000"
              value={bulkData.defaultAmount}
              onChange={(e) => setBulkData({ ...bulkData, defaultAmount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
            />
          </div>
        </form>
      </Modal>

      {/* PRINTABLE OFFICIAL FEE RECEIPT MODAL */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Hostel Fee Receipt"
        subtitle="Official financial statement copy"
        maxWidth="max-w-2xl"
        footer={
          <div className="no-print flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400">Press Print or Ctrl+P to save as PDF.</span>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setReceiptModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => window.print()} icon={Printer}>
                Print Receipt
              </Button>
            </div>
          </div>
        }
      >
        {selectedFee && (
          <div className="printable-receipt-card bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 space-y-6 select-none font-sans">
            {/* Header Letterhead */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                {settings.hostelName}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                Contact: {settings.phone} • {settings.email}
              </p>
              <div className="mt-2 inline-block px-3 py-0.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded">
                Official Fee Payment Voucher
              </div>
            </div>

            {/* Voucher Particulars Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500">Student Name:</span>{' '}
                  <strong className="text-slate-900 font-bold">{selectedFee.student?.fullName}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Student ID:</span>{' '}
                  <strong className="font-mono">{selectedFee.student?.studentId}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Institution:</span>{' '}
                  <span>{selectedFee.student?.institution}</span>
                </p>
              </div>

              <div className="space-y-1 text-right">
                <p>
                  <span className="text-slate-500">Invoice Number:</span>{' '}
                  <strong className="font-mono">{selectedFee.invoiceNumber}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Billing Period:</span>{' '}
                  <strong>
                    {selectedFee.month} {selectedFee.year}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Issue Date:</span>{' '}
                  <span>{new Date(selectedFee.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* Fee Itemization Table */}
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 uppercase font-bold text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Billed Amount</th>
                  <th className="py-2 px-3 text-right">Paid Amount</th>
                  <th className="py-2 px-3 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-3 font-medium">
                    {selectedFee.feeType} ({selectedFee.month} {selectedFee.year})
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {settings.currency} {selectedFee.total?.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    {settings.currency} {selectedFee.paidAmount?.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                    {settings.currency} {selectedFee.remainingAmount?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Payment Summary & Signature */}
            <div className="pt-6 flex justify-between items-end text-xs">
              <div>
                <p className="text-slate-500 text-[11px]">Payment Mode: {selectedFee.paymentMethod || 'Cash'}</p>
                <p className="text-slate-500 text-[11px]">Status: {selectedFee.status}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Computer generated electronic receipt. Valid without signature stamp.
                </p>
              </div>

              <div className="text-center">
                <div className="w-36 border-b border-slate-900 pb-1 mb-1" />
                <span className="text-[11px] font-bold text-slate-800">Accounts Department</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Fees;
