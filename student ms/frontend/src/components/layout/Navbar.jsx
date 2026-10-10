import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useHostel } from '../../context/HostelContext';
import api from '../../api/client';
import { usePWA } from '../../context/PWAContext';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Shield,
  CheckCircle2,
  X,
  ExternalLink,
  MonitorDown,
} from 'lucide-react';

const Navbar = ({ setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useHostel();
  const { isInstalled, installApp } = usePWA();
  const navigate = useNavigate();

  const handleInstallClick = async () => {
    const res = await installApp();
    if (!res.prompted && res.message) {
      alert(res.message);
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
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

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

  // Global search trigger
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await api.get(`/students?search=${encodeURIComponent(searchQuery)}&limit=5`);
      setSearchResults(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchSubmit();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        {/* Left Side: Mobile toggle + Quick Search Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick search input trigger */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center space-x-2 w-64 md:w-80 px-3.5 py-2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700/70 border border-transparent transition-all"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 text-left">Search students, rooms, CNIC...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Side: Theme toggle + Notifications + User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Windows PWA Desktop Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              title="Install Royal Hostel Management System as a native Windows App"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95"
            >
              <MonitorDown className="w-4 h-4 text-teal-500" />
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
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
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
                          !notif.isRead ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
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
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-1 ring-teal-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                  {user?.role || 'Portal'}
                </p>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
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
                    className="flex items-center space-x-2.5 w-full px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student by name, student ID, CNIC or phone..."
                autoFocus
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3">
              {searchLoading ? (
                <p className="text-center text-xs text-slate-400 py-6">Searching records...</p>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((stu) => (
                    <div
                      key={stu._id}
                      onClick={() => {
                        setSearchModalOpen(false);
                        navigate(`/students/${stu._id}`);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {stu.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{stu.fullName}</p>
                          <p className="text-xs text-slate-400">
                            {stu.studentId} • Room {stu.room?.roomNumber || 'N/A'} • {stu.institution}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <p className="text-center text-xs text-slate-400 py-6">No matching student found.</p>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Type student name, ID (e.g. STU-2026-0001), or CNIC to quickly jump to profile.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
