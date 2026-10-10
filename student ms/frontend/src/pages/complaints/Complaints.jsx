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
  MessageSquareWarning,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Wrench,
} from 'lucide-react';

const Complaints = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Active students and staff list
  const [activeStudents, setActiveStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Create Form State
  const initialData = {
    studentId: '',
    category: 'Room Maintenance',
    description: '',
    priority: 'Medium',
  };
  const [formData, setFormData] = useState(initialData);

  // Resolve Form State
  const [resolveStatus, setResolveStatus] = useState('Resolved');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [resolution, setResolution] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (categoryFilter !== 'All') params.append('category', categoryFilter);

      const res = await api.get(`/complaints?${params.toString()}`);
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const openCreateModal = async () => {
    try {
      const res = await api.get('/students?status=Active');
      const list = res.data.data || [];
      setActiveStudents(list);
      if (list[0]) setFormData({ ...initialData, studentId: list[0]._id });
      setCreateModalOpen(true);
    } catch (err) {
      error('Failed to prepare complaint modal.');
    }
  };

  const openResolveModal = async (complaint) => {
    setSelectedComplaint(complaint);
    setResolveStatus(complaint.status === 'Open' ? 'In Progress' : 'Resolved');
    setResolution(complaint.resolution || '');
    try {
      const res = await api.get('/staff');
      setStaffList(res.data.data || []);
      setResolveModalOpen(true);
    } catch (err) {
      error('Failed to load staff list.');
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/complaints', formData);
      success('Complaint registered successfully.');
      setCreateModalOpen(false);
      fetchComplaints();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to file complaint.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.put(`/complaints/${selectedComplaint._id}`, {
        status: resolveStatus,
        assignedStaff: assignedStaff || undefined,
        resolution,
      });
      success('Complaint status updated successfully.');
      setResolveModalOpen(false);
      fetchComplaints();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update complaint.');
    } finally {
      setModalLoading(false);
    }
  };

  const categories = [
    'Room Maintenance',
    'Electrical',
    'Plumbing',
    'Cleanliness',
    'Mess / Food',
    'Internet / Wi-Fi',
    'Security',
    'Noise / Disturbance',
    'Other',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Complaints & Maintenance Tickets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track student grievances, plumbing, electrical, and facility repair service requests.
          </p>
        </div>

        <Button onClick={openCreateModal} icon={Plus} variant="primary">
          File New Complaint
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving complaints log..." />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints registered"
            description="There are currently no maintenance or grievance complaints matching this filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Resident</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {c.complaintId}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {c.student?.fullName || 'Resident'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Room {c.student?.room?.roomNumber || 'N/A'} • {c.student?.studentId || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {c.category}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{c.description}</p>
                      {c.resolution && (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          Resolution: {c.resolution}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : c.priority === 'High'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{c.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasRole(['superadmin', 'admin', 'warden']) && (
                        <button
                          onClick={() => openResolveModal(c)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                        >
                          Update / Resolve
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

      {/* New Complaint Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="File Facility Complaint"
        subtitle="Log an issue regarding hostel maintenance, electrical, plumbing, or hygiene."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateComplaint} loading={modalLoading}>
              Submit Ticket
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Select Resident *
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Detailed Description *
            </label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the problem in detail (e.g. Washroom tap leakage, Wi-Fi router no signal in Room 102)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>

      {/* Resolve / Update Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Update / Resolve Complaint Ticket"
        subtitle={`Ticket ${selectedComplaint?.complaintId} • ${selectedComplaint?.category}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResolveComplaint} loading={modalLoading}>
              Save Resolution
            </Button>
          </>
        }
      >
        <form onSubmit={handleResolveComplaint} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Status</label>
            <select
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Assign Maintenance Staff
            </label>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Unassigned / General Maintenance --</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Resolution Remarks
            </label>
            <textarea
              rows="3"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="e.g. Electrician replaced capacitor on ceiling fan. Issue verified resolved."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Complaints;
