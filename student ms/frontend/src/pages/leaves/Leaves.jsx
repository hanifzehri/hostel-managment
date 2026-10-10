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
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
} from 'lucide-react';

const Leaves = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Active students
  const [activeStudents, setActiveStudents] = useState([]);

  // Create Form
  const initialLeaveData = {
    studentId: '',
    leaveType: 'Home Visit',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
    destination: '',
    emergencyContact: '',
  };
  const [leaveData, setLeaveData] = useState(initialLeaveData);

  // Review Form
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await api.get(`/leaves?${params.toString()}`);
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const openCreateModal = async () => {
    try {
      const res = await api.get('/students?status=Active');
      const list = res.data.data || [];
      setActiveStudents(list);
      if (list[0]) {
        setLeaveData({
          ...initialLeaveData,
          studentId: list[0]._id,
          emergencyContact: list[0].emergencyPhone,
        });
      }
      setCreateModalOpen(true);
    } catch (err) {
      error('Failed to prepare leave modal.');
    }
  };

  const openReviewModal = (leave) => {
    setSelectedLeave(leave);
    setReviewStatus('Approved');
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/leaves', leaveData);
      success('Leave request submitted successfully.');
      setCreateModalOpen(false);
      fetchLeaves();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit leave.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReviewLeave = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.put(`/leaves/${selectedLeave._id}/review`, {
        status: reviewStatus,
        reviewNotes,
      });
      success(`Leave request ${reviewStatus.toLowerCase()} successfully.`);
      setReviewModalOpen(false);
      fetchLeaves();
    } catch (err) {
      error(err.response?.data?.message || 'Review failed.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Leave Requests & Gate Pass Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student home visits, emergency leaves, warden approvals, and gate passes.
          </p>
        </div>

        <Button onClick={openCreateModal} icon={Plus} variant="primary">
          Submit Leave Request
        </Button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Requests</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading leave requests..." />
        ) : leaves.length === 0 ? (
          <EmptyState
            title="No leave requests"
            description="There are currently no leave requests matching your selection."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Resident</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Destination & Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {leave.student?.fullName || 'Student'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {leave.student?.studentId || 'N/A'} • Room {leave.student?.room?.roomNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {leave.leaveType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {new Date(leave.startDate).toLocaleDateString()} to{' '}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{leave.destination}</p>
                      <p className="text-[11px] text-slate-500">{leave.reason}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{leave.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {leave.status === 'Pending' && hasRole(['superadmin', 'admin', 'warden']) ? (
                        <button
                          onClick={() => openReviewModal(leave)}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {leave.reviewedBy ? `Reviewed by ${leave.reviewedBy.name}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Leave Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Submit Leave Request"
        subtitle="Apply for home visit, medical leave, or academic travel."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateLeave} loading={modalLoading}>
              Submit Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateLeave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Select Resident *
            </label>
            <select
              required
              value={leaveData.studentId}
              onChange={(e) => {
                const stu = activeStudents.find((s) => s._id === e.target.value);
                setLeaveData({
                  ...leaveData,
                  studentId: e.target.value,
                  emergencyContact: stu?.emergencyPhone || '',
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {activeStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId} • Room {s.room?.roomNumber || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Leave Type</label>
              <select
                value={leaveData.leaveType}
                onChange={(e) => setLeaveData({ ...leaveData, leaveType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Home Visit">Home Visit</option>
                <option value="Medical">Medical</option>
                <option value="Academic">Academic</option>
                <option value="Emergency">Emergency</option>
                <option value="Vacation">Vacation</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Emergency Phone
              </label>
              <input
                type="text"
                required
                value={leaveData.emergencyContact}
                onChange={(e) => setLeaveData({ ...leaveData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Departure Date
              </label>
              <input
                type="date"
                required
                value={leaveData.startDate}
                onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Return Date</label>
              <input
                type="date"
                required
                value={leaveData.endDate}
                onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Destination City / Address *
            </label>
            <input
              type="text"
              required
              value={leaveData.destination}
              onChange={(e) => setLeaveData({ ...leaveData, destination: e.target.value })}
              placeholder="e.g. Faisalabad (Family Home)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Detailed Reason *
            </label>
            <textarea
              rows="2"
              required
              value={leaveData.reason}
              onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
              placeholder="e.g. Attending family wedding"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Leave Request"
        subtitle={`Request by ${selectedLeave?.student?.fullName}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewStatus === 'Approved' ? 'primary' : 'danger'}
              onClick={handleReviewLeave}
              loading={modalLoading}
            >
              Submit Decision ({reviewStatus})
            </Button>
          </>
        }
      >
        <form onSubmit={handleReviewLeave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewStatus('Approved')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  reviewStatus === 'Approved'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setReviewStatus('Rejected')}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  reviewStatus === 'Rejected'
                    ? 'bg-rose-600 text-white border-rose-600 shadow'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Warden Remarks / Instructions
            </label>
            <textarea
              rows="3"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="e.g. Return by Monday morning 8:00 AM."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leaves;
