import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/NotificationContext';
import { useHostel } from '../../context/HostelContext';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import HostelLogo from '../../components/ui/HostelLogo';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, KeyRound, X, CheckCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = request token, 2 = set new password
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetGeneratedInfo, setResetGeneratedInfo] = useState(null);

  const { login } = useAuth();
  const { success, error } = useToast();
  const { settings } = useHostel();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      success(`Welcome back, ${res.data.user.name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Request Reset Token
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
      const msg = err.response?.data?.message || 'Failed to request password reset.';
      error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Step 2: Submit New Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!forgotToken || !newPassword) {
      error('Please provide both the reset token and your new password.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.put(`/auth/resetpassword/${forgotToken}`, { password: newPassword });
      success('Password successfully reset! You can now log in.');
      setEmail(forgotEmail);
      setPassword(newPassword);
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotToken('');
      setNewPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. Token may be expired.';
      error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Quick fill demo credentials
  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-[#101828] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Background ambient glow - Deep Navy, Blue & Cyan accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <HostelLogo size="xl" variant="light" className="mb-2 justify-center" />
          <p className="mt-1 text-sm text-[#06B6D4] font-medium tracking-wide">
            {settings.hostelTagline || 'Enterprise Student Living Platform • Khuzdar'}
          </p>
        </div>

        {/* Login Form Card - Navy Blue Surface */}
        <div className="mt-8 bg-[#1D2939]/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hostel.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#101828] border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-[#06B6D4] hover:text-cyan-300 font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-[#101828] border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3" size="lg">
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#06B6D4] flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#06B6D4]" /> 1-Click Role Accounts
              </span>
              <span className="text-[10px] text-slate-400">Default: admin123</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin@hostel.com')}
                className="px-2 py-1.5 rounded-lg bg-[#101828] hover:bg-slate-800 border border-slate-700 hover:border-[#2563EB]/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all truncate text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@hostel.com')}
                className="px-2 py-1.5 rounded-lg bg-[#101828] hover:bg-slate-800 border border-slate-700 hover:border-[#2563EB]/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all truncate text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('warden@hostel.com')}
                className="px-2 py-1.5 rounded-lg bg-[#101828] hover:bg-slate-800 border border-slate-700 hover:border-[#2563EB]/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all truncate text-center"
              >
                Warden
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('accountant@hostel.com')}
                className="px-2 py-1.5 rounded-lg bg-[#101828] hover:bg-slate-800 border border-slate-700 hover:border-[#2563EB]/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all truncate text-center"
              >
                Accountant
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('receptionist@hostel.com')}
                className="px-2 py-1.5 rounded-lg bg-[#101828] hover:bg-slate-800 border border-slate-700 hover:border-[#2563EB]/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all truncate text-center"
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('security@hostel.com')}
                className="px-2 py-1.5 rounded-lg bg-[#101828] hover:bg-slate-800 border border-slate-700 hover:border-[#2563EB]/50 text-[11px] font-medium text-slate-300 hover:text-white transition-all truncate text-center"
              >
                Security
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('student@hostel.com')}
                className="px-2 py-1.5 rounded-lg bg-[#2563EB]/20 hover:bg-[#2563EB]/30 border border-[#2563EB]/60 text-[11px] font-bold text-[#06B6D4] hover:text-white transition-all truncate text-center col-span-2 sm:col-span-2 shadow-sm"
              >
                Resident Student 🎓
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-slate-400 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
          <span>Role-Based Access Control • 256-bit JWT Encryption</span>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#1D2939] border border-slate-700 rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[#2563EB]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {forgotStep === 1 ? 'Password Recovery' : 'Reset Your Password'}
                </h3>
                <p className="text-xs text-slate-400">
                  {forgotStep === 1
                    ? 'Enter your account email to receive a secure reset token'
                    : 'Submit your single-use reset token and choose a new password'}
                </p>
              </div>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. admin@hostel.com"
                      className="w-full pl-9 pr-3 py-2 bg-[#101828] border border-slate-700 rounded-xl text-white text-sm focus:border-[#2563EB] focus:outline-none"
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
                  <div className="p-3 bg-blue-950/40 border border-[#2563EB]/50 rounded-xl text-xs space-y-1">
                    <div className="flex items-center text-[#06B6D4] font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Single-Use Token Generated (1-Hr Expiry)
                    </div>
                    <p className="font-mono text-[11px] text-cyan-200 break-all select-all">
                      {resetGeneratedInfo.resetToken}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={forgotToken}
                    onChange={(e) => setForgotToken(e.target.value)}
                    placeholder="Paste your 40-character reset token"
                    className="w-full px-3 py-2 bg-[#101828] border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3 py-2 bg-[#101828] border border-slate-700 rounded-xl text-white text-sm focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-slate-400 hover:text-white"
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
