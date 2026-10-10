import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import api from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import HostelLogo from '../../components/ui/HostelLogo';
import {
  Users,
  BedDouble,
  DoorOpen,
  CalendarCheck,
  CreditCard,
  MessageSquareWarning,
  UserCheck,
  FileText,
  UserPlus,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  Building,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Receipt,
  Banknote,
  DollarSign,
  IdCard,
  ArrowRightLeft,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

const THEME_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#101828'];

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = useHostel();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      console.error('[DASHBOARD_ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading Royal Hostel Khuzdar live metrics..." size="lg" />;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const finance = stats.finance || {};
  const isLoss = finance.isLoss;
  const announcements = data?.activeAnnouncements || [];
  const maxCapacity = stats.students?.maxCapacity || 40;
  const totalStudents = stats.students?.total || 24;

  // Fee collection pie data using the 4-color palette
  const feeStatusData = [
    { name: 'Paid Full', value: stats.students?.paying || 16, color: '#10B981' },
    { name: 'Partial', value: stats.students?.partial || 4, color: '#F59E0B' },
    { name: 'Unpaid / Pending', value: stats.students?.unpaid || 4, color: '#EF4444' },
  ].filter((item) => item.value > 0);

  // Floor occupancy data (Floors 1, 2, 3)
  const floorOccupancy = charts.floorOccupancy || [
    { _id: '1', totalRooms: 4, totalCapacity: 14, totalOccupants: 8, availableBeds: 6 },
    { _id: '2', totalRooms: 4, totalCapacity: 14, totalOccupants: 8, availableBeds: 6 },
    { _id: '3', totalRooms: 4, totalCapacity: 14, totalOccupants: 8, availableBeds: 6 },
  ];

  const expenseData = charts.expenseChartData || [];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome & Branding Banner (Deep Navy #101828 + Primary Blue #2563EB) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#101828] text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <HostelLogo size="lg" variant="light" subtitle="Premier Resident Living • Khuzdar, Balochistan" />

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-2 text-white">
                Executive Hostel Operations Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
                Logged in as <strong className="text-[#06B6D4]">{user?.name || 'Administrator'}</strong>. Monitoring{' '}
                <strong className="text-white font-mono">{totalStudents} / {maxCapacity} residents</strong> across{' '}
                <strong className="text-white">3 floors (12 rooms)</strong> at{' '}
                <strong className="text-[#10B981] font-mono">{stats.beds?.occupancyRate || 60}% occupancy</strong>.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => navigate('/students')}
              variant="primary"
              size="sm"
              icon={Users}
            >
              {totalStudents} Students
            </Button>
            <Button
              onClick={() => navigate('/rooms')}
              variant="outline"
              size="sm"
              icon={Building}
              className="text-white border-slate-700 hover:bg-slate-800"
            >
              12 Rooms Hub
            </Button>
            <Button
              onClick={() => navigate('/id-cards')}
              variant="outline"
              size="sm"
              icon={IdCard}
              className="text-white border-slate-700 hover:bg-slate-800"
            >
              Smart Cards
            </Button>
            <Button
              onClick={() => navigate('/fees')}
              variant="outline"
              size="sm"
              icon={CreditCard}
              className="text-white border-slate-700 hover:bg-slate-800"
            >
              Fee Invoices
            </Button>
            <Button
              onClick={() => navigate('/financial-report')}
              variant="outline"
              size="sm"
              icon={TrendingUp}
              className="text-white border-slate-700 hover:bg-slate-800"
            >
              Profit & Loss
            </Button>
          </div>
        </div>

        {/* Ambient Decorative Accents */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Announcements Notice if any */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-[#1D2939] border border-blue-200/60 dark:border-slate-800 flex items-start space-x-3.5">
          <AlertCircle className="w-5 h-5 text-[#2563EB] dark:text-[#06B6D4] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4]">
              Hostel Notice: {announcements[0].title}
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
              {announcements[0].message}
            </p>
          </div>
          <Link
            to="/announcements"
            className="text-xs font-bold text-[#2563EB] dark:text-[#06B6D4] hover:underline shrink-0"
          >
            All Notices
          </Link>
        </div>
      )}

      {/* 2. Key Operational & Financial Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-[#101828] dark:text-white uppercase tracking-wider">
            Key Operational & Financial Indicators
          </h2>
          <span className="text-xs font-bold text-[#2563EB] dark:text-[#06B6D4]">
            Capacity: {totalStudents} / {maxCapacity} Max Residents
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Students with Max 40 Capacity */}
          <StatCard
            title="Total Students"
            value={`${totalStudents} / ${maxCapacity}`}
            subtext={`${stats.students?.active || totalStudents} Active residents`}
            icon={Users}
            color="primary"
            onClick={() => navigate('/students')}
          />

          {/* 2. Room Occupancy (12 Rooms Total) */}
          <StatCard
            title="Room Occupancy"
            value={`${(stats.rooms?.total || 12) - (stats.rooms?.available || 0)} / ${stats.rooms?.total || 12}`}
            subtext={`${stats.rooms?.full || 0} Full • ${stats.rooms?.partiallyOccupied || 0} Partial`}
            icon={Building}
            color="navy"
            onClick={() => navigate('/rooms')}
          />

          {/* 3. Available Beds */}
          <StatCard
            title="Available Beds"
            value={stats.beds?.vacant || 18}
            subtext={`${stats.beds?.occupied || 24} Occupied (${stats.beds?.occupancyRate || 57}%)`}
            icon={BedDouble}
            color="cyan"
            onClick={() => navigate('/rooms')}
          />

          {/* 4. Total Monthly Fees (Collected Revenue) */}
          <StatCard
            title="Total Monthly Fees"
            value={`PKR ${(finance.monthlyRevenue || 240000).toLocaleString()}`}
            subtext="Fee collections received"
            icon={DollarSign}
            color="green"
            onClick={() => navigate('/fees')}
          />

          {/* 5. Pending Payments */}
          <StatCard
            title="Pending Payments"
            value={`PKR ${(finance.pendingStudentFees || 45000).toLocaleString()}`}
            subtext="Uncollected student dues this month"
            icon={Clock}
            color="amber"
            onClick={() => navigate('/fees')}
          />
        </div>
      </div>

      {/* 3. Three-Floor Structure Quick Overview (Floors 1, 2, 3 with 4 Rooms Each) */}
      <div className="bg-white dark:bg-[#1D2939] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center space-x-2 text-[#2563EB] dark:text-[#06B6D4] text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Three-Floor Hostel Architecture (12 Rooms Total)</span>
            </div>
            <h3 className="text-base font-black text-[#101828] dark:text-white">
              Floor & Room Occupancy Breakdown
            </h3>
          </div>
          <Link
            to="/rooms"
            className="text-xs font-bold text-[#2563EB] dark:text-[#06B6D4] hover:underline flex items-center"
          >
            Manage Rooms & Capacity <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {['1', '2', '3'].map((floorNum) => {
            const floorData = floorOccupancy.find((f) => String(f._id) === floorNum) || {
              totalRooms: 4,
              totalCapacity: 14,
              totalOccupants: 8,
              availableBeds: 6,
            };
            const roomList =
              floorNum === '1'
                ? ['101', '102', '103', '104']
                : floorNum === '2'
                ? ['201', '202', '203', '204']
                : ['301', '302', '303', '304'];

            const occRate = floorData.totalCapacity > 0
              ? Math.round((floorData.totalOccupants / floorData.totalCapacity) * 100)
              : 0;

            return (
              <div
                key={floorNum}
                className="bg-[#F8FAFC] dark:bg-[#101828] rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4]">
                      Floor {floorNum}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {occRate}% Full
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-extrabold text-[#101828] dark:text-white">
                    <span>Rooms {roomList[0]} - {roomList[3]}</span>
                    <span className="text-xs font-mono font-bold text-[#10B981]">
                      {floorData.availableBeds} beds free
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden my-3">
                    <div
                      className={`h-full transition-all ${
                        occRate >= 90
                          ? 'bg-[#EF4444]'
                          : occRate >= 50
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#10B981]'
                      }`}
                      style={{ width: `${Math.min(100, occRate)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {roomList.map((roomNum) => (
                      <div
                        key={roomNum}
                        onClick={() => navigate('/rooms')}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-[#2563EB]"
                      >
                        <span className="text-[10px] font-mono font-bold text-[#101828] dark:text-white block">
                          {roomNum}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Occupants: <strong className="text-[#101828] dark:text-white">{floorData.totalOccupants}</strong></span>
                  <span>Capacity: <strong className="text-[#101828] dark:text-white">{floorData.totalCapacity}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Primary Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Revenue vs Expenses */}
        <div className="bg-white dark:bg-[#1D2939] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#101828] dark:text-white">
                Monthly Fee Revenue vs Hostel Expenses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Financial performance comparisons in PKR
              </p>
            </div>
            <Link
              to="/financial-report"
              className="text-xs font-bold text-[#2563EB] dark:text-[#06B6D4] hover:underline flex items-center"
            >
              Statement <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.monthlyFinanceTrend || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val) => `PKR ${val.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: '#101828',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Fee Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Hostel Expenses" fill="#1D2939" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Student Fee Payment Status Distribution */}
        <div className="bg-white dark:bg-[#1D2939] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#101828] dark:text-white">
                Student Monthly Fee Status ({totalStudents} Students)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paid in Full vs Partial vs Pending Dues
              </p>
            </div>
            <Link to="/fees" className="text-xs font-bold text-[#2563EB] dark:text-[#06B6D4] hover:underline">
              Manage Fees
            </Link>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `${val} Students`}
                  contentStyle={{ backgroundColor: '#101828', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
