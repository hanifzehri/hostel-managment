import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import HostelLogo from '../../components/ui/HostelLogo';
import {
  Settings as SettingsIcon,
  Save,
  Building,
  Phone,
  Mail,
  Shield,
  CreditCard,
  FileText,
  Sparkles,
} from 'lucide-react';

const Settings = () => {
  const { hasRole } = useAuth();
  const { settings, updateSettingsState, refreshSettings } = useHostel();
  const { success, error } = useToast();

  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', formData);
      updateSettingsState(res.data.data);
      success('Hostel identity & system configuration saved successfully.');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
          <SettingsIcon className="w-7 h-7 text-indigo-600 mr-2.5" /> Hostel Identity & System Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize official hostel letterhead identity, default billing rules, and printable card configurations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Hostel Branding */}
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                1. Institutional Identity & Contact
              </h3>
            </div>
            <HostelLogo size="sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Hostel Official Name *
              </label>
              <input
                type="text"
                required
                value={formData.hostelName || ''}
                onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Tagline / Motto
              </label>
              <input
                type="text"
                value={formData.hostelTagline || ''}
                onChange={(e) => setFormData({ ...formData, hostelTagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Official Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Emergency 24/7 Helpline *
              </label>
              <input
                type="text"
                required
                value={formData.emergencyPhone || ''}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-rose-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Hostel Campus Address *
              </label>
              <input
                type="text"
                required
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Currency Code (ISO)
              </label>
              <input
                type="text"
                value={formData.currency || 'PKR'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
              />
            </div>
          </div>
        </Card>

        {/* Operational & Financial Rules */}
        <Card>
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Operational Defaults & ID Card
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Standard Monthly Rent ({formData.currency || 'PKR'})
              </label>
              <input
                type="number"
                min="0"
                value={formData.defaultMonthlyFee || 10000}
                onChange={(e) => setFormData({ ...formData, defaultMonthlyFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                ID Card Validity (Months)
              </label>
              <input
                type="number"
                min="1"
                max="48"
                value={formData.idCardValidityMonths || 12}
                onChange={(e) =>
                  setFormData({ ...formData, idCardValidityMonths: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Hostel Rules & Regulations (Printed on back of Student ID Card)
              </label>
              <textarea
                rows="4"
                value={formData.rulesAndRegulations || ''}
                onChange={(e) => setFormData({ ...formData, rulesAndRegulations: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed"
              />
            </div>
          </div>
        </Card>

        {hasRole(['superadmin', 'admin']) && (
          <div className="flex justify-end">
            <Button type="submit" loading={saving} variant="primary" size="lg" icon={Save}>
              Save Settings
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
