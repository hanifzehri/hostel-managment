import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useHostel } from '../../context/HostelContext';
import api from '../../api/client';
import { usePWA } from '../../context/PWAContext';
import HostelLogo from '../ui/HostelLogo';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  X,
  ExternalLink,
  MonitorDown,
  Users,
  Home,
  Briefcase,
  Receipt,
  Loader2,
  Command,
  CheckCircle2,
  Laptop,
  ShieldCheck,
} from 'lucide-react';

const Navbar = ({ setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useHostel();
  const {
    isInstalled,
    isInstalling,
    installApp,
    hasPrompt,
    installError,
    installSuccess,
    setInstallError,
  } = usePWA();
  const navigate = useNavigate();

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleInstallClick = async () => {
    if (setInstallError) setInstallError(null);

    // If browser install prompt is currently active, invoke it directly via this user gesture!
    if (hasPrompt) {
      try {
        const result = await installApp();
        if (result?.prompted && result?.accepted) {
          return;
        }
        if (result?.alreadyInstalled) {
          setIsInstallModalOpen(true);
          return;
        }
        if (result?.error || result?.accepted === false) {
          setIsInstallModalOpen(true);
        }
      } catch (err) {
        setIsInstallModalOpen(true);
      }
    } else {
      // 1-click prompt unavailable: open modal with diagnostics and step-by-step instructions
      setIsInstallModalOpen(true);
    }
  };

  // Dropdown states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, students, rooms, staff, fees
  const [searchResults, setSearchResults] = useState({
    students: [],
    rooms: [],
    staff: [],
    fees: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  // Global Ctrl+K / Cmd+K and Esc keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchModalOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.warn('[NOTIF_FETCH_WARN]', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 sec poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Global search trigger across students, rooms, staff, fees
  const executeSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults({ students: [], rooms: [], staff: [], fees: [] });
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await api.get(`/dashboard/search?q=${encodeURIComponent(trimmed)}`);
      if (res.data?.success) {
        setSearchResults(res.data.results || { students: [], rooms: [], staff: [], fees: [] });
      }
    } catch (err) {
      console.warn('[GLOBAL_SEARCH_ERROR]', err.message);
      // Fallback to students search endpoint if dashboard route has issue
      try {
        const fallbackRes = await api.get(`/students?search=${encodeURIComponent(trimmed)}&limit=6`);
        setSearchResults({
          students: fallbackRes.data?.data || [],
          rooms: [],
          staff: [],
          fees: [],
        });
      } catch (fallbackErr) {
        setSearchError('Search failed. Please check connection and try again.');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim()) {
        executeSearch(searchQuery);
      } else {
        setSearchResults({ students: [], rooms: [], staff: [], fees: [] });
      }
    }, 280);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ students: [], rooms: [], staff: [], fees: [] });
    searchInputRef.current?.focus();
  };

  const totalResults =
    (searchResults.students?.length || 0) +
    (searchResults.rooms?.length || 0) +
    (searchResults.staff?.length || 0) +
    (searchResults.fees?.length || 0);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        {/* Left Side: Mobile toggle + Quick Search Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick search input trigger */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center space-x-2.5 w-64 md:w-84 px-3.5 py-2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/80 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700/60 border border-slate-200/60 dark:border-slate-700/60 transition-all group shadow-2xs hover:border-amber-500/40"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
            <span className="flex-1 text-left truncate">Search students, rooms, staff, fees...</span>
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
              Ctrl K
            </span>
          </button>
        </div>

        {/* Right Side: Theme toggle + Notifications + User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchModalOpen(true)}
            aria-label="Open search dialog"
            className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Windows PWA Desktop Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              title="Install Royal Hostel Management System as a native Windows App"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95"
            >
              <MonitorDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Install Windows App</span>
              <span className="md:hidden">Install</span>
            </button>
          )}

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Open notifications"
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          !notif.isRead ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Link
                    to="/announcements"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    View Announcements & Feed
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-1 ring-amber-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold tracking-wider">
                  {user?.role || 'Portal'}
                </p>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Hostel Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center space-x-2.5 w-full px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      {searchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchModalOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[82vh] transition-all">
            {/* Search Input Bar */}
            <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <Search className="w-5 h-5 text-amber-500 mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, rooms, staff, fees..."
                className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
              />

              {/* Action buttons on the right */}
              <div className="flex items-center space-x-2 ml-2">
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                ) : searchQuery ? (
                  <button
                    onClick={clearSearch}
                    title="Clear search text"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}

                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                  ESC
                </kbd>
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="sm:hidden p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Entity Filter Tabs (only when results or query exist) */}
            {searchQuery.trim().length > 0 && (
              <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto bg-white dark:bg-slate-900 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>All</span>
                  <span className="text-[10px] opacity-80">({totalResults})</span>
                </button>

                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
                    activeTab === 'students'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Students</span>
                  <span className="text-[10px] opacity-80">({searchResults.students?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
                    activeTab === 'rooms'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Rooms</span>
                  <span className="text-[10px] opacity-80">({searchResults.rooms?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
                    activeTab === 'staff'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Staff</span>
                  <span className="text-[10px] opacity-80">({searchResults.staff?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('fees')}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
                    activeTab === 'fees'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Invoices</span>
                  <span className="text-[10px] opacity-80">({searchResults.fees?.length || 0})</span>
                </button>
              </div>
            )}

            {/* Results Content Body */}
            <div className="overflow-y-auto p-3 flex-1 space-y-4">
              {searchLoading && totalResults === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <span>Searching Royal Hostel database records...</span>
                </div>
              ) : searchError ? (
                <div className="py-10 text-center text-xs text-red-500">{searchError}</div>
              ) : totalResults > 0 ? (
                <div className="space-y-4">
                  {/* Students Section */}
                  {(activeTab === 'all' || activeTab === 'students') && searchResults.students?.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Students ({searchResults.students.length})</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.students.map((stu) => (
                          <div
                            key={stu._id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              navigate(`/students/${stu._id}`);
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30 font-bold flex items-center justify-center text-xs shrink-0">
                                {stu.fullName?.charAt(0) || 'S'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  {stu.fullName}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {stu.studentId} • Room {stu.room?.roomNumber || 'Unassigned'} • {stu.institution || 'Hostel Student'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              {stu.studentStatus || 'Active'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rooms Section */}
                  {(activeTab === 'all' || activeTab === 'rooms') && searchResults.rooms?.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                        <Home className="w-3.5 h-3.5" />
                        <span>Rooms ({searchResults.rooms.length})</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.rooms.map((rm) => (
                          <div
                            key={rm._id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              navigate('/rooms');
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold flex items-center justify-center text-xs shrink-0">
                                <Home className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  Room {rm.roomNumber} ({rm.block})
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {rm.roomType} • Floor {rm.floor} • Occupants: {rm.currentOccupants}/{rm.capacity} • Rs. {rm.monthlyFee?.toLocaleString()}/mo
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                              {rm.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff Section */}
                  {(activeTab === 'all' || activeTab === 'staff') && searchResults.staff?.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Staff ({searchResults.staff.length})</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.staff.map((st) => (
                          <div
                            key={st._id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              navigate('/staff');
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {st.name?.charAt(0) || 'S'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  {st.name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {st.staffId} • {st.designation || st.role} • {st.phone}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              {st.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoices Section */}
                  {(activeTab === 'all' || activeTab === 'fees') && searchResults.fees?.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Fee Invoices ({searchResults.fees.length})</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.fees.map((fee) => (
                          <div
                            key={fee._id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              navigate('/fees');
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                                <Receipt className="w-4 h-4 text-amber-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  Invoice #{fee.invoiceNumber}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {fee.student?.fullName || 'Student'} • {fee.month} {fee.year} • Total: Rs. {fee.total?.toLocaleString()} (Due: Rs. {fee.remainingAmount?.toLocaleString()})
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                fee.status === 'Paid'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/20'
                              }`}
                            >
                              {fee.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : searchQuery.trim() ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    No matching records found for "{searchQuery}"
                  </p>
                  <p className="mt-1 text-[11px]">
                    Try searching by student name, roll number, room number, staff name, or invoice number.
                  </p>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                  <Command className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    Search students, rooms, staff, fees...
                  </p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Type a query to search live records in Royal Hostel Khuzdar database, or use <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Ctrl+K</kbd> from any screen.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer with shortcuts */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
              <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded font-mono">ESC</kbd> to exit</span>
              <span className="truncate">Royal Hostel Khuzdar • Centralized Search</span>
            </div>
          </div>
        </div>
      )}

      {/* Windows Desktop App Installation Guide Modal */}
      {isInstallModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInstallModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Emblem */}
            <div className="flex items-center space-x-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-md shrink-0">
                <Laptop className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  Install as Windows App
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  Royal Hostel Khuzdar Desktop PWA
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Run Royal Hostel Management System as a native Windows 10/11 standalone desktop app with taskbar shortcut, fast startup, and distraction-free window.
            </p>

            {/* Insecure Context Warning (e.g. running over unencrypted HTTP network IP) */}
            {typeof window !== 'undefined' && !window.isSecureContext && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
                <p className="font-bold">Insecure Connection Warning</p>
                <p className="text-[11px] mt-0.5">
                  Browsers require a secure context (HTTPS or localhost) to install web applications. Please access via <code>http://localhost:5173</code> or your HTTPS domain.
                </p>
              </div>
            )}

            {/* Success state */}
            {installSuccess && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                <div className="text-xs">
                  <p className="font-bold">Installation Successful!</p>
                  <p className="text-[11px] opacity-90">Royal Hostel Khuzdar is now installed on your Windows device.</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {installError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Installation Status</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{installError}</p>
                </div>
              </div>
            )}

            {/* Direct 1-Click Install Button if supported */}
            {hasPrompt && !installSuccess && (
              <button
                disabled={isInstalling}
                onClick={async () => {
                  try {
                    await installApp();
                  } catch (err) {
                    console.warn('Install button exception handled:', err);
                  }
                }}
                className="w-full mb-5 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Launching Windows Prompt...</span>
                  </>
                ) : (
                  <>
                    <MonitorDown className="w-5 h-5" />
                    <span>Click Here to Install Now</span>
                  </>
                )}
              </button>
            )}

            {/* Already Installed Status */}
            {isInstalled && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-start space-x-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-bold">Already Installed on Windows</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Royal Hostel Khuzdar is already installed as a standalone desktop application on this device. You can launch it from your Windows Start Menu, Desktop shortcut, or Taskbar.
                  </p>
                </div>
              </div>
            )}

            {/* Browser Ready / Address Bar Install Status when automatic prompt is dismissed or unavailable */}
            {!hasPrompt && !isInstalled && !installSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center space-x-1.5">
                    <Laptop className="w-4 h-4 text-amber-500" />
                    <span>Browser Installation Ready</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                    Address Bar Install
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  If automatic popups were previously dismissed or silenced by the browser, you can install instantly using the Address Bar icon or Browser Menu (detailed below).
                </p>
              </div>
            )}

            {/* Browser Specific Instructions */}
            <div className="space-y-3.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>How to Install on Microsoft Edge / Google Chrome:</span>
              </h4>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Look in your Address Bar:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      In the right side of your browser URL address bar, look for the <strong>Install App</strong> icon (a computer monitor or <code>+</code> button).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Or use Browser Menu:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Click the three dots (<code>...</code>) at top right &gt; <strong>Apps</strong> &gt; <strong>"Install Royal Hostel Khuzdar"</strong> (or <strong>Save and share</strong> &gt; <strong>Install</strong> in Chrome).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Pin &amp; Launch:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Click <strong>Install</strong> and select "Pin to taskbar" and "Create Desktop shortcut".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

