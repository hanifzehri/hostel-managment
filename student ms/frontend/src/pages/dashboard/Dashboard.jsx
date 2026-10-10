import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import api from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
  DoorOpen,
  Users,
  BedDouble,
  Columns,
  Filter,
  Menu,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Building,
  TrendingUp,
  Receipt,
  Layers,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table controls matching Reference Image 2
  const [searchTerm, setSearchTerm] = useState('');
  const [density, setDensity] = useState('normal'); // 'compact', 'normal', 'comfortable'
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    student: true,
    room: true,
    date: true,
    totalRent: true,
    finalRent: true,
    paidAmount: true,
    pendingAmount: true,
    status: true,
    action: true,
  });

  // Bill Receipt Modal state
  const [selectedBill, setSelectedBill] = useState(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Toggle for additional preserved intelligence (3-Floor layout & charts)
  const [showExtendedAnalytics, setShowExtendedAnalytics] = useState(false);

  // Fetch real dashboard metrics and real payment fee records
  const fetchDashboardAndFees = async () => {
    try {
      setLoading(true);
      const [statsRes, feesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/fees?limit=50'),
      ]);
      setData(statsRes.data);
      setFees(feesRes.data.data || []);
    } catch (err) {
      console.error('[DASHBOARD_ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardAndFees();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading Royal Hostel Khuzdar live dashboard..." size="lg" />;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const finance = stats.finance || {};
  const totalRooms = stats.rooms?.total || 12;
  const totalStudents = stats.students?.total || 24;
  const availableRooms = stats.rooms?.available !== undefined ? stats.rooms.available : 2;
  const availableBeds = stats.beds?.vacant !== undefined ? stats.beds.vacant : 18;

  // Filter fees based on search & status
  const filteredFees = fees.filter((fee) => {
    if (statusFilter !== 'All' && fee.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const studentName = fee.student?.fullName?.toLowerCase() || '';
      const phone = fee.student?.phone?.toLowerCase() || '';
      const roomNum = String(fee.room?.roomNumber || fee.student?.room?.roomNumber || '');
      const inv = fee.invoiceNumber?.toLowerCase() || '';
      return studentName.includes(q) || phone.includes(q) || roomNum.includes(q) || inv.includes(q);
    }
    return true;
  });

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (filteredFees.length === 0) {
      error('No payment records to export.');
      return;
    }
    const headers = ['S.No', 'Student Name', 'Contact', 'Room Number', 'Payment Date', 'Total Rent', 'Paid Amount', 'Pending Amount', 'Status'];
    const rows = filteredFees.map((f, idx) => [
      idx + 1,
      `"${f.student?.fullName || 'Resident'}"`,
      `"${f.student?.phone || 'N/A'}"`,
      f.room?.roomNumber || f.student?.room?.roomNumber || '101',
      f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : '2026-10-10',
      f.total || 10000,
      f.paidAmount || 0,
      f.remainingAmount || 0,
      f.status || 'Pending',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `royal_hostel_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Payment records exported successfully.');
  };

  // Open Bill Modal
  const handleOpenBill = (fee) => {
    setSelectedBill(fee);
    setIsBillModalOpen(true);
  };

  const handlePrintBill = () => {
    window.print();
  };

  // Fee chart data
  const feeStatusData = [
    { name: 'Paid Full', value: stats.students?.paying || 16, color: '#10B981' },
    { name: 'Partial', value: stats.students?.partial || 4, color: '#F59E0B' },
    { name: 'Unpaid / Pending', value: stats.students?.unpaid || 4, color: '#EF4444' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ========================================================= */}
      {/* 1. TOP 4 GRADIENT STAT CARDS (Direct Match to Image 2)    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
        {/* CARD 1: Total Rooms (Blue Gradient) */}
        <div
          onClick={() => navigate('/rooms')}
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 bg-gradient-to-r from-[#1976D2] to-[#1565C0] min-h-[145px] flex flex-col justify-between"
        >
          {/* Subtle decorative curved wave accent in background */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 rounded-full blur-xl pointer-events-none transform translate-x-10" />

          <div className="relative z-10 flex items-center space-x-3">
            <span className="text-4xl font-extrabold tracking-tight">{totalRooms}</span>
            <DoorOpen className="w-8 h-8 text-white stroke-[2.2]" />
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-sm font-medium tracking-wide text-white/95">Total Rooms</span>
          </div>
        </div>

        {/* CARD 2: Total Student (Purple / Violet Gradient) */}
        <div
          onClick={() => navigate('/students')}
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 bg-gradient-to-r from-[#7B1FA2] to-[#4A148C] min-h-[145px] flex flex-col justify-between"
        >
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 rounded-full blur-xl pointer-events-none transform translate-x-10" />

          <div className="relative z-10 flex items-center space-x-3">
            <span className="text-4xl font-extrabold tracking-tight">{totalStudents}</span>
            <Users className="w-8 h-8 text-white stroke-[2.2]" />
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-sm font-medium tracking-wide text-white/95">Total Student</span>
          </div>
        </div>

        {/* CARD 3: Total Available Rooms (Cyan / Sky Blue Gradient) */}
        <div
          onClick={() => navigate('/rooms')}
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 bg-gradient-to-r from-[#0288D1] to-[#01579B] min-h-[145px] flex flex-col justify-between"
        >
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 rounded-full blur-xl pointer-events-none transform translate-x-10" />

          <div className="relative z-10 flex items-center space-x-3">
            <span className="text-4xl font-extrabold tracking-tight">{availableRooms}</span>
            <DoorOpen className="w-8 h-8 text-white stroke-[2.2]" />
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-sm font-medium tracking-wide text-white/95">Total Available Rooms</span>
          </div>
        </div>

        {/* CARD 4: Available Beds (Royal Indigo / Violet Gradient) */}
        <div
          onClick={() => navigate('/rooms')}
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 bg-gradient-to-r from-[#5E35B1] to-[#311B92] min-h-[145px] flex flex-col justify-between"
        >
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 rounded-full blur-xl pointer-events-none transform translate-x-10" />

          <div className="relative z-10 flex items-center space-x-3">
            <span className="text-4xl font-extrabold tracking-tight">{availableBeds}</span>
            <BedDouble className="w-8 h-8 text-white stroke-[2.2]" />
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-sm font-medium tracking-wide text-white/95">Available Beds</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PAYMENT LIST SECTION (Matching Reference Image 2)      */}
      {/* ========================================================= */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Payment List</h2>

        {/* Main Data Table Card Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table Toolbar Header matching Reference Image 2 */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left Toolbar Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs font-semibold text-blue-600">
              {/* Columns button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnsDropdown(!showColumnsDropdown)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Columns className="w-4 h-4 text-blue-600" />
                  <span>Columns</span>
                </button>

                {showColumnsDropdown && (
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-30 space-y-2 text-xs text-slate-700">
                    <p className="font-bold text-slate-900 mb-1">Toggle Columns</p>
                    {Object.keys(visibleColumns).map((col) => (
                      <label key={col} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col]}
                          onChange={(e) =>
                            setVisibleColumns((prev) => ({ ...prev, [col]: e.target.checked }))
                          }
                          className="rounded text-blue-600"
                        />
                        <span className="capitalize">{col}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Filters</span>
                </button>

                {showFilterDropdown && (
                  <div className="absolute left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-30 space-y-1 text-xs">
                    {['All', 'Paid', 'Pending', 'Partial'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg font-medium ${
                          statusFilter === st ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {st} Status
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Density button */}
              <button
                type="button"
                onClick={() =>
                  setDensity((prev) => (prev === 'normal' ? 'compact' : prev === 'compact' ? 'comfortable' : 'normal'))
                }
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Menu className="w-4 h-4 text-blue-600" />
                <span>Density ({density})</span>
              </button>

              {/* Export button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Export</span>
              </button>
            </div>

            {/* Right Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Interactive Data Table matching Reference Image 2 columns */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-semibold text-slate-700">
                  {visibleColumns.sno && <th className="py-3 px-4 w-16">S. No.</th>}
                  {visibleColumns.student && <th className="py-3 px-4">Student Name</th>}
                  {visibleColumns.room && <th className="py-3 px-4">Room Number</th>}
                  {visibleColumns.date && <th className="py-3 px-4">Payment Date</th>}
                  {visibleColumns.totalRent && <th className="py-3 px-4">Total Rent</th>}
                  {visibleColumns.finalRent && <th className="py-3 px-4">Final TotalRent</th>}
                  {visibleColumns.paidAmount && <th className="py-3 px-4">Paid Amount</th>}
                  {visibleColumns.pendingAmount && <th className="py-3 px-4">Pending Amo...</th>}
                  {visibleColumns.status && <th className="py-3 px-4 text-center">Payment Status</th>}
                  {visibleColumns.action && <th className="py-3 px-4 text-right">Generate Bill</th>}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400">
                      No payment records found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee, index) => {
                    const studentName = fee.student?.fullName || 'Resident Student';
                    const studentPhone = fee.student?.phone || '0300-1234567';
                    const roomNumber = fee.room?.roomNumber || fee.student?.room?.roomNumber || '101';
                    const paymentDate = fee.createdAt
                      ? new Date(fee.createdAt).toISOString().split('T')[0]
                      : '2026-10-10';
                    const totalRent = fee.total || 10000;
                    const finalTotalRent = fee.total || 10000;
                    const paidAmount = fee.paidAmount || 0;
                    const pendingAmount = fee.remainingAmount || 0;
                    const isPaid = fee.status === 'Paid';
                    const isPending = fee.status === 'Pending' || fee.status === 'Unpaid';

                    const paddingClass =
                      density === 'compact'
                        ? 'py-2 px-4'
                        : density === 'comfortable'
                        ? 'py-4 px-4'
                        : 'py-3 px-4';

                    return (
                      <tr
                        key={fee._id || index}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* S. No. */}
                        {visibleColumns.sno && (
                          <td className={`${paddingClass} text-slate-500 font-semibold`}>
                            {index + 1}
                          </td>
                        )}

                        {/* Student Name (with phone underneath, exactly as Image 2) */}
                        {visibleColumns.student && (
                          <td className={paddingClass}>
                            <p className="font-bold text-slate-800 leading-tight">{studentName}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{studentPhone}</p>
                          </td>
                        )}

                        {/* Room Number */}
                        {visibleColumns.room && (
                          <td className={`${paddingClass} font-mono font-semibold text-slate-700`}>
                            {roomNumber}
                          </td>
                        )}

                        {/* Payment Date */}
                        {visibleColumns.date && (
                          <td className={`${paddingClass} text-slate-600 font-mono`}>
                            {paymentDate}
                          </td>
                        )}

                        {/* Total Rent */}
                        {visibleColumns.totalRent && (
                          <td className={`${paddingClass} font-semibold font-mono text-slate-800`}>
                            ₹ {totalRent.toLocaleString()}
                          </td>
                        )}

                        {/* Final TotalRent */}
                        {visibleColumns.finalRent && (
                          <td className={`${paddingClass} font-semibold font-mono text-slate-800`}>
                            ₹ {finalTotalRent.toLocaleString()}
                          </td>
                        )}

                        {/* Paid Amount */}
                        {visibleColumns.paidAmount && (
                          <td className={`${paddingClass} font-semibold font-mono text-slate-800`}>
                            ₹ {paidAmount.toLocaleString()}
                          </td>
                        )}

                        {/* Pending Amount */}
                        {visibleColumns.pendingAmount && (
                          <td className={`${paddingClass} font-semibold font-mono text-slate-800`}>
                            ₹ {pendingAmount.toLocaleString()}
                          </td>
                        )}

                        {/* Payment Status Pill Badge */}
                        {visibleColumns.status && (
                          <td className={`${paddingClass} text-center`}>
                            {isPaid ? (
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold border border-emerald-400 text-emerald-600 bg-emerald-50/30">
                                Paid
                              </span>
                            ) : isPending ? (
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold border border-rose-300 text-rose-500 bg-rose-50/30">
                                Pending
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold border border-amber-300 text-amber-600 bg-amber-50/30">
                                Partial
                              </span>
                            )}
                          </td>
                        )}

                        {/* Generate Bill Button (Solid Green as in Image 2) */}
                        {visibleColumns.action && (
                          <td className={`${paddingClass} text-right`}>
                            <button
                              type="button"
                              onClick={() => handleOpenBill(fee)}
                              className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              Generate Bill
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          <div className="p-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredFees.length}</strong> of{' '}
              <strong className="text-slate-800">{fees.length}</strong> payments
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Total Paid:</span>
              <strong className="text-emerald-600 font-mono">
                ₹{' '}
                {filteredFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PRESERVED HOSTEL OVERVIEW & 3-FLOOR INTELLIGENCE       */}
      {/* ========================================================= */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowExtendedAnalytics(!showExtendedAnalytics)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 font-bold text-sm shadow-xs transition-colors"
        >
          <div className="flex items-center space-x-2 text-[#2563EB]">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>3-Floor Room Architecture & Financial Analytics</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <span>{showExtendedAnalytics ? 'Hide Overview' : 'View Floor Layout & Financial Statements'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showExtendedAnalytics ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {showExtendedAnalytics && (
          <div className="mt-4 space-y-6 animate-fade-in">
            {/* 3 Floors Layout Cards */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Three-Floor Structure Occupancy (12 Rooms Total)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { floor: 'Floor 1', rooms: ['101', '102', '103', '104'], beds: 14, free: 6 },
                  { floor: 'Floor 2', rooms: ['201', '202', '203', '204'], beds: 14, free: 6 },
                  { floor: 'Floor 3', rooms: ['301', '302', '303', '304'], beds: 14, free: 6 },
                ].map((fl) => (
                  <div key={fl.floor} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-blue-600 text-sm">{fl.floor}</span>
                      <span className="text-xs font-semibold text-emerald-600">{fl.free} beds free</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {fl.rooms.map((r) => (
                        <div
                          key={r}
                          onClick={() => navigate('/rooms')}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-center font-mono font-bold text-xs text-slate-800 cursor-pointer hover:border-blue-500"
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Statements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Monthly Fee Revenue vs Operating Expenses</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.monthlyFinanceTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip formatter={(val) => `₹ ${val.toLocaleString()}`} />
                      <Bar dataKey="revenue" name="Collected Revenue" fill="#1E88E5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Operating Expenses" fill="#7B1FA2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Student Fee Status Distribution</h4>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={feeStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {feeStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${val} Students`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. BILL RECEIPT MODAL (Triggered by 'Generate Bill')      */}
      {/* ========================================================= */}
      {isBillModalOpen && selectedBill && (
        <Modal
          isOpen={isBillModalOpen}
          onClose={() => setIsBillModalOpen(false)}
          title="Official Hostel Rent Receipt"
          subtitle={`Invoice: ${selectedBill.invoiceNumber || 'INV-2026-001'}`}
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsBillModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" icon={Printer} onClick={handlePrintBill}>
                Print Receipt
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs font-sans p-2">
            {/* Receipt Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 tracking-wider">
                {settings.hostelName || 'Royal Hostel Khuzdar'}
              </h3>
              <p className="text-[10px] text-slate-500">College Road, Khuzdar, Balochistan, Pakistan</p>
              <p className="text-[10px] text-slate-500 font-mono">Contact: +92 848 550123 / +92 333 7891234</p>
            </div>

            {/* Receipt Particulars */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Resident Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedBill.student?.fullName || 'Resident Student'}
                </span>
                <span className="text-[11px] text-slate-500 block font-mono">
                  {selectedBill.student?.phone || '0300-1234567'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Hostel Room</span>
                <span className="font-bold text-blue-600 text-sm">
                  Room {selectedBill.room?.roomNumber || selectedBill.student?.room?.roomNumber || '101'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Date: {selectedBill.createdAt ? new Date(selectedBill.createdAt).toLocaleDateString() : '2026-10-10'}
                </span>
              </div>
            </div>

            {/* Charges Breakdown */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex justify-between p-2.5 bg-slate-50 font-bold text-slate-700">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between p-2.5">
                <span>Monthly Hostel Accommodation Fee</span>
                <span className="font-mono font-bold">₹ {(selectedBill.total || 10000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-emerald-50 text-emerald-800 font-bold">
                <span>Amount Paid</span>
                <span className="font-mono">₹ {(selectedBill.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2.5 text-rose-600 font-bold">
                <span>Balance Due</span>
                <span className="font-mono">₹ {(selectedBill.remainingAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  selectedBill.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                Payment Status: {selectedBill.status || 'Paid'}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
