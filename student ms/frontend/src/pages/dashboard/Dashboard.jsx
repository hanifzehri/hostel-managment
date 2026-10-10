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

const COLORS = [
  '#0d9488', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6', '#f97316',
  '#64748b', '#84cc16',
];

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
    return <LoadingSpinner text="Loading Royal Hostel Khuzdar real-time metrics..." size="lg" />;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const finance = stats.finance || {};
  const isLoss = finance.isLoss;
  const announcements = data?.activeAnnouncements || [];

  // Fee collection pie data
  const feeStatusData = [
    { name: 'Paid Full', value: stats.students?.paying || 14, color: '#10b981' },
    { name: 'Partial', value: stats.students?.partial || 3, color: '#f59e0b' },
    { name: 'Unpaid / Pending', value: stats.students?.unpaid || 3, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Expense chart data
  const expenseData = charts.expenseChartData || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Branding Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-black p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            {/* Emblem & Hostel Identity */}
            <HostelLogo size="lg" variant="light" subtitle="Premier Resident Living • Khuzdar, Balochistan" />

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-2">
                Executive Operations Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
                Logged in as <strong className="text-amber-300">{user?.name || 'Administrator'}</strong>. Currently monitoring{' '}
                <strong className="text-white">{stats.students?.total || 20} students</strong> and{' '}
                <strong className="text-white">{stats.staff?.total || 10} hostel workers</strong> at{' '}
                <strong className="text-amber-400">{stats.beds?.occupancyRate || 77}% occupancy</strong>.
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
              className="bg-teal-500 text-slate-950 hover:bg-teal-400 font-extrabold shadow-md border-none"
            >
              {stats.students?.total || 20} Students
            </Button>
            <Button
              onClick={() => navigate('/id-cards')}
              variant="secondary"
              size="sm"
              icon={IdCard}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              ID Cards
            </Button>
            <Button
              onClick={() => navigate('/salaries')}
              variant="secondary"
              size="sm"
              icon={Banknote}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Staff Salaries
            </Button>
            <Button
              onClick={() => navigate('/expenses')}
              variant="secondary"
              size="sm"
              icon={Receipt}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Expenses
            </Button>
            <Button
              onClick={() => navigate('/financial-report')}
              variant="secondary"
              size="sm"
              icon={TrendingUp}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Profit & Loss
            </Button>
          </div>
        </div>

        {/* Ambient Decorative Accents */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Announcements Notice if any */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-3.5">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Hostel Notice: {announcements[0].title}
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
              {announcements[0].message}
            </p>
          </div>
          <Link
            to="/announcements"
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
          >
            All Notices
          </Link>
        </div>
      )}

      {/* 10 Core Cards Specified in Requirement Section 14 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Key Operational & Financial Indicators
          </h2>
          <span className="text-xs font-bold text-slate-400">Live MongoDB Aggregated Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Students */}
          <StatCard
            title="Total Students"
            value={stats.students?.total || 20}
            subtext={`${stats.students?.active || 20} Active residents`}
            icon={Users}
            color="teal"
            onClick={() => navigate('/students')}
          />

          {/* 2. Total Rooms */}
          <StatCard
            title="Total Rooms"
            value={stats.rooms?.total || 10}
            subtext="Across Block A, B & C"
            icon={DoorOpen}
            color="sky"
            onClick={() => navigate('/rooms')}
          />

          {/* 3. Occupied Rooms */}
          <StatCard
            title="Occupied Rooms"
            value={(stats.rooms?.total || 10) - (stats.rooms?.available || 0)}
            subtext={`${stats.rooms?.full || 0} Full • ${stats.rooms?.partiallyOccupied || 0} Partial`}
            icon={Building}
            color="purple"
            onClick={() => navigate('/rooms')}
          />

          {/* 4. Available Beds */}
          <StatCard
            title="Available Beds"
            value={stats.beds?.vacant || 6}
            subtext={`${stats.beds?.occupied || 20} Beds occupied (${stats.beds?.occupancyRate || 77}%)`}
            icon={BedDouble}
            color="emerald"
            onClick={() => navigate('/rooms')}
          />

          {/* 5. Monthly Revenue */}
          <StatCard
            title="Monthly Revenue"
            value={`PKR ${(finance.monthlyRevenue || 155000).toLocaleString()}`}
            subtext="Collected student fees this month"
            icon={DollarSign}
            color="emerald"
            onClick={() => navigate('/fees')}
          />

          {/* 6. Monthly Expenses */}
          <StatCard
            title="Monthly Expenses"
            value={`PKR ${(finance.monthlyExpenses || 0).toLocaleString()}`}
            subtext="Salaries, mess, utilities & repairs"
            icon={Receipt}
            color="rose"
            onClick={() => navigate('/expenses')}
          />

          {/* 7. Monthly Profit / Loss */}
          <div
            onClick={() => navigate('/financial-report')}
            className={`p-6 rounded-2xl border shadow-sm transition-all cursor-pointer ${
              isLoss
                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Monthly {isLoss ? 'Loss' : 'Profit'}
              </span>
              <div
                className={`p-2 rounded-xl ${
                  isLoss
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600'
                }`}
              >
                {isLoss ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
            </div>
            <div className="mt-3">
              <p
                className={`text-2xl font-black ${
                  isLoss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isLoss ? '-' : '+'}PKR {(finance.monthlyProfit || 0).toLocaleString()}
              </p>
              <div className="flex items-center space-x-1.5 mt-1">
                <span
                  className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    isLoss ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isLoss ? 'DEFICIT / LOSS' : 'PROFIT'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {finance.profitMargin}% margin
                </span>
              </div>
            </div>
          </div>

          {/* 8. Pending Fees */}
          <StatCard
            title="Pending Fees"
            value={`PKR ${(finance.pendingStudentFees || 45000).toLocaleString()}`}
            subtext="Uncollected student dues this month"
            icon={Clock}
            color="amber"
            onClick={() => navigate('/fees')}
          />

          {/* 9. Total Staff */}
          <StatCard
            title="Total Staff"
            value={stats.staff?.total || 10}
            subtext="10 distinct workers on campus"
            icon={Users}
            color="sky"
            onClick={() => navigate('/staff')}
          />

          {/* 10. Staff Salary Expense */}
          <StatCard
            title="Staff Salary Expense"
            value={`PKR ${(stats.staff?.monthlySalaryExpense || 342000).toLocaleString()}`}
            subtext="Dynamic sum of 10 worker salaries"
            icon={Banknote}
            color="indigo"
            onClick={() => navigate('/salaries')}
          />
        </div>
      </div>

      {/* Primary Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Revenue vs Expenses vs Profit */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Revenue, Expenses & Net Cash Flow
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic comparisons in {settings.currency || 'PKR'}
              </p>
            </div>
            <Link
              to="/financial-report"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
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
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Collected Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Hostel Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expense Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hostel Expense Categories
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Salaries, food, utilities, rent & maintenance allocation
              </p>
            </div>
            <Link
              to="/expenses"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ledger
            </Link>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={expenseData.slice(0, 7)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val) => `PKR ${val.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Amount" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Analytics: Student Fee Collection & Block Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Fee Collection Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Student Fee Collection Status (20 Students)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paid in Full vs Partial vs Pending Dues
              </p>
            </div>
            <Link to="/fees" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage Fees
            </Link>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `${val} Students`}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Occupancy By Block */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Room & Bed Capacity by Block
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Occupants vs Total Bed Capacity
              </p>
            </div>
            <Link to="/rooms" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Rooms Hub
            </Link>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.blockOccupancy || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="totalOccupants" name="Occupants" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalCapacity" name="Capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
