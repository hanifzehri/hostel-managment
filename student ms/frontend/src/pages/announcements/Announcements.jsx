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
  Bell,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const Announcements = () => {
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const initialData = {
    title: '',
    message: '',
    audience: 'All',
    priority: 'Normal',
  };
  const [formData, setFormData] = useState(initialData);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error(err);
      error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/announcements', formData);
      success('Announcement published and notification broadcast dispatched.');
      setModalOpen(false);
      setFormData(initialData);
      fetchAnnouncements();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      success('Announcement removed.');
      fetchAnnouncements();
    } catch (err) {
      error('Failed to delete announcement.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Announcements & Notice Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Broadcast official hostel updates, maintenance schedules, and administrative notices.
          </p>
        </div>

        {hasRole(['superadmin', 'admin', 'warden']) && (
          <Button onClick={() => setModalOpen(true)} icon={Plus} variant="primary">
            Publish New Notice
          </Button>
        )}
      </div>

      {/* Announcements List */}
      {loading ? (
        <LoadingSpinner text="Retrieving notices..." />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No notices published"
          description="Click Publish New Notice to post an update for residents."
          actionLabel="Publish Notice"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann._id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-all flex flex-col md:flex-row items-start justify-between gap-4"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ann.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        : ann.priority === 'Important'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                    }`}
                  >
                    {ann.priority} Notice
                  </span>
                  <span className="text-xs text-slate-400">Audience: {ann.audience}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString([], {
                      dateStyle: 'medium',
                    })}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ann.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {ann.message}
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Posted by: {ann.createdBy?.name || 'Administration'}
                </p>
              </div>

              {hasRole(['superadmin', 'admin']) && (
                <button
                  onClick={() => handleDelete(ann._id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Notice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publish Official Notice"
        subtitle="This notice will appear on the dashboard feed and dispatch an in-app alert."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={modalLoading}>
              Broadcast Notice
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Standby Generator Maintenance"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Audience</label>
              <select
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="All">All Hostel Residents & Staff</option>
                <option value="Students">Students Only</option>
                <option value="Staff">Staff Only</option>
                <option value="Wardens">Wardens Only</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Message Content *
            </label>
            <textarea
              rows="4"
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Type the full message..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Announcements;
