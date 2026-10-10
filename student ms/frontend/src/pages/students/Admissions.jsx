import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { UserPlus, User, Building, Calendar, DollarSign, CheckCircle } from 'lucide-react';

const Admissions = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { error } = useToast();

  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admissions');
      setAdmissions(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load admissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Admissions Archive
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete formal enrollment records and institutional room admission vouchers.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'receptionist']) && (
          <Button
            onClick={() => navigate('/students?action=add')}
            icon={UserPlus}
            variant="primary"
          >
            New Admission
          </Button>
        )}
      </div>

      {/* Admissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving admission logs..." />
        ) : admissions.length === 0 ? (
          <EmptyState
            title="No admission records"
            description="Start registering students into rooms."
            actionLabel="Enroll Student"
            onAction={() => navigate('/students?action=add')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Admission #</th>
                  <th className="py-3.5 px-4">Student Particulars</th>
                  <th className="py-3.5 px-4">Room & Bed</th>
                  <th className="py-3.5 px-4">Enrolled Date</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Admission Officer</th>
                  <th className="py-3.5 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {admissions.map((adm) => (
                  <tr key={adm._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {adm.admissionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {adm.student?.fullName || 'Resident'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        CNIC: {adm.student?.cnic || 'N/A'} • {adm.student?.phone || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {adm.room?.block} • Room {adm.room?.roomNumber || 'N/A'} ({adm.bed?.bedNumber || 'Bed A'})
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(adm.admissionDate).toLocaleDateString([], { dateStyle: 'medium' })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      {settings.currency} {adm.monthlyFee?.toLocaleString()}/mo
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{adm.createdBy?.name || 'Administrator'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {adm.student && (
                        <button
                          onClick={() => navigate(`/students/${adm.student._id}`)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          View Student
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admissions;
