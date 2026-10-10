import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  IdCard,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Phone,
  Building,
  BedDouble,
  CheckCircle,
} from 'lucide-react';

const Students = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [blockFilter, setBlockFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Available rooms and beds for admission/assignment
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deactivatingStudentId, setDeactivatingStudentId] = useState(null);

  // Student Form State
  const initialFormData = {
    fullName: '',
    fatherName: '',
    cnic: '',
    dob: '2003-01-01',
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '',
    email: '',
    address: 'Near Jhalawan Complex, Khuzdar',
    city: 'Khuzdar',
    province: 'Balochistan',
    nationality: 'Pakistani',
    institution: 'BUET Khuzdar',
    collegeContact: '+92 848 550123',
    degree: 'BS Civil Engineering',
    department: 'Civil Engineering',
    semester: '1st Semester',
    rollNumber: '',
    monthlyFee: 10000,
    feeStatus: 'Unpaid',
    room: '',
    bed: '',
    emergencyContactName: '',
    relationship: 'Father',
    emergencyPhone: '',
    profilePhoto: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (blockFilter !== 'All') params.append('block', blockFilter);

      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
      error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, statusFilter, blockFilter]);

  // Handle URL query trigger for ?action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddModal();
      setSearchParams({});
    }
  }, [searchParams]);

  // Load available rooms & beds
  const loadAvailableBedsAndRooms = async () => {
    try {
      const [roomsRes, bedsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/beds?status=Available'),
      ]);
      setAvailableRooms(roomsRes.data.data || []);
      setAvailableBeds(bedsRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setSelectedStudent(null);
    setFormData(initialFormData);
    loadAvailableBedsAndRooms();
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName || '',
      fatherName: student.fatherName || '',
      cnic: student.cnic || '',
      dob: student.dob ? student.dob.split('T')[0] : '2003-01-01',
      gender: student.gender || 'Male',
      bloodGroup: student.bloodGroup || 'B+',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      city: student.city || 'Lahore',
      province: student.province || 'Punjab',
      nationality: student.nationality || 'Pakistani',
      institution: student.institution || '',
      degree: student.degree || '',
      department: student.department || '',
      semester: student.semester || '',
      rollNumber: student.rollNumber || '',
      room: student.room?._id || '',
      bed: student.bed?._id || '',
      emergencyContactName: student.emergencyContactName || '',
      relationship: student.relationship || 'Father',
      emergencyPhone: student.emergencyPhone || '',
      collegeContact: student.collegeContact || '+92 848 550123',
      monthlyFee: student.monthlyFee || 10000,
      feeStatus: student.feeStatus || 'Paid',
      profilePicture: student.profilePicture || '',
      notes: student.notes || '',
    });
    setSelectedRoomId(student.room?._id || '');
    loadAvailableBedsAndRooms();
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (selectedStudent) {
        await api.put(`/students/${selectedStudent._id}`, formData);
        success('Student profile updated successfully.');
      } else {
        await api.post('/students', formData);
        success('New student admitted successfully.');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save student.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingStudentId) return;
    try {
      await api.delete(`/students/${deactivatingStudentId}`);
      success('Student deactivated and assigned bed vacated.');
      setConfirmModalOpen(false);
      fetchStudents();
    } catch (err) {
      error(err.response?.data?.message || 'Deactivation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student registrations, academic records, bed allocations, and profiles.
          </p>
        </div>
        {hasRole(['superadmin', 'admin', 'receptionist']) && (
          <Button onClick={openAddModal} icon={UserPlus} variant="primary">
            New Admission
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            placeholder="Search name, ID, CNIC, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
          </select>

          <Button onClick={fetchStudents} variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Student Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching student records..." />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No student matches your current filter or search criteria."
            actionLabel="Add Student"
            onAction={openAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Student ID & CNIC</th>
                  <th className="py-3.5 px-4">Room & Bed</th>
                  <th className="py-3.5 px-4">College / University</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {students.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                          {student.profilePhoto ? (
                            <img
                              src={student.profilePhoto}
                              alt={student.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            student.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-slate-400">S/O {student.fatherName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400 block">
                        {student.studentId}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{student.cnic}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {student.room ? (
                        <div className="text-xs">
                          <span className="font-semibold text-teal-600 dark:text-teal-400">
                            {student.block} • Room {student.room.roomNumber}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {student.bed?.bedNumber || 'No Bed Assigned'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No room allocated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{student.institution}</p>
                      <p className="text-slate-400 text-[11px]">{student.degree}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{student.phone}</p>
                      <p className="text-[11px] text-slate-400">Emerg: {student.emergencyPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        PKR {(student.monthlyFee || 10000).toLocaleString()}
                      </span>
                      <Badge
                        variant={
                          student.feeStatus === 'Paid'
                            ? 'success'
                            : student.feeStatus === 'Partial'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {student.feeStatus || 'Unpaid'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{student.studentStatus}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => navigate(`/students/${student._id}`)}
                          title="View Full Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/id-cards?studentId=${student._id}`)}
                          title="Print ID Card"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <IdCard className="w-4 h-4" />
                        </button>
                        {hasRole(['superadmin', 'admin', 'receptionist']) && (
                          <button
                            onClick={() => openEditModal(student)}
                            title="Edit Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {hasRole(['superadmin', 'admin']) && student.studentStatus === 'Active' && (
                          <button
                            onClick={() => {
                              setDeactivatingStudentId(student._id);
                              setConfirmModalOpen(true);
                            }}
                            title="Deactivate Student"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{students.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{pagination.total}</span> students
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

      {/* Student Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? 'Edit Student Details' : 'Student Admission Form'}
        subtitle="Complete personal, educational, and hostel bed assignment particulars."
        maxWidth="max-w-4xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} loading={modalLoading}>
              {selectedStudent ? 'Save Changes' : 'Confirm & Register Student'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-6 text-sm">
          {/* Section 1: Personal Particulars */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-indigo-950 pb-1">
              1. Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Hamza Tariq"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Father's Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CNIC / B-Form *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cnic}
                  onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  placeholder="35202-1234567-1"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">City / District</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Lahore"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Permanent Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House #, Street #, Colony/Sector, City"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Education Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-indigo-950 pb-1">
              2. Education & Academic Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Institution / University *
                </label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. FAST-NUCES / LUMS / UET"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Degree / Program *
                </label>
                <input
                  type="text"
                  required
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. BS Computer Science"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Semester / Year</label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="e.g. 5th Semester"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">College Contact Number</label>
                <input
                  type="text"
                  value={formData.collegeContact || ''}
                  onChange={(e) => setFormData({ ...formData, collegeContact: e.target.value })}
                  placeholder="+92 848 550123"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Room & Bed Assignment (Strict double-booking prevention) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-indigo-950 pb-1">
              3. Hostel Bed Allocation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    setFormData({ ...formData, bed: '' });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="">-- Choose Room --</option>
                  {availableRooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.block} - Room {r.roomNumber} ({r.roomType}, {r.availableBeds} beds available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assign Bed *
                </label>
                <select
                  value={formData.bed}
                  onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="">-- Select Available Bed --</option>
                  {availableBeds
                    .filter((b) => !selectedRoomId || String(b.room?._id || b.room) === String(selectedRoomId))
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.bedNumber} ({b.room?.roomNumber ? `Room ${b.room.roomNumber}` : 'Selected Room'})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Only available, unallocated beds are shown. Double-bed assignment is strictly prevented.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-indigo-950 pb-1">
              4. Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Relationship</label>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="e.g. Father / Guardian"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Phone *
                </label>
                <input
                  type="text"
                  required
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="+92 321 4455667"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Fee & Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-100 dark:border-indigo-950 pb-1">
              5. Monthly Fee & Financial Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Hostel Fee (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlyFee || 10000}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fee Status
                </label>
                <select
                  value={formData.feeStatus || 'Paid'}
                  onChange={(e) => setFormData({ ...formData, feeStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={formData.profilePicture || ''}
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Administrative Notes / Remarks
                </label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Resident records, special permissions or hostel notes"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Student"
        message="Are you sure you want to deactivate this student? Their assigned bed will immediately become Available for new residents, and their historical records will remain preserved."
      />
    </div>
  );
};

export default Students;
