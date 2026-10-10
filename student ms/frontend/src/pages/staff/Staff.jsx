import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import {
  Briefcase,
  Plus,
  Search,
  Phone,
  Mail,
  User,
  Shield,
  Edit,
  Trash2,
  Banknote,
  DollarSign,
  Calendar,
  Sparkles,
  MapPin,
  FileText,
} from 'lucide-react';

const STAFF_JOBS = [
  'Hostel Manager',
  'Accountant',
  'Cook',
  'Assistant Cook',
  'Security Guard',
  'Cleaner',
  'Electrician/Maintenance Worker',
  'Receptionist',
  'General Helper',
];

const Staff = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const initialStaffData = {
    name: '',
    fatherName: '',
    cnic: '',
    phone: '',
    email: '',
    address: 'Khuzdar, Balochistan',
    designation: 'General Helper',
    job: 'General Helper',
    department: 'Hostel Administration',
    role: 'Staff',
    salary: 30000,
    status: 'Active',
    notes: '',
  };
  const [formData, setFormData] = useState(initialStaffData);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'All') params.append('role', roleFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/staff?${params.toString()}`);
      setStaffMembers(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStaff();
  };

  const openAddModal = () => {
    setSelectedStaff(null);
    setFormData(initialStaffData);
    setModalOpen(true);
  };

  const openEditModal = (st) => {
    setSelectedStaff(st);
    setFormData({
      name: st.name || '',
      fatherName: st.fatherName || '',
      cnic: st.cnic || '',
      phone: st.phone || '',
      email: st.email || '',
      address: st.address || '',
      designation: st.designation || st.job || 'General Helper',
      job: st.job || st.designation || 'General Helper',
      department: st.department || 'Hostel Administration',
      role: st.role || 'Staff',
      salary: st.salary || 30000,
      status: st.status || 'Active',
      notes: st.notes || '',
    });
    setModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const payload = {
        ...formData,
        designation: formData.job, // keep synced
      };
      if (selectedStaff) {
        await api.put(`/staff/${selectedStaff._id}`, payload);
        success('Staff member profile updated.');
      } else {
        await api.post('/staff', payload);
        success('New staff member added.');
      }
      setModalOpen(false);
      fetchStaff();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save staff record.');
    } finally {
      setModalLoading(false);
    }
  };

  const totalPayroll = staffMembers
    .filter((s) => s.status === 'Active')
    .reduce((sum, s) => sum + (s.salary || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Personnel & Workforce Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Staff Directory (10 Workers)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Royal Hostel Khuzdar workforce: Manager, Accountant, Cooks, Security Guards, Cleaner, Electrician, Receptionist & Helper.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigate('/salaries')}
            variant="secondary"
            size="sm"
            icon={Banknote}
          >
            Manage Salaries
          </Button>

          {hasRole(['superadmin', 'admin']) && (
            <Button onClick={openAddModal} icon={Plus} variant="primary" size="sm">
              Add Staff Member
            </Button>
          )}
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Staff Members"
          value={staffMembers.length}
          subtext="10 distinct workers across operational roles"
          icon={User}
          color="indigo"
        />
        <StatCard
          title="Monthly Payroll Expense"
          value={`PKR ${totalPayroll.toLocaleString()}`}
          subtext="Dynamic sum of individual staff salaries"
          icon={Banknote}
          color="emerald"
        />
        <StatCard
          title="Active Duty Personnel"
          value={staffMembers.filter((s) => s.status === 'Active').length}
          subtext="100% operational coverage"
          icon={Shield}
          color="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by worker name, ID, CNIC, or job..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Job:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
          >
            <option value="All">All Jobs</option>
            {STAFF_JOBS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid Cards */}
      {loading ? (
        <LoadingSpinner text="Retrieving Royal Hostel Khuzdar staff directory..." />
      ) : staffMembers.length === 0 ? (
        <EmptyState
          title="No staff members found"
          description="Adjust your search criteria or add new staff members."
          actionLabel="Add Staff Member"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffMembers.map((st) => (
            <div
              key={st._id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                        {st.name}
                      </h3>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                        {st.job || st.designation}
                      </span>
                    </div>
                  </div>
                  <Badge variant={st.status === 'Active' ? 'success' : 'default'}>{st.status}</Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Staff ID:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {st.staffId}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Father's Name:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {st.fatherName || '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">National CNIC:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{st.cnic}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Phone Contact:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{st.phone}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Monthly Salary:</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm">
                      PKR {st.salary?.toLocaleString()}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Address:</span>
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                      {st.address || 'Khuzdar, Balochistan'}
                    </span>
                  </p>
                  {st.notes && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-50 dark:border-slate-800">
                      "{st.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => navigate('/salaries')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                >
                  <Banknote className="w-3.5 h-3.5 mr-1" /> View Payroll Slip
                </button>

                {hasRole(['superadmin', 'admin']) && (
                  <button
                    onClick={() => openEditModal(st)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedStaff ? `Edit Worker — ${selectedStaff.name}` : 'Add New Hostel Worker'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Father's Name *
              </label>
              <input
                type="text"
                required
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                National CNIC *
              </label>
              <input
                type="text"
                required
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                placeholder="52202-*******-*"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Job Responsibility *
              </label>
              <select
                required
                value={formData.job}
                onChange={(e) => setFormData({ ...formData, job: e.target.value, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
              >
                {STAFF_JOBS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Monthly Salary (PKR) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Duty Notes / Specific Area
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button onClick={() => setModalOpen(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={modalLoading}>
              Save Worker
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Staff;
