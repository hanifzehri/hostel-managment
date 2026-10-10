import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { HostelProvider } from './context/HostelContext';
import { PWAProvider } from './context/PWAContext';

import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Button from './components/ui/Button';
import { ShieldAlert } from 'lucide-react';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentProfile from './pages/students/StudentProfile';
import Admissions from './pages/students/Admissions';
import Rooms from './pages/rooms/Rooms';
import Beds from './pages/rooms/Beds';
import CheckInOut from './pages/checkin-checkout/CheckInOut';
import Fees from './pages/fees/Fees';
import Attendance from './pages/attendance/Attendance';
import Leaves from './pages/leaves/Leaves';
import Visitors from './pages/visitors/Visitors';
import Complaints from './pages/complaints/Complaints';
import StudentCardGenerator from './pages/idcard/StudentCardGenerator';
import VerifyStudent from './pages/idcard/VerifyStudent';
import Staff from './pages/staff/Staff';
import SalaryManagement from './pages/staff/SalaryManagement';
import Expenses from './pages/expenses/Expenses';
import FinancialReport from './pages/finance/FinancialReport';
import Inventory from './pages/inventory/Inventory';
import Reports from './pages/reports/Reports';
import Announcements from './pages/announcements/Announcements';
import AuditLogs from './pages/audit/AuditLogs';
import Settings from './pages/settings/Settings';
import UserProfile from './pages/profile/UserProfile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070e17] flex items-center justify-center">
        <LoadingSpinner text="Authenticating secure admin session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Security Rule: Block students or unauthorized accounts from accessing the private administrative website
  const allowedAdminRoles = ['superadmin', 'admin', 'warden', 'accountant', 'receptionist', 'security'];
  if (!user || user.role === 'student' || !allowedAdminRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#070e17] flex items-center justify-center p-4 text-center">
        <div className="bg-[#0b1626] border border-rose-800/60 rounded-3xl p-8 max-w-md shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Administrative Access Restricted</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              This system is strictly reserved for authorized hostel administrators and operational staff. Student accounts are blocked from accessing private management records.
            </p>
          </div>
          <Button onClick={() => logout()} variant="danger" className="w-full">
            Sign Out & Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <PWAProvider>
              <HostelProvider>
                <Routes>
                  {/* Public Authentication & Verification Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/verify/:identifier" element={<VerifyStudent />} />

                  {/* Protected Admin Portal Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="students" element={<Students />} />
                    <Route path="students/:id" element={<StudentProfile />} />
                    <Route path="admissions" element={<Admissions />} />
                    <Route path="check-in-out" element={<CheckInOut />} />
                    <Route path="rooms" element={<Rooms />} />
                    <Route path="beds" element={<Beds />} />
                    <Route path="fees" element={<Fees />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="leaves" element={<Leaves />} />
                    <Route path="visitors" element={<Visitors />} />
                    <Route path="complaints" element={<Complaints />} />
                    <Route path="id-cards" element={<StudentCardGenerator />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="salaries" element={<SalaryManagement />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="financial-report" element={<FinancialReport />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile" element={<UserProfile />} />
                  </Route>

                  {/* Catch-all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </HostelProvider>
            </PWAProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
