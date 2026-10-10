import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import {
  Home,
  LayoutDashboard,
  CreditCard,
  LayoutGrid,
  DoorOpen,
  Users,
  BarChart3,
  MessageSquareWarning,
  UserCheck,
  Boxes,
  Receipt,
  Bell,
  Utensils,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  IdCard,
  Wallet,
  TrendingUp,
  Briefcase,
  Settings,
  ShieldCheck,
  Compass,
  MonitorDown,
} from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

// Circular Hostel Emblem matching Reference Image 2
export const CircularHostelLogo = ({ className = 'w-11 h-11' }) => (
  <div className={`${className} rounded-full border-2 border-slate-700 bg-white flex flex-col items-center justify-center p-0.5 shadow-xs select-none shrink-0`}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10.5L12 3l9 7.5v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z" />
      <path d="M8 20.5v-6h8v6" />
    </svg>
    <span className="text-[6.5px] font-black uppercase tracking-widest text-slate-900 leading-none mt-0.5">
      HOSTEL
    </span>
  </div>
);

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, hasRole } = useAuth();
  const { settings } = useHostel();
  const { isInstalled, installApp } = usePWA();
  const location = useLocation();

  const handleInstallClick = async () => {
    const res = await installApp();
    if (!res.prompted && res.message) {
      alert(res.message);
    }
  };

  // Menu items structured to match Reference Image 2 directly
  const primaryMenuItems = [
    { label: 'Dashboard', path: '/', icon: Home, roles: ['superadmin', 'admin', 'warden', 'accountant', 'receptionist', 'security', 'student'] },
    { label: 'Payments', path: '/fees', icon: CreditCard, roles: ['superadmin', 'admin', 'accountant', 'student'] },
    { label: 'Room Type', path: '/rooms', icon: LayoutGrid, roles: ['superadmin', 'admin', 'warden', 'receptionist'] },
    { label: 'Room Details', path: '/rooms', icon: DoorOpen, roles: ['superadmin', 'admin', 'warden', 'receptionist'] },
    { label: 'Student Reservation', path: '/students', icon: Users, roles: ['superadmin', 'admin', 'warden', 'receptionist', 'accountant'] },
    { label: 'Report', path: '/reports', icon: BarChart3, roles: ['superadmin', 'admin', 'accountant'] },
    { label: 'Student Complaints', path: '/complaints', icon: MessageSquareWarning, roles: ['superadmin', 'admin', 'warden', 'student'] },
    { label: 'Visitor Details', path: '/visitors', icon: UserCheck, roles: ['superadmin', 'admin', 'warden', 'receptionist', 'security'] },
    { label: 'Inventory', path: '/inventory', icon: Boxes, hasSubmenu: true, roles: ['superadmin', 'admin', 'warden'] },
    { label: "Expenditure's", path: '/expenses', icon: Receipt, roles: ['superadmin', 'admin', 'accountant'] },
    { label: 'Notice Board', path: '/announcements', icon: Bell, roles: ['superadmin', 'admin', 'warden', 'student'] },
    { label: 'Weekly Food Menu', path: '/settings', icon: Utensils, roles: ['superadmin', 'admin', 'warden', 'student'] },
  ];

  // Additional existing system utilities preserved
  const utilityItems = [
    { label: 'Student ID Cards', path: '/id-cards', icon: IdCard, roles: ['superadmin', 'admin', 'warden', 'receptionist', 'student'] },
    { label: 'Staff Salaries', path: '/salaries', icon: Wallet, roles: ['superadmin', 'admin', 'accountant'] },
    { label: 'Profit & Loss', path: '/financial-report', icon: TrendingUp, roles: ['superadmin', 'admin', 'accountant'] },
    { label: 'Staff Directory', path: '/staff', icon: Briefcase, roles: ['superadmin', 'admin'] },
    { label: 'Check-In / Out', path: '/check-in-out', icon: Compass, roles: ['superadmin', 'admin', 'warden', 'security'] },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['superadmin', 'admin'] },
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

      {/* Sidebar Container Matching Reference Image 2 */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-60'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header with Circular Hostel Logo */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-slate-100">
          <div className="flex items-center space-x-3 overflow-hidden">
            <CircularHostelLogo />
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-800 tracking-tight block truncate uppercase">
                  {settings.hostelName || 'Royal Hostel'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Management System
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
          {primaryMenuItems
            .filter((item) => hasRole(item.roles))
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={handleLinkClick}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                    isActive
                      ? 'bg-[#EDE9FE] text-[#6D28D9] font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#6D28D9]' : 'text-slate-500'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.hasSubmenu && (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </NavLink>
              );
            })}

          {/* Preserved Utilities Section */}
          {!isCollapsed && (
            <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations & Audits
            </p>
          )}

          {utilityItems
            .filter((item) => hasRole(item.roles))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={handleLinkClick}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EDE9FE] text-[#6D28D9] font-bold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
        </div>

        {/* Windows PWA Desktop App Option */}
        {!isInstalled && (
          <div className="px-3 pb-2 pt-1 border-t border-slate-100">
            <button
              onClick={handleInstallClick}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'space-x-2 px-3 py-2'
              } rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all`}
              title="Install Desktop App"
            >
              <MonitorDown className="w-4 h-4 shrink-0 text-blue-600" />
              {!isCollapsed && <span className="truncate">Install Windows App</span>}
            </button>
          </div>
        )}

        {/* User Card & Collapse Toggle Footer */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/50">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2.5 min-w-0 pr-1">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.role}</p>
                </div>
              </div>
            )}

            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors mx-auto"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
