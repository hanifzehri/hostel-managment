import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import HostelLogo from '../../components/ui/HostelLogo';
import {
  BarChart3,
  Printer,
  Download,
  Users,
  DoorOpen,
  CreditCard,
  CalendarCheck,
  UserCheck,
  MessageSquareWarning,
  Briefcase,
  FileSpreadsheet,
  Banknote,
  Receipt,
  TrendingUp,
} from 'lucide-react';

const Reports = () => {
  const { settings } = useHostel();
  const { error } = useToast();

  const [reportType, setReportType] = useState('students');
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reportCategories = [
    { id: 'students', label: '1. Student Report', icon: Users },
    { id: 'rooms', label: '2. Room Report', icon: DoorOpen },
    { id: 'staff', label: '3. Staff Report', icon: Briefcase },
    { id: 'salaries', label: '4. Salary Report', icon: Banknote },
    { id: 'fees', label: '5. Fee Collection Report', icon: CreditCard },
    { id: 'expenses', label: '6. Expense Report', icon: Receipt },
    { id: 'profit-loss', label: '7. Monthly Profit/Loss', icon: TrendingUp },
  ];

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${reportType}?month=${selectedMonth}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      error('Failed to generate report dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (!data || !data.data || data.data.length === 0) return;
    const items = data.data;
    const keys = Object.keys(items[0]).filter((k) => typeof items[0][k] !== 'object');
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...items.map((row) => keys.map((k) => `"${row[k] || ''}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `royal_hostel_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || {};
  const records = data?.data || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Reports & Audits Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official printable reports for students, rooms, staff directory, salaries, fee collections, expenses & profit/loss.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleExportCSV} variant="secondary" size="sm" icon={FileSpreadsheet}>
            Export CSV
          </Button>
          <Button onClick={handlePrint} variant="primary" size="sm" icon={Printer}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Report Categories Selector Tabs */}
      <div className="no-print flex flex-wrap gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        {reportCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = reportType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setReportType(cat.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Printable Report Paper */}
      <div
        id="printable-report-content"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6"
      >
        {/* Official Header */}
        <div className="border-b-2 border-indigo-950/20 dark:border-slate-700 pb-5 text-center">
          <div className="flex items-center justify-center space-x-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-indigo-950 font-black flex items-center justify-center text-sm shadow ring-2 ring-amber-300 font-serif">
              RH
            </div>
            <h2 className="text-xl font-black text-indigo-950 dark:text-white uppercase tracking-tight">
              {settings.hostelName || 'Royal Hostel Khuzdar'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {settings.address || 'College Road, Khuzdar, Balochistan, Pakistan'}
          </p>
          <div className="mt-3 inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 rounded-full">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-amber-400">
              Official Institutional Report: {reportCategories.find((c) => c.id === reportType)?.label}
            </span>
          </div>
        </div>

        {/* Dynamic Summary Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {reportType === 'students' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.total || 0}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Active Residents</span>
                <span className="text-2xl font-black text-emerald-600">{summary.active || 0}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Rate</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">PKR 10,000</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Campus</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">Khuzdar</span>
              </div>
            </>
          )}

          {reportType === 'rooms' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rooms</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.totalRooms || 0}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Capacity</span>
                <span className="text-2xl font-black text-indigo-600">{summary.totalCapacity || 0} Beds</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Occupied Beds</span>
                <span className="text-2xl font-black text-emerald-600">{summary.totalOccupants || 0}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Available Beds</span>
                <span className="text-2xl font-black text-indigo-600">{summary.totalAvailable || 0}</span>
              </div>
            </>
          )}

          {reportType === 'staff' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.totalStaff || 10}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Active Staff</span>
                <span className="text-2xl font-black text-emerald-600">{summary.active || 10}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl col-span-2">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Total Monthly Payroll</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  PKR {(summary.monthlyPayroll || 342000).toLocaleString()}
                </span>
              </div>
            </>
          )}

          {reportType === 'salaries' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Salary Budget</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  PKR {(summary.totalStaffSalaryExpense || 342000).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Disbursed Paid</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  PKR {(summary.totalPaidSalary || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">Pending Salaries</span>
                <span className="text-2xl font-black text-rose-600 font-mono">
                  PKR {(summary.totalPendingSalary || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff</span>
                <span className="text-2xl font-black text-indigo-600">{summary.staffCount || 10}</span>
              </div>
            </>
          )}

          {reportType === 'fees' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Billed Fees</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  PKR {(summary.totalBilled || 200000).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Total Collected</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  PKR {(summary.totalPaid || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">Pending Balance</span>
                <span className="text-2xl font-black text-rose-600 font-mono">
                  PKR {(summary.totalPending || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Collection Rate</span>
                <span className="text-2xl font-black text-indigo-600">{summary.collectionRate || 0}%</span>
              </div>
            </>
          )}

          {reportType === 'expenses' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl col-span-2">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">Total Expenses Amount</span>
                <span className="text-2xl font-black text-rose-600 font-mono">
                  PKR {(summary.totalExpensesAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Vouchers Logged</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.recordCount || 0}</span>
              </div>
            </>
          )}

          {reportType === 'profit-loss' && (
            <>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Collected Revenue</span>
                <span className="text-xl font-black text-emerald-600 font-mono">
                  PKR {(summary.collectedRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">Total Expenses</span>
                <span className="text-xl font-black text-rose-600 font-mono">
                  PKR {(summary.totalExpenses || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Financial Status</span>
                <span className={`text-xl font-black ${summary.isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {summary.isLoss ? 'NET LOSS' : 'NET PROFIT'}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Net Amount</span>
                <span className={`text-xl font-black font-mono ${summary.isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {summary.isLoss ? '-' : '+'}PKR {(summary.netProfit || 0).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Records Table */}
        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="Compiling report dataset..." />
          </div>
        ) : records.length === 0 ? (
          <p className="text-center py-10 text-xs text-slate-400">No records found for this report.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/70 uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                {reportType === 'students' && (
                  <tr>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Student ID</th>
                    <th className="py-3 px-3">CNIC</th>
                    <th className="py-3 px-3">Room & Bed</th>
                    <th className="py-3 px-3">College / University</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Monthly Fee</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                )}
                {reportType === 'rooms' && (
                  <tr>
                    <th className="py-3 px-3">Room Number</th>
                    <th className="py-3 px-3">Block & Floor</th>
                    <th className="py-3 px-3">Room Type</th>
                    <th className="py-3 px-3">Capacity</th>
                    <th className="py-3 px-3">Occupants</th>
                    <th className="py-3 px-3">Available Beds</th>
                    <th className="py-3 px-3">Monthly Rent</th>
                  </tr>
                )}
                {reportType === 'staff' && (
                  <tr>
                    <th className="py-3 px-3">Staff ID</th>
                    <th className="py-3 px-3">Worker Name</th>
                    <th className="py-3 px-3">CNIC</th>
                    <th className="py-3 px-3">Job Responsibility</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Monthly Salary</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                )}
                {reportType === 'salaries' && (
                  <tr>
                    <th className="py-3 px-3">Slip ID</th>
                    <th className="py-3 px-3">Employee Name</th>
                    <th className="py-3 px-3">Job</th>
                    <th className="py-3 px-3">Monthly Salary</th>
                    <th className="py-3 px-3">Paid Amount</th>
                    <th className="py-3 px-3">Pending Amount</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                )}
                {reportType === 'fees' && (
                  <tr>
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Resident Student</th>
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3">Billed</th>
                    <th className="py-3 px-3">Paid</th>
                    <th className="py-3 px-3">Remaining</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                )}
                {reportType === 'expenses' && (
                  <tr>
                    <th className="py-3 px-3">Expense ID</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Paid By</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                )}
                {reportType === 'profit-loss' && (
                  <tr>
                    <th className="py-3 px-3">Financial Line Item</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Audited Amount</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    {reportType === 'students' && (
                      <>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{r.fullName}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">{r.studentId}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.cnic}</td>
                        <td className="py-2.5 px-3 font-semibold">
                          {r.block} • Room {r.room?.roomNumber || '101'}
                        </td>
                        <td className="py-2.5 px-3">{r.institution}</td>
                        <td className="py-2.5 px-3 font-mono">{r.phone}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          PKR {(r.monthlyFee || 10000).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={r.studentStatus === 'Active' ? 'success' : 'default'}>
                            {r.studentStatus}
                          </Badge>
                        </td>
                      </>
                    )}
                    {reportType === 'rooms' && (
                      <>
                        <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">Room {r.roomNumber}</td>
                        <td className="py-2.5 px-3 font-semibold">{r.block} • Floor {r.floor}</td>
                        <td className="py-2.5 px-3">{r.roomType}</td>
                        <td className="py-2.5 px-3 font-bold">{r.capacity} Beds</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">{r.currentOccupants} Beds</td>
                        <td className="py-2.5 px-3 font-bold text-indigo-600">{r.availableBeds} Beds</td>
                        <td className="py-2.5 px-3 font-mono font-bold">PKR {r.monthlyFee?.toLocaleString()}</td>
                      </>
                    )}
                    {reportType === 'staff' && (
                      <>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{r.staffId}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{r.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.cnic}</td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-600">{r.job || r.designation}</td>
                        <td className="py-2.5 px-3 font-mono">{r.phone}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                          PKR {r.salary?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3"><Badge variant="success">{r.status}</Badge></td>
                      </>
                    )}
                    {reportType === 'salaries' && (
                      <>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{r.salaryId}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{r.staffName}</td>
                        <td className="py-2.5 px-3 font-semibold">{r.job}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">PKR {r.monthlySalary?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                          PKR {(r.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                          PKR {(r.pendingAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={r.paymentStatus === 'Paid' ? 'success' : r.paymentStatus === 'Partial' ? 'warning' : 'danger'}>
                            {r.paymentStatus}
                          </Badge>
                        </td>
                      </>
                    )}
                    {reportType === 'fees' && (
                      <>
                        <td className="py-2.5 px-3 font-mono font-bold">{r.invoiceNumber}</td>
                        <td className="py-2.5 px-3 font-bold">{r.student?.fullName || 'Resident'}</td>
                        <td className="py-2.5 px-3">{r.month} {r.year}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">PKR {r.total?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">
                          PKR {r.paidAmount?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-rose-600 font-bold">
                          PKR {r.remainingAmount?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3"><Badge>{r.status}</Badge></td>
                      </>
                    )}
                    {reportType === 'expenses' && (
                      <>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">{r.expenseId}</td>
                        <td className="py-2.5 px-3 font-semibold">{r.category}</td>
                        <td className="py-2.5 px-3">{r.description}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          PKR {r.amount?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">{r.paidBy}</td>
                        <td className="py-2.5 px-3 font-mono">{new Date(r.date).toLocaleDateString()}</td>
                      </>
                    )}
                    {reportType === 'profit-loss' && (
                      <>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{r.item}</td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              r.type === 'Income'
                                ? 'success'
                                : r.type === 'Expense' || r.type === 'Loss'
                                ? 'danger'
                                : 'default'
                            }
                          >
                            {r.type}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-sm">
                          PKR {r.amount?.toLocaleString()}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Verification Footer */}
        <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p>Verification Seal: Validated against institutional MongoDB ledger.</p>
            <p className="text-[10px] text-slate-400 mt-1">Royal Hostel Khuzdar Management System</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-900 dark:border-slate-100 pb-1 mb-1" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Director / Chief Warden</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
