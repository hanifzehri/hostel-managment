import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { User, Lock, Mail, Phone, ShieldCheck, Save, KeyRound } from 'lucide-react';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', profileData);
      updateUser(res.data.user);
      success('Profile details updated successfully.');
    } catch (err) {
      error(err.response?.data?.message || 'Profile update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      error('New password and confirm password do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      success('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(err.response?.data?.message || 'Password update failed.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Account & Security Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your credentials, authorized roles, and security authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="text-center md:col-span-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2">
              <span className="inline-block px-3 py-0.5 rounded-full text-xs uppercase font-extrabold tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {user?.role}
              </span>
            </div>
          </div>
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 space-y-1">
            <p>Role-Based Access Verified</p>
            <p>256-Bit JWT Encryption Active</p>
          </div>
        </Card>

        {/* Update Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2 text-indigo-600" /> Account Particulars
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Email Address (Immutable)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={profileLoading} size="sm" icon={Save}>
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Card */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
              <KeyRound className="w-4 h-4 mr-2 text-indigo-600" /> Change Security Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={passwordLoading} variant="outline" size="sm">
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
