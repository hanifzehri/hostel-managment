import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import HostelLogo from '../ui/HostelLogo';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  BedDouble,
  UserPlus,
  CalendarCheck,
  CreditCard,
  UserCheck,
  MessageSquareWarning,
  FileText,
  IdCard,
  Briefcase,
  Boxes,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Wallet,
  Receipt,
  TrendingUp,
  MonitorDown,
} from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, hasRole, logout } = useAuth();
  const { settings } = useHostel();
  const { isInstalled, installApp } = usePWA();
  const location = useLocation();

  const handleInstallClick = async () => {
    const res = await installApp();
    if (!res.prompted && res.message) {
      alert(res.message);
    }
  };

  const navigationGroups = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'warden', 'accountant', 'receptionist', 'security'] },
        { label: 'Students', path: '/students', icon: Users, roles: ['superadmin', 'admin', 'warden', 'receptionist', 'accountant'] },
        { label: 'Admissions', path: '/admissions', icon: UserPlus, roles: ['superadmin', 'admin', 'receptionist'] },
        { label: 'Check-In / Out', path: '/check-in-out', icon: Compass, roles: ['superadmin', 'admin', 'warden', 'security'] },
      ],
    },
    {
      title: 'Hostel Facilities',
      items: [
        { label: 'Rooms', path: '/rooms', icon: DoorOpen, roles: ['superadmin', 'admin', 'warden', 'receptionist'] },
        { label: 'Beds', path: '/beds', icon: BedDouble, roles: ['superadmin', 'admin', 'warden', 'receptionist'] },
        { label: 'Attendance', path: '/attendance', icon: CalendarCheck, roles: ['superadmin', 'admin', 'warden', 'student'] },
        { label: 'Leave Requests', path: '/leaves', icon: FileText, roles: ['superadmin', 'admin', 'warden', 'student'] },
        { label: 'Visitors', path: '/visitors', icon: UserCheck, roles: ['superadmin', 'admin', 'warden', 'receptionist', 'security'] },
        { label: 'Complaints', path: '/complaints', icon: MessageSquareWarning, roles: ['superadmin', 'admin', 'warden', 'student'] },
      ],
    },
    {
      title: 'Finance & Records',
      items: [
        { label: 'Fees & Billing', path: '/fees', icon: CreditCard, roles: ['superadmin', 'admin', 'accountant', 'student'] },
        { label: 'Staff Salaries', path: '/salaries', icon: Wallet, roles: ['superadmin', 'admin', 'accountant'] },
        { label: 'Hostel Expenses', path: '/expenses', icon: Receipt, roles: ['superadmin', 'admin', 'accountant'] },
        { label: 'Profit & Loss (P&L)', path: '/financial-report', icon: TrendingUp, roles: ['superadmin', 'admin', 'accountant'] },
        { label: 'Student ID Cards', path: '/id-cards', icon: IdCard, roles: ['superadmin', 'admin', 'warden', 'receptionist', 'student'] },
        { label: 'Staff Directory', path: '/staff', icon: Briefcase, roles: ['superadmin', 'admin'] },
        { label: 'Hostel Inventory', path: '/inventory', icon: Boxes, roles: ['superadmin', 'admin', 'warden'] },
        { label: 'Reports Hub', path: '/reports', icon: BarChart3, roles: ['superadmin', 'admin', 'accountant'] },
      ],
    },
    {
      title: 'System & Security',
      items: [
        { label: 'Announcements', path: '/announcements', icon: Bell, roles: ['superadmin', 'admin', 'warden'] },
        { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['superadmin', 'admin'] },
        { label: 'Settings', path: '/settings', icon: Settings, roles: ['superadmin', 'admin'] },
      ],
    },
  ];

  const handleLinkClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 overflow-hidden">
            <HostelLogo size="sm" showText={!isCollapsed} />
            {!isCollapsed && (
              <span className="text-[9px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-700 shrink-0">
                {user?.role || 'Portal'}
              </span>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter((item) => hasRole(item.roles));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    {group.title}
                  </p>
                )}
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      title={isCollapsed ? item.label : undefined}
                      className={`group flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Windows PWA Desktop App Install Option */}
        {!isInstalled && (
          <div className="px-3 pb-2 pt-1">
            <button
              onClick={handleInstallClick}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'space-x-2.5 px-3 py-2'
              } rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-[#2563EB] dark:text-[#06B6D4] border border-[#2563EB]/30 text-xs font-bold transition-all shadow-2xs hover:scale-102`}
              title="Install Royal Hostel Windows Desktop App"
            >
              <MonitorDown className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-[#06B6D4]" />
              {!isCollapsed && <span className="truncate">Install Windows App</span>}
            </button>
          </div>
        )}

        {/* User Card & Collapse Toggle Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            )}

            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors mx-auto"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
