import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import {
  BedDouble,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  DoorOpen,
  User,
} from 'lucide-react';

const Beds = () => {
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Assign bed modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Vacate modal state
  const [vacateConfirmOpen, setVacateConfirmOpen] = useState(false);
  const [bedToVacate, setBedToVacate] = useState(null);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await api.get(`/beds?${params.toString()}`);
      setBeds(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load beds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, [statusFilter]);

  const openAssignModal = async (bed) => {
    setSelectedBed(bed);
    setSelectedStudentId('');
    try {
      const res = await api.get('/students?status=Active');
      const list = (res.data.data || []).filter((s) => !s.bed);
      setAvailableStudents(list);
      setAssignModalOpen(true);
    } catch (err) {
      error('Failed to load students.');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      error('Please select a student.');
      return;
    }
    setModalLoading(true);
    try {
      await api.post(`/beds/${selectedBed._id}/assign`, { studentId: selectedStudentId });
      success('Bed assigned successfully.');
      setAssignModalOpen(false);
      fetchBeds();
    } catch (err) {
      error(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleVacate = async () => {
    if (!bedToVacate) return;
    try {
      await api.post(`/beds/${bedToVacate._id}/vacate`);
      success(`Bed ${bedToVacate.bedNumber} is now marked Available.`);
      setVacateConfirmOpen(false);
      fetchBeds();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to vacate bed.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Individual Bed Registry
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed list of every bed unit across all rooms with live occupant verification and status controls.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Beds</option>
            <option value="Available">Available Beds</option>
            <option value="Occupied">Occupied Beds</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Beds Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving bed inventory..." />
        ) : beds.length === 0 ? (
          <EmptyState title="No beds found" description="No beds match your current filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Bed Unit</th>
                  <th className="py-3.5 px-4">Room & Block</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Resident</th>
                  <th className="py-3.5 px-4">Monthly Rate</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {beds.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <BedDouble className="w-4 h-4 text-indigo-600" />
                      <span>{b.bedNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {b.room?.block} • Room {b.room?.roomNumber || 'N/A'} (Floor {b.room?.floor || 1})
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={b.status === 'Available' ? 'success' : 'danger'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.currentStudent ? (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {b.currentStudent.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {b.currentStudent.studentId} • {b.currentStudent.phone}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unallocated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      {settings.currency} {b.monthlyRent?.toLocaleString() || '18,000'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasRole(['superadmin', 'admin', 'warden']) && (
                        b.status === 'Occupied' ? (
                          <button
                            onClick={() => {
                              setBedToVacate(b);
                              setVacateConfirmOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            Vacate
                          </button>
                        ) : (
                          <button
                            onClick={() => openAssignModal(b)}
                            className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            Assign Student
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Bed Unit"
        subtitle={`Assigning ${selectedBed?.bedNumber} in Room ${selectedBed?.room?.roomNumber || ''}`}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssign} loading={modalLoading}>
              Confirm Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssign} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Select Resident without Bed:
            </label>
            {availableStudents.length === 0 ? (
              <p className="text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                All currently active residents already have beds assigned.
              </p>
            ) : (
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose Resident --</option>
                {availableStudents.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.studentId} • {s.institution})
                  </option>
                ))}
              </select>
            )}
          </div>
        </form>
      </Modal>

      {/* Vacate Confirmation */}
      <ConfirmationModal
        isOpen={vacateConfirmOpen}
        onClose={() => setVacateConfirmOpen(false)}
        onConfirm={handleVacate}
        title="Vacate Bed Unit"
        message={`Are you sure you want to vacate ${bedToVacate?.bedNumber}? The resident will be unassigned and the bed will become Available.`}
        confirmText="Yes, Vacate"
      />
    </div>
  );
};

export default Beds;
