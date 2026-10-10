import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from 'lucide-react';

const AuditLogs = () => {
  const { hasRole } = useAuth();
  const { error } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (search) params.append('search', search);
      if (moduleFilter !== 'All') params.append('module', moduleFilter);

      const res = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
      error('Failed to load audit trail logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, moduleFilter]);

  const modules = [
    'All',
    'Auth',
    'Student',
    'Room',
    'Bed',
    'Admission',
    'CheckInOut',
    'Fee',
    'Payment',
    'Attendance',
    'Leave',
    'Visitor',
    'Complaint',
    'Staff',
    'Inventory',
    'Announcement',
    'Settings',
    'System',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center">
          <ShieldCheck className="w-7 h-7 text-indigo-600 mr-2.5" /> System Audit & Activity Trail
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Immutable cryptographic activity trail tracking all system operations, security events, and database mutations.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            placeholder="Search action, user, or record ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Module:</span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Button onClick={fetchLogs} variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Querying secure audit ledger..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No activity logs found"
            description="No system records matching current criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 uppercase font-bold text-slate-400">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Operation Event</th>
                  <th className="py-3.5 px-4">Record Identifier</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      {log.userName}
                      <span className="block text-[10px] text-slate-400 font-normal uppercase">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-semibold">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {log.recordId || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {log.ipAddress || 'Internal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{pagination.total}</span> audit records
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
