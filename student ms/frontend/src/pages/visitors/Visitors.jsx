import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  UserCheck,
  Plus,
  LogOut,
  Search,
  Clock,
  Phone,
  User,
} from 'lucide-react';

const Visitors = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Active students
  const [activeStudents, setActiveStudents] = useState([]);

  // Form State
  const initialVisitorData = {
    visitorName: '',
    cnic: '',
    phone: '',
    studentId: '',
    relationship: 'Father',
    purpose: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialVisitorData);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/visitors?${params.toString()}`);
      setVisitors(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load visitors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [statusFilter]);

  const openRegisterModal = async () => {
    try {
      const res = await api.get('/students?status=Active');
      const list = res.data.data || [];
      setActiveStudents(list);
      if (list[0]) setFormData({ ...initialVisitorData, studentId: list[0]._id });
      setRegisterModalOpen(true);
    } catch (err) {
      error('Failed to prepare visitor modal.');
    }
  };

  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/visitors', formData);
      success('Visitor registered and checked in.');
      setRegisterModalOpen(false);
      fetchVisitors();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to register visitor.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCheckoutVisitor = async (visitorId) => {
    try {
      await api.put(`/visitors/${visitorId}/checkout`);
      success('Visitor checkout recorded.');
      fetchVisitors();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to check out visitor.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Visitor Entry & Gate Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log guest arrivals, record CNIC numbers, check-in times, and monitor departures.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'warden', 'receptionist', 'security']) && (
          <Button onClick={openRegisterModal} icon={Plus} variant="primary">
            Register New Visitor
          </Button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVisitors()}
            placeholder="Search visitor, CNIC, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Visitors</option>
            <option value="Active">Currently on Premises</option>
            <option value="Checked Out">Checked Out</option>
          </select>
          <Button onClick={fetchVisitors} variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving visitor log..." />
        ) : visitors.length === 0 ? (
          <EmptyState
            title="No visitor records"
            description="No visitors recorded for the current filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Visitor Particulars</th>
                  <th className="py-3.5 px-4">Visiting Student</th>
                  <th className="py-3.5 px-4">Relationship</th>
                  <th className="py-3.5 px-4">Timing (In / Out)</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{v.visitorName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        CNIC: {v.cnic} • {v.phone}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {v.student?.fullName || 'Student'} ({v.student?.block} Room {v.student?.room?.roomNumber || 'N/A'})
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{v.relationship}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>
                        In: {new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {v.checkOutTime && (
                        <div className="text-slate-400 text-[11px]">
                          Out: {new Date(v.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{v.purpose}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={v.status === 'Active' ? 'warning' : 'neutral'}>
                        {v.status === 'Active' ? 'In Hostel' : 'Departed'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {v.status === 'Active' && hasRole(['superadmin', 'admin', 'warden', 'security']) && (
                        <Button
                          onClick={() => handleCheckoutVisitor(v._id)}
                          size="sm"
                          variant="outline"
                          icon={LogOut}
                        >
                          Check Out
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register Visitor"
        subtitle="Log visitor entry credentials and relationship."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRegisterVisitor} loading={modalLoading}>
              Confirm Entry
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterVisitor} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Visitor Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.visitorName}
              onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
              placeholder="e.g. Tariq Mehmood"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Visitor CNIC *
              </label>
              <input
                type="text"
                required
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                placeholder="35202-1234567-1"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Visiting Student *
              </label>
              <select
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {activeStudents.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.room?.roomNumber ? `Room ${s.room.roomNumber}` : s.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Relationship
              </label>
              <input
                type="text"
                required
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                placeholder="e.g. Father, Brother, Cousin"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g. Delivering luggage / textbooks"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Visitors;
