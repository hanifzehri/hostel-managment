import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const HostelContext = createContext();

export const HostelProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    hostelName: 'Royal Palms Premier Hostel',
    hostelTagline: 'Luxury & Secure Student Living',
    logoUrl: '',
    address: '45-C University Road, Canal Campus, Lahore, Pakistan',
    phone: '+92 42 35889900',
    emergencyPhone: '+92 300 1234567',
    email: 'admin@royalpalmhostel.com',
    currency: 'PKR',
    academicYear: '2026-2027',
    rulesAndRegulations: '1. Curfew time is strictly 10:00 PM.\n2. Keep your room clean.\n3. Digital ID card required for entry.',
    idCardValidityMonths: 12,
    defaultMonthlyFee: 18000,
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.warn('[SETTINGS_LOAD_WARN]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <HostelContext.Provider value={{ settings, updateSettingsState: setSettings, refreshSettings: fetchSettings, loading }}>
      {children}
    </HostelContext.Provider>
  );
};

export const useHostel = () => useContext(HostelContext);
