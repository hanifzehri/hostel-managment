import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/NotificationContext';
import { useHostel } from '../../context/HostelContext';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import {
  BarChart2,
  Lock,
  Eye,
  EyeOff,
  Shield,
  IdCard,
  LogIn,
  KeyRound,
  X,
  CheckCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  UserPlus,
} from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick Admin Login modal state
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Create student account modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regCnic, setRegCnic] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetGeneratedInfo, setResetGeneratedInfo] = useState(null);

  const { login } = useAuth();
  const { success, error } = useToast();
  const { settings } = useHostel();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!identifier || !password) {
      error('Please enter both your email / registration number and password.');
      return;
    }

    setLoading(true);
    try {
      let loginEmail = identifier.trim().toLowerCase();

      // If user typed a student registration ID (e.g. RH-2026-001 or no @), resolve email if possible
      if (!loginEmail.includes('@')) {
        try {
          const searchRes = await api.get(`/students?search=${encodeURIComponent(identifier.trim())}`);
          const match = searchRes.data.data?.[0];
          if (match?.email) {
            loginEmail = match.email.toLowerCase();
          }
        } catch {
          // fallback to identifier
        }
      }

      const res = await api.post('/auth/login', { email: loginEmail, password });
      login(res.data.token, res.data.user);
      success(`Welcome back, ${res.data.user.name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify your email/registration and password.';
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill role credentials
  const handleQuickFill = (roleEmail, defaultPass = 'admin123') => {
    setIdentifier(roleEmail);
    setPassword(defaultPass);
    setShowAdminModal(false);
    success(`Loaded credentials for ${roleEmail}`);
  };

  // Handle student self-registration
  const handleRegisterStudent = async (e) => {
    e?.preventDefault();
    if (!regFullName || !regCnic || !regPhone || !regEmail || !regPassword) {
      error('Please fill in all registration fields.');
      return;
    }

    setRegLoading(true);
    try {
      await api.post('/students', {
        fullName: regFullName,
        fatherName: 'Guardian',
        cnic: regCnic,
        phone: regPhone,
        email: regEmail,
        institution: 'BUET Khuzdar',
        address: 'Khuzdar, Balochistan',
        monthlyFee: 10000,
        feeStatus: 'Unpaid',
      });
      success('Student record registered! You can now log in.');
      setIdentifier(regEmail);
      setPassword(regPassword);
      setShowRegisterModal(false);
    } catch (err) {
      error(err.response?.data?.message || 'Registration failed. Check CNIC and contact number.');
    } finally {
      setRegLoading(false);
    }
  };

  // Forgot Password Step 1
  const handleRequestResetToken = async (e) => {
    e?.preventDefault();
    if (!forgotEmail) {
      error('Please enter your account email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgotpassword', { email: forgotEmail });
      success(res.data.message || 'Password reset token generated successfully.');
      if (res.data.resetToken) {
        setForgotToken(res.data.resetToken);
        setResetGeneratedInfo(res.data);
      }
      setForgotStep(2);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Step 2
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!forgotToken || !newPassword) {
      error('Please provide both the reset token and your new password.');
      return;
    }

    setForgotLoading(true);
    try {
      await api.put(`/auth/resetpassword/${forgotToken}`, { password: newPassword });
      success('Password successfully reset! You can now log in.');
      setIdentifier(forgotEmail);
      setPassword(newPassword);
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotToken('');
      setNewPassword('');
    } catch (err) {
      error(err.response?.data?.message || 'Password reset failed. Token may be expired.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8 font-sans">
      {/* Main Split Window Container Matching Reference Image 1 */}
      <div className="w-full max-w-6xl min-h-[660px] bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: Student Hostel Portal Illustration Hero       */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#0c2f56] via-[#103a68] to-[#15467c] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-white/15 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide text-white">
              Hostel Management
            </span>
          </div>

          {/* Center Content: Headline & Subtitle */}
          <div className="relative z-10 my-auto py-8">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Student Hostel<br />Portal
            </h1>
            <p className="mt-4 text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-md">
              Manage room bookings, complaints, feedback, profile updates, and hostel records from a clean student workspace.
            </p>

            {/* Custom SVG Vector Illustration Matching Image 1 (Student in hostel room studying, guitar, desk) */}
            <div className="mt-6 w-full max-w-md mx-auto aspect-[16/10] relative">
              <svg viewBox="0 0 500 320" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#123d6a" />
                    <stop offset="100%" stopColor="#0b2647" />
                  </linearGradient>
                  <linearGradient id="glowLamp" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Back Wall & Room Depth */}
                <rect width="500" height="320" rx="16" fill="url(#wallGrad)" />
                <path d="M 0 250 L 500 250 L 500 320 L 0 320 Z" fill="#091f3a" />
                <line x1="0" y1="250" x2="500" y2="250" stroke="#1d4e89" strokeWidth="2" opacity="0.6" />

                {/* Window with night view and stars */}
                <rect x="90" y="30" width="85" height="110" rx="4" fill="#0d2645" stroke="#2563eb" strokeWidth="3" opacity="0.8" />
                <line x1="132" y1="30" x2="132" y2="140" stroke="#2563eb" strokeWidth="2" />
                <line x1="90" y1="85" x2="175" y2="85" stroke="#2563eb" strokeWidth="2" />
                <circle cx="110" cy="55" r="1.5" fill="#ffffff" opacity="0.8" />
                <circle cx="150" cy="70" r="1.5" fill="#ffffff" opacity="0.8" />
                <circle cx="120" cy="110" r="1" fill="#ffffff" opacity="0.5" />

                {/* Bookshelf on wall */}
                <rect x="30" y="110" width="55" height="8" rx="2" fill="#1e4e7e" />
                <rect x="35" y="88" width="8" height="22" rx="1" fill="#38bdf8" />
                <rect x="45" y="82" width="9" height="28" rx="1" fill="#fbbf24" />
                <rect x="56" y="90" width="7" height="20" rx="1" fill="#f43f5e" />
                <rect x="65" y="85" width="12" height="25" rx="1" fill="#a78bfa" />

                {/* Bunk Bed Structure */}
                {/* Bed Posts */}
                <rect x="195" y="80" width="8" height="190" rx="3" fill="#1e40af" />
                <rect x="370" y="80" width="8" height="190" rx="3" fill="#1e40af" />
                {/* Upper Bunk Railing */}
                <rect x="195" y="140" width="180" height="8" rx="2" fill="#2563eb" />
                <rect x="195" y="110" width="180" height="6" rx="2" fill="#1d4ed8" opacity="0.6" />
                {/* Ladder */}
                <rect x="235" y="140" width="5" height="130" fill="#3b82f6" />
                <rect x="255" y="140" width="5" height="130" fill="#3b82f6" />
                <line x1="235" y1="165" x2="260" y2="165" stroke="#60a5fa" strokeWidth="3" />
                <line x1="235" y1="195" x2="260" y2="195" stroke="#60a5fa" strokeWidth="3" />
                <line x1="235" y1="225" x2="260" y2="225" stroke="#60a5fa" strokeWidth="3" />
                <line x1="235" y1="250" x2="260" y2="250" stroke="#60a5fa" strokeWidth="3" />
                {/* Lower Mattress & Pillow */}
                <rect x="200" y="240" width="170" height="16" rx="4" fill="#0284c7" />
                <rect x="325" y="235" width="40" height="12" rx="4" fill="#e0f2fe" />
                {/* Upper Mattress */}
                <rect x="200" y="132" width="170" height="14" rx="4" fill="#38bdf8" />

                {/* Student Lying on Top Bunk Reading a Book */}
                {/* Pillow */}
                <ellipse cx="340" cy="125" rx="22" ry="9" fill="#f8fafc" />
                {/* Head */}
                <circle cx="325" cy="112" r="14" fill="#fbcfe8" />
                {/* Hair */}
                <path d="M 312 110 C 315 95 340 95 342 108 Z" fill="#f59e0b" />
                {/* Glasses */}
                <rect x="316" y="109" width="8" height="6" rx="1.5" stroke="#0f172a" strokeWidth="1.5" fill="none" />
                {/* Body & Clothes */}
                <path d="M 312 122 L 255 125 L 250 134 L 320 132 Z" fill="#38bdf8" />
                {/* Legs */}
                <path d="M 255 125 L 225 105 L 215 110 L 250 134 Z" fill="#fbbf24" />
                {/* Arms & Open Book */}
                <path d="M 305 122 L 285 105" stroke="#fbcfe8" strokeWidth="5" strokeLinecap="round" />
                <path d="M 285 96 L 270 106 L 285 112 L 300 105 Z" fill="#ef4444" />
                <path d="M 285 98 L 272 107" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 285 98 L 298 106" stroke="#ffffff" strokeWidth="1.5" />

                {/* Wall Lamp with Warm Glow */}
                <circle cx="380" cy="65" r="10" fill="#fde047" opacity="0.9" />
                <polygon points="380,75 320,150 440,150" fill="url(#glowLamp)" opacity="0.4" />

                {/* Computer Desk on Right */}
                <rect x="375" y="195" width="105" height="10" rx="2" fill="#1e3a8a" />
                <rect x="385" y="205" width="6" height="65" fill="#1d4ed8" />
                <rect x="465" y="205" width="6" height="65" fill="#1d4ed8" />
                {/* Computer Monitor */}
                <rect x="395" y="145" width="55" height="38" rx="3" fill="#0284c7" stroke="#60a5fa" strokeWidth="2" />
                <rect x="418" y="183" width="9" height="12" fill="#60a5fa" />
                <rect x="410" y="193" width="25" height="3" rx="1" fill="#60a5fa" />
                {/* Computer Screen Code lines */}
                <line x1="402" y1="155" x2="435" y2="155" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
                <line x1="402" y1="162" x2="425" y2="162" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                <line x1="402" y1="169" x2="440" y2="169" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
                {/* PC Tower */}
                <rect x="390" y="215" width="30" height="48" rx="2" fill="#0f172a" stroke="#2563eb" strokeWidth="1" />
                <circle cx="405" cy="225" r="3" fill="#38bdf8" />

                {/* Desk Chair */}
                <ellipse cx="160" cy="235" rx="24" ry="10" fill="#0369a1" />
                <path d="M 148 190 Q 140 235 155 235 L 175 235 Q 185 235 180 190 Z" fill="#0284c7" />
                <line x1="162" y1="235" x2="162" y2="265" stroke="#1e293b" strokeWidth="4" />
                <line x1="145" y1="265" x2="180" y2="265" stroke="#1e293b" strokeWidth="3" />

                {/* Electric Guitar on Stand on Left */}
                {/* Guitar Neck */}
                <line x1="60" y1="170" x2="72" y2="275" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                <line x1="58" y1="165" x2="62" y2="175" stroke="#64748b" strokeWidth="3" />
                {/* Guitar Body */}
                <path d="M 68 230 C 50 240 50 275 75 285 C 95 280 95 245 80 235 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1.5" />
                <ellipse cx="73" cy="255" rx="5" ry="7" fill="#ffffff" />
                <line x1="72" y1="240" x2="75" y2="275" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 pt-4">
            <p className="text-xs text-blue-200/80 font-medium">
              Secure access for registered students.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Clean White Modern Sign-in Form              */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-white p-8 sm:p-14 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            {/* Top Brand Header (Right side in Reference Image 1) */}
            <div className="flex items-center space-x-2 text-slate-800 mb-8">
              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-slate-700" />
              </div>
              <span className="font-bold text-sm tracking-wide text-slate-800">
                Hostel Management
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-normal">
              Sign in with your email address or registration number.
            </p>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              {/* Field 1: Email / Registration Number */}
              <div>
                <div className="relative rounded-xl border border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email / Registration Number"
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none rounded-xl"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="relative rounded-xl border border-slate-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all bg-white">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-10 py-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password Row */}
              <div className="flex items-center justify-between pt-1 pb-2 text-xs sm:text-sm">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(identifier.includes('@') ? identifier : '');
                    setShowForgotModal(true);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Blue Submit Button Matching Reference Image 1 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Links Matching Reference Image 1 */}
            <div className="mt-8 text-center text-xs sm:text-sm text-slate-600">
              <span>New student? </span>
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Create an account
              </button>
              <span className="mx-1 text-slate-400">|</span>
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Admin login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1-CLICK ADMIN / STAFF ROLE ACCOUNTS MODAL                 */}
      {/* ========================================================= */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1-Click Staff & Admin Login</h3>
                <p className="text-xs text-slate-500">Choose any institutional role to autofill credentials.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleQuickFill('superadmin@hostel.com')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-left transition-colors"
              >
                <span className="block font-bold text-blue-600">Super Admin</span>
                <span className="text-[11px] text-slate-500 font-normal">Full Control</span>
              </button>
              <button
                onClick={() => handleQuickFill('admin@hostel.com')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-left transition-colors"
              >
                <span className="block font-bold text-blue-600">Admin</span>
                <span className="text-[11px] text-slate-500 font-normal">Hostel Operations</span>
              </button>
              <button
                onClick={() => handleQuickFill('warden@hostel.com')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-left transition-colors"
              >
                <span className="block font-bold text-blue-600">Warden</span>
                <span className="text-[11px] text-slate-500 font-normal">Discipline & Rooms</span>
              </button>
              <button
                onClick={() => handleQuickFill('accountant@hostel.com')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-left transition-colors"
              >
                <span className="block font-bold text-blue-600">Accountant</span>
                <span className="text-[11px] text-slate-500 font-normal">Fees & Salaries</span>
              </button>
              <button
                onClick={() => handleQuickFill('receptionist@hostel.com')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-left transition-colors"
              >
                <span className="block font-bold text-blue-600">Receptionist</span>
                <span className="text-[11px] text-slate-500 font-normal">Front Desk</span>
              </button>
              <button
                onClick={() => handleQuickFill('student@hostel.com')}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-left transition-colors"
              >
                <span className="block font-bold text-blue-700">Resident Student</span>
                <span className="text-[11px] text-blue-600 font-normal">Student Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NEW STUDENT SELF-REGISTRATION MODAL                       */}
      {/* ========================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">New Student Registration</h3>
                <p className="text-xs text-slate-500">Register as a new student resident at Royal Hostel.</p>
              </div>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Asad Ullah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">CNIC / B-Form *</label>
                <input
                  type="text"
                  required
                  value={regCnic}
                  onChange={(e) => setRegCnic(e.target.value)}
                  placeholder="54400-1234567-1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" loading={regLoading} className="w-full" variant="primary">
                  Register Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FORGOT PASSWORD MODAL                                     */}
      {/* ========================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {forgotStep === 1 ? 'Password Recovery' : 'Reset Your Password'}
                </h3>
                <p className="text-xs text-slate-500">
                  {forgotStep === 1
                    ? 'Enter your account email to receive a secure reset token'
                    : 'Submit your single-use reset token and choose a new password'}
                </p>
              </div>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. student@hostel.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="ghost" onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={forgotLoading} icon={ArrowRight}>
                    Generate Token
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetGeneratedInfo?.resetToken && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center text-blue-800 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Single-Use Token Generated
                    </div>
                    <p className="font-mono text-[11px] text-blue-900 break-all select-all">
                      {resetGeneratedInfo.resetToken}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={forgotToken}
                    onChange={(e) => setForgotToken(e.target.value)}
                    placeholder="Paste your 40-character reset token"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    ← Back to email
                  </button>
                  <div className="flex space-x-2">
                    <Button variant="ghost" onClick={() => setShowForgotModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={forgotLoading}>
                      Update Password
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
