import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  CalendarCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Save,
  Filter,
  Sparkles,
} from 'lucide-react';

const Attendance = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [blockFilter, setBlockFilter] = useState('All');
  const [studentsWithAtt, setStudentsWithAtt] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, present: 0, absent: 0, late: 0, leave: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for edits
  const [attendanceEdits, setAttendanceEdits] = useState({});

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ date });
      if (blockFilter !== 'All') params.append('block', blockFilter);

      const res = await api.get(`/attendance?${params.toString()}`);
      const list = res.data.data || [];
      setStudentsWithAtt(list);
      setStats(res.data.stats || {});

      // Initialize local edits with current status
      const initialMap = {};
      list.forEach((item) => {
        initialMap[item.student._id] = item.attendanceStatus === 'Not Marked' ? 'Present' : item.attendanceStatus;
      });
      setAttendanceEdits(initialMap);
    } catch (err) {
      console.error(err);
      error('Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date, blockFilter]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceEdits((prev) => ({ ...prev, [studentId]: status }));
  };

  // Quick 1-click action: Mark all present
  const handleMarkAllPresent = () => {
    const updated = {};
    studentsWithAtt.forEach((item) => {
      updated[item.student._id] = 'Present';
    });
    setAttendanceEdits(updated);
    success('All residents set to Present in current draft.');
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendanceEdits).map(([studentId, status]) => ({
        studentId,
        status,
        remarks: '',
      }));

      await api.post('/attendance/bulk-mark', { date, records });
      success(`Attendance for ${records.length} residents successfully saved for ${date}.`);
      fetchAttendance();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const statuses = [
    { label: 'Present', value: 'Present', color: 'emerald' },
    { label: 'Absent', value: 'Absent', color: 'rose' },
    { label: 'Late', value: 'Late', color: 'amber' },
    { label: 'Leave', value: 'Leave', color: 'purple' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Daily Resident Attendance Register
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conduct daily floor check-ins, record absences, and track student attendance percentages.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'warden']) && (
          <div className="flex items-center space-x-2">
            <Button onClick={handleMarkAllPresent} variant="outline" size="sm" icon={Sparkles}>
              Mark All Present
            </Button>
            <Button onClick={handleSaveAttendance} loading={saving} variant="primary" size="sm" icon={Save}>
              Save Attendance Sheet
            </Button>
          </div>
        )}
      </div>

      {/* Date & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Block:</span>
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            <option value="All">All Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
          </select>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
            {stats.totalStudents || 0}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-500 block">Present</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{stats.present || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-rose-500 block">Absent</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">{stats.absent || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-500 block">Late</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{stats.late || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-purple-500 block">On Leave</span>
          <span className="text-xl font-black text-purple-600 mt-1 block">{stats.leave || 0}</span>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading floor residents register..." />
        ) : studentsWithAtt.length === 0 ? (
          <EmptyState
            title="No active residents"
            description="There are currently no active students assigned to the selected block."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Resident</th>
                  <th className="py-3.5 px-4">Room & Bed</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentsWithAtt.map((item) => {
                  const student = item.student;
                  const currentChoice = attendanceEdits[student._id] || 'Present';

                  return (
                    <tr key={student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{student.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{student.studentId}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Room {student.room?.roomNumber || 'N/A'} • {student.bed?.bedNumber || 'Bed A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{student.phone}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          {statuses.map((st) => {
                            const isSelected = currentChoice === st.value;
                            return (
                              <button
                                key={st.value}
                                type="button"
                                onClick={() => handleStatusChange(student._id, st.value)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                  isSelected
                                    ? st.value === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : st.value === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : st.value === 'Late'
                                      ? 'bg-amber-600 text-white shadow-sm'
                                      : 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                {st.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
