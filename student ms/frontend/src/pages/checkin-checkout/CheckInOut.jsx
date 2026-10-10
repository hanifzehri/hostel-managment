import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  Compass,
  LogIn,
  LogOut,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  DoorOpen,
} from 'lucide-react';

const CheckInOut = () => {
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Active students and available beds
  const [activeStudents, setActiveStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);

  // Check-In Form
  const [checkInData, setCheckInData] = useState({
    studentId: '',
    bedId: '',
    notes: 'Regular check-in arrival',
  });

  // Check-Out Form
  const [checkOutData, setCheckOutData] = useState({
    studentId: '',
    reason: 'Academic Session Completed',
    roomCondition: 'Good',
    returnedItems: ['Room Key', 'Hostel ID Card', 'Cupboard Key'],
    notes: 'All dues and room inspections cleared.',
  });
  const [studentDues, setStudentDues] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'All') params.append('type', typeFilter);

      const res = await api.get(`/check-in-out?${params.toString()}`);
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load check-in/out records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [typeFilter]);

  const openCheckInModal = async () => {
    try {
      const [stuRes, bedRes] = await Promise.all([
        api.get('/students'),
        api.get('/beds?status=Available'),
      ]);
      const list = stuRes.data.data || [];
      setPendingStudents(list.filter((s) => s.studentStatus !== 'Active'));
      setAvailableBeds(bedRes.data.data || []);
      setCheckInModalOpen(true);
    } catch (err) {
      error('Failed to prepare check-in modal.');
    }
  };

  const openCheckOutModal = async () => {
    try {
      const res = await api.get('/students?status=Active');
      const list = res.data.data || [];
      setActiveStudents(list);
      setCheckOutData({ ...checkOutData, studentId: list[0]?._id || '' });
      if (list[0]) checkDuesForStudent(list[0]._id);
      setCheckOutModalOpen(true);
    } catch (err) {
      error('Failed to prepare check-out modal.');
    }
  };

  const checkDuesForStudent = async (studentId) => {
    try {
      const res = await api.get(`/fees?status=Pending`);
      const studentPending = (res.data.data || []).filter((f) => f.student?._id === studentId);
      const total = studentPending.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);
      setStudentDues(total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessCheckIn = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/check-in-out/check-in', checkInData);
      success('Student checked in and activated successfully.');
      setCheckInModalOpen(false);
      fetchLogs();
    } catch (err) {
      error(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleProcessCheckOut = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/check-in-out/check-out', checkOutData);
      success('Student checked out successfully. Bed is now available.');
      setCheckOutModalOpen(false);
      fetchLogs();
    } catch (err) {
      error(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Check-In & Check-Out Operations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Formal resident onboarding, departures, room condition inspections, and dues verification.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'warden', 'security']) && (
          <div className="flex items-center space-x-2">
            <Button onClick={openCheckInModal} icon={LogIn} variant="primary">
              Process Check-In
            </Button>
            <Button onClick={openCheckOutModal} icon={LogOut} variant="secondary">
              Process Check-Out
            </Button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter Event:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Events</option>
            <option value="CheckIn">Check-Ins</option>
            <option value="CheckOut">Check-Outs</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving check-in / check-out history..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No records found"
            description="No check-ins or check-outs have been logged yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Room & Bed</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Condition / Details</th>
                  <th className="py-3.5 px-4">Staff Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          log.type === 'CheckIn'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {log.type === 'CheckIn' ? (
                          <LogIn className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5 mr-1" />
                        )}
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {log.student?.fullName || 'Student'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {log.student?.studentId || 'ID'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Room {log.room?.roomNumber || 'N/A'} • {log.bed?.bedNumber || 'Bed'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(log.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.type === 'CheckOut' ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Reason: {log.reason}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            Condition: {log.roomCondition} • Pending: {settings.currency} {log.pendingDues || 0}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">{log.notes || 'Arrival completed.'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {log.staff?.name || 'Authorized Staff'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      <Modal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        title="Process Student Check-In"
        subtitle="Activate resident and bind room/bed assignment."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCheckInModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleProcessCheckIn} loading={modalLoading}>
              Confirm Check-In
            </Button>
          </>
        }
      >
        <form onSubmit={handleProcessCheckIn} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Select Student to Check In:
            </label>
            <select
              required
              value={checkInData.studentId}
              onChange={(e) => setCheckInData({ ...checkInData, studentId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Student --</option>
              {pendingStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId} • Status: {s.studentStatus})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Assign Available Bed:
            </label>
            <select
              required
              value={checkInData.bedId}
              onChange={(e) => setCheckInData({ ...checkInData, bedId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Bed --</option>
              {availableBeds.map((b) => (
                <option key={b._id} value={b._id}>
                  Room {b.room?.roomNumber} - {b.bedNumber} ({b.room?.block})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Notes</label>
            <textarea
              rows="2"
              value={checkInData.notes}
              onChange={(e) => setCheckInData({ ...checkInData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>

      {/* Check-Out Modal */}
      <Modal
        isOpen={checkOutModalOpen}
        onClose={() => setCheckOutModalOpen(false)}
        title="Process Student Check-Out"
        subtitle="Review inspection condition, keys return, and dues clearance before vacating bed."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCheckOutModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleProcessCheckOut} loading={modalLoading}>
              Complete Departure & Vacate Bed
            </Button>
          </>
        }
      >
        <form onSubmit={handleProcessCheckOut} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Select Active Resident:
            </label>
            <select
              required
              value={checkOutData.studentId}
              onChange={(e) => {
                setCheckOutData({ ...checkOutData, studentId: e.target.value });
                checkDuesForStudent(e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Resident --</option>
              {activeStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId} • Room {s.room?.roomNumber || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Dues Warning if any */}
          {studentDues > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-400">Outstanding Dues Warning</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-300">
                  This student has {settings.currency} {studentDues.toLocaleString()} in pending invoices.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Departure Reason
            </label>
            <input
              type="text"
              required
              value={checkOutData.reason}
              onChange={(e) => setCheckOutData({ ...checkOutData, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Room Condition Inspection
            </label>
            <select
              value={checkOutData.roomCondition}
              onChange={(e) => setCheckOutData({ ...checkOutData, roomCondition: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Satisfactory">Satisfactory</option>
              <option value="Needs Cleaning">Needs Cleaning</option>
              <option value="Damaged">Damaged (Fine applicable)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CheckInOut;
