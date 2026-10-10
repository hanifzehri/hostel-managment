import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRightLeft,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  X,
  ShieldAlert,
} from 'lucide-react';

const MAX_STUDENT_CAPACITY = 40;

const formatCnic = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
};

const Students = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const { success, error } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 40, total: 0, totalPages: 1 });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Available rooms and beds for admission/assignment
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState('1');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Photo upload state
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);

  // Transfer Room Modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState(null);
  const [transferFloor, setTransferFloor] = useState('1');
  const [transferRoomId, setTransferRoomId] = useState('');
  const [transferBedId, setTransferBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Deactivate/Delete confirmation modal state
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
    feeStatus: 'Paid',
    floor: '1',
    room: '',
    bed: '',
    emergencyContactName: '',
    relationship: 'Father',
    emergencyPhone: '',
    profilePhoto: '',
    profilePicture: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

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
      if (floorFilter !== 'All') params.append('floor', floorFilter);

      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 40, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
      error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, statusFilter, floorFilter]);

  // Handle URL query trigger for ?action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddModal();
      setSearchParams({});
    }
  }, [searchParams]);

  // Load rooms and beds
  const loadAvailableBedsAndRooms = async () => {
    try {
      const [roomsRes, bedsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/beds?status=Available'),
      ]);
      setAvailableRooms(roomsRes.data.data || []);
      setAvailableBeds(bedsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load rooms/beds:', err);
    }
  };

  const openAddModal = () => {
    setSelectedStudent(null);
    setFormData(initialFormData);
    setPhotoPreview('');
    setFormErrors({});
    setSelectedFloor('1');
    setSelectedRoomId('');
    loadAvailableBedsAndRooms();
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    const photo = student.profilePhoto || student.profilePicture || '';
    setPhotoPreview(photo);
    setFormErrors({});
    setSelectedFloor(String(student.floor || student.room?.floor || '1'));
    setSelectedRoomId(student.room?._id || '');
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
      city: student.city || 'Khuzdar',
      province: student.province || 'Balochistan',
      nationality: student.nationality || 'Pakistani',
      institution: student.institution || '',
      degree: student.degree || '',
      department: student.department || '',
      semester: student.semester || '',
      rollNumber: student.rollNumber || '',
      floor: String(student.floor || student.room?.floor || '1'),
      room: student.room?._id || '',
      bed: student.bed?._id || '',
      emergencyContactName: student.emergencyContactName || '',
      relationship: student.relationship || 'Father',
      emergencyPhone: student.emergencyPhone || '',
      collegeContact: student.collegeContact || '+92 848 550123',
      monthlyFee: student.monthlyFee || 10000,
      feeStatus: student.feeStatus || 'Paid',
      profilePhoto: photo,
      profilePicture: photo,
      notes: student.notes || '',
    });
    loadAvailableBedsAndRooms();
    setIsModalOpen(true);
  };

  // Photo upload handler
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('Image size must be less than 5MB.');
      return;
    }

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);

    // Upload immediately to persistent server disk storage
    const uploadData = new FormData();
    uploadData.append('photo', file);

    try {
      setPhotoUploading(true);
      const res = await api.post('/students/upload-photo', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const persistentUrl = res.data.photoUrl;
      setFormData((prev) => ({
        ...prev,
        profilePhoto: persistentUrl,
        profilePicture: persistentUrl,
      }));
      setPhotoPreview(persistentUrl);
      success('Photograph uploaded successfully to persistent server storage.');
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || 'Failed to upload photo to server.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Student full name is required.';
    if (!formData.fatherName.trim()) errors.fatherName = "Father's name is required.";

    // CNIC Validation: Mandatory & Pakistani format 13 digits
    const cnicRegex = /^\d{5}-?\d{7}-?\d{1}$/;
    if (!formData.cnic.trim()) {
      errors.cnic = 'CNIC number is strictly required.';
    } else if (!cnicRegex.test(formData.cnic.trim())) {
      errors.cnic = 'Invalid CNIC format. Format must be 13 digits (e.g. 54400-1234567-1).';
    }

    // Phone Validation: Mandatory & Valid format
    const phoneRegex = /^(\+92|0)?3\d{9}$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Contact number is strictly required.';
    } else if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, '')) && formData.phone.length < 10) {
      errors.phone = 'Invalid contact format (e.g. 03001234567 or +923001234567).';
    }

    if (!formData.institution.trim()) errors.institution = 'College/Institute name is required.';
    if (!formData.address.trim()) errors.address = 'Permanent address is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      error('Please fix the highlighted validation errors before saving.');
      return;
    }

    setModalLoading(true);
    try {
      const payload = { ...formData };
      if (selectedRoomId) payload.room = selectedRoomId;
      payload.floor = selectedFloor;

      if (selectedStudent) {
        await api.put(`/students/${selectedStudent._id}`, payload);
        success('Student profile updated successfully.');
      } else {
        await api.post('/students', payload);
        success('New student admitted successfully (40-student capacity verified).');
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

  // Open Room Transfer Modal
  const openTransferModal = (student) => {
    setStudentToTransfer(student);
    setTransferFloor(String(student.floor || student.room?.floor || '1'));
    setTransferRoomId('');
    setTransferBedId('');
    setTransferReason('');
    loadAvailableBedsAndRooms();
    setTransferModalOpen(true);
  };

  // Initiate Transfer Confirmation
  const handleTransferRequest = (e) => {
    e.preventDefault();
    if (!transferRoomId || !transferBedId) {
      error('Please select both a destination room and an available bed.');
      return;
    }
    const targetRoom = availableRooms.find((r) => String(r._id) === String(transferRoomId));
    if (targetRoom && targetRoom.currentOccupants >= targetRoom.capacity) {
      error(`Room ${targetRoom.roomNumber} is FULL. Cannot transfer student to a full room.`);
      return;
    }
    setTransferConfirmOpen(true);
  };

  // Execute Transfer
  const executeTransfer = async () => {
    if (!studentToTransfer || !transferRoomId || !transferBedId) return;
    setTransferLoading(true);
    try {
      const res = await api.post(`/students/${studentToTransfer._id}/transfer-room`, {
        newRoomId: transferRoomId,
        newBedId: transferBedId,
        reason: transferReason || 'Resident transfer requested by hostel manager.',
      });
      success(res.data.message || 'Student transferred to new room successfully.');
      setTransferConfirmOpen(false);
      setTransferModalOpen(false);
      fetchStudents();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to complete student transfer.');
    } finally {
      setTransferLoading(false);
    }
  };

  // Filtered rooms for modal
  const filteredModalRooms = availableRooms.filter(
    (r) => String(r.floor) === String(selectedFloor)
  );

  // Filtered rooms for transfer
  const filteredTransferRooms = availableRooms.filter(
    (r) => String(r.floor) === String(transferFloor)
  );

  const selectedTransferRoom = availableRooms.find(
    (r) => String(r._id) === String(transferRoomId)
  );

  const totalActiveCount = students.filter((s) => s.studentStatus === 'Active').length;
  const isHostelFull = pagination.total >= MAX_STUDENT_CAPACITY;

  return (
    <div className="space-y-6 pb-12">
      {/* 40-Student Capacity Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-[#1D2939] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#2563EB] dark:text-[#06B6D4] text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Royal Hostel Khuzdar Resident Registry</span>
          </div>
          <h1 className="text-2xl font-black text-[#101828] dark:text-white tracking-tight">
            Student Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configured for 40 students across 3 floors (12 rooms). Manage admission records, CNIC verification, bed allocation, and transfers.
          </p>
        </div>

        {/* Capacity Indicator & Add Button */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-[#F8FAFC] dark:bg-[#101828] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-500 dark:text-slate-400">Hostel Capacity</span>
              <span className={isHostelFull ? 'text-[#EF4444]' : 'text-[#2563EB] dark:text-[#06B6D4]'}>
                {pagination.total} / {MAX_STUDENT_CAPACITY} Residents
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isHostelFull
                    ? 'bg-[#EF4444]'
                    : pagination.total >= 35
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#2563EB]'
                }`}
                style={{ width: `${Math.min(100, (pagination.total / MAX_STUDENT_CAPACITY) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {MAX_STUDENT_CAPACITY - pagination.total > 0
                ? `${MAX_STUDENT_CAPACITY - pagination.total} available vacancies remaining`
                : 'Maximum hostel capacity reached (40/40)'}
            </p>
          </div>

          {hasRole(['superadmin', 'admin', 'receptionist']) && (
            <Button
              onClick={openAddModal}
              icon={UserPlus}
              variant="primary"
              disabled={isHostelFull}
            >
              {isHostelFull ? 'Hostel Full (40/40)' : 'New Student Admission'}
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-[#1D2939] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            placeholder="Search by name, CNIC, contact, roll #, institute..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] dark:bg-[#101828] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] text-[#101828] dark:text-white"
          />
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#101828] border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Checked Out">Checked Out</option>
          </select>

          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#101828] border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All 3 Floors</option>
            <option value="1">Floor 1 (101-104)</option>
            <option value="2">Floor 2 (201-204)</option>
            <option value="3">Floor 3 (301-304)</option>
          </select>

          <Button onClick={fetchStudents} variant="secondary" size="sm">
            Filter
          </Button>

          {/* Grid vs Table View Toggle */}
          <div className="flex items-center bg-[#F8FAFC] dark:bg-[#101828] p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              title="Student Cards Grid"
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner text="Loading Royal Hostel student records..." />
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="No student matches your current filter or search criteria."
          actionLabel="Add Student"
          onAction={openAddModal}
        />
      ) : viewMode === 'grid' ? (
        /* PROFESSIONAL STUDENT CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student) => {
            const photoUrl = student.profilePhoto || student.profilePicture;
            return (
              <div
                key={student._id}
                className="bg-white dark:bg-[#1D2939] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Photo, Name, Status */}
                  <div className="flex items-start space-x-3.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-[#2563EB]/30 overflow-hidden shrink-0 shadow-sm">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={student.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-xl text-[#2563EB]">
                          {student.fullName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-extrabold text-[#101828] dark:text-white text-base truncate">
                          {student.fullName}
                        </h3>
                        <Badge
                          variant={
                            student.studentStatus === 'Active'
                              ? 'success'
                              : student.studentStatus === 'Checked Out'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {student.studentStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 truncate">S/O {student.fatherName}</p>
                      <p className="text-xs font-mono font-bold text-[#2563EB] dark:text-[#06B6D4] mt-0.5">
                        ID: {student.studentId}
                      </p>
                    </div>
                  </div>

                  {/* Information Fields */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">CNIC Number:</span>
                      <span className="font-mono font-bold text-[#101828] dark:text-white">
                        {student.cnic}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Contact:</span>
                      <a
                        href={`tel:${student.phone}`}
                        className="font-mono text-[#2563EB] dark:text-[#06B6D4] hover:underline font-bold"
                      >
                        {student.phone}
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">College / Inst:</span>
                      <span className="font-medium text-[#101828] dark:text-slate-200 truncate max-w-[170px]">
                        {student.institution || 'BUET Khuzdar'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Monthly Fee:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[#101828] dark:text-white font-mono">
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
                          {student.feeStatus || 'Paid'}
                        </Badge>
                      </div>
                    </div>

                    {/* Room & Bed Allocation Highlight */}
                    <div className="bg-[#F8FAFC] dark:bg-[#101828] rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          Hostel Allocation
                        </span>
                        <span className="font-bold text-[#2563EB] dark:text-[#06B6D4]">
                          Floor {student.floor || student.room?.floor || '1'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-extrabold text-[#101828] dark:text-white mt-1">
                        <span>Room {student.room?.roomNumber || 'Not assigned'}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {student.bed?.bedNumber || 'No Bed Assigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => navigate(`/students/${student._id}`)}
                      title="View Full Profile"
                      className="p-2 rounded-xl text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/id-cards?studentId=${student._id}`)}
                      title="View / Print Student Card"
                      className="p-2 rounded-xl text-slate-500 hover:text-[#06B6D4] hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <IdCard className="w-4 h-4" />
                    </button>
                    {hasRole(['superadmin', 'admin', 'receptionist']) && (
                      <button
                        onClick={() => openEditModal(student)}
                        title="Edit Details"
                        className="p-2 rounded-xl text-slate-500 hover:text-[#F59E0B] hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {hasRole(['superadmin', 'admin', 'warden', 'receptionist']) && (
                      <Button
                        onClick={() => openTransferModal(student)}
                        size="xs"
                        variant="secondary"
                        icon={ArrowRightLeft}
                      >
                        Change Room
                      </Button>
                    )}
                    {hasRole(['superadmin', 'admin']) && student.studentStatus === 'Active' && (
                      <button
                        onClick={() => {
                          setDeactivatingStudentId(student._id);
                          setConfirmModalOpen(true);
                        }}
                        title="Deactivate Resident"
                        className="p-2 rounded-xl text-slate-400 hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#1D2939] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">ID & Mandatory CNIC</th>
                  <th className="py-3.5 px-4">Floor & Room</th>
                  <th className="py-3.5 px-4">College / Institute</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {students.map((student) => {
                  const photoUrl = student.profilePhoto || student.profilePicture;
                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              student.fullName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#101828] dark:text-white leading-tight">
                              {student.fullName}
                            </p>
                            <p className="text-xs text-slate-400">S/O {student.fatherName}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-mono font-bold text-[#2563EB] dark:text-[#06B6D4] block">
                          {student.studentId}
                        </span>
                        <span className="font-mono text-[11px] text-[#101828] dark:text-slate-200 font-semibold">
                          {student.cnic}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {student.room ? (
                          <div className="text-xs">
                            <span className="font-semibold text-[#2563EB] dark:text-[#06B6D4]">
                              Floor {student.floor || student.room.floor} • Room {student.room.roomNumber}
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
                        <p className="font-medium text-[#101828] dark:text-slate-200">
                          {student.institution}
                        </p>
                        <p className="text-slate-400 text-[11px]">{student.degree}</p>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-medium text-[#101828] dark:text-slate-200 font-mono">
                          {student.phone}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Emerg: {student.emergencyPhone || 'N/A'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-bold text-[#101828] dark:text-white block font-mono">
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
                          {student.feeStatus || 'Paid'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge>{student.studentStatus}</Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openTransferModal(student)}
                            title="Change Room"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/students/${student._id}`)}
                            title="View Full Profile"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/id-cards?studentId=${student._id}`)}
                            title="Student ID Card"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#06B6D4] hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>
                          {hasRole(['superadmin', 'admin', 'receptionist']) && (
                            <button
                              onClick={() => openEditModal(student)}
                              title="Edit Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#F59E0B] hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
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
                              title="Deactivate Resident"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1D2939] rounded-2xl">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-[#101828] dark:text-white">{students.length}</span> of{' '}
          <span className="font-semibold text-[#101828] dark:text-white">{pagination.total}</span> residents
          (Max: {MAX_STUDENT_CAPACITY})
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#101828] dark:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page >= pagination.totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#101828] dark:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. STUDENT REGISTRATION & EDIT MODAL                      */}
      {/* ========================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? 'Edit Student Record' : 'New Student Admission Form'}
        subtitle="Mandatory CNIC & contact verification, persistent photo storage, and 3-floor bed allocation."
        maxWidth="max-w-4xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} loading={modalLoading}>
              {selectedStudent ? 'Save Profile Changes' : 'Confirm & Register Student (Max 40)'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-6 text-sm">
          {/* Section 0: Photograph Upload with Persistent Server Storage */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#101828] border border-slate-200/90 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4] mb-3 flex items-center">
              <Camera className="w-4 h-4 mr-1.5" /> Student Photograph (Persistent Storage)
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-[#2563EB]/40 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Student Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Camera className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                    <span className="text-[10px] block">No Photo</span>
                  </div>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    loading={photoUploading}
                  >
                    Select Photo from Device
                  </Button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview('');
                        setFormData((prev) => ({ ...prev, profilePhoto: '', profilePicture: '' }));
                      }}
                      className="text-xs text-[#EF4444] hover:underline px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Supported formats: JPG, PNG, WEBP (Max 5MB). Photo is saved permanently on the server under <code className="text-[#2563EB]">/uploads/</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Personal Particulars */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4] mb-3 border-b border-blue-100 dark:border-blue-950 pb-1">
              1. Personal Particulars & Mandatory Verification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Tariq Baloch"
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm ${
                    formErrors.fullName ? 'border-[#EF4444]' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-[#EF4444] mt-0.5">{formErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Father's Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="e.g. Abdul Samad"
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm ${
                    formErrors.fatherName ? 'border-[#EF4444]' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.fatherName && (
                  <p className="text-[11px] text-[#EF4444] mt-0.5">{formErrors.fatherName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  CNIC / B-Form * <span className="text-[#2563EB]">(Required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.cnic}
                  onChange={(e) => {
                    const formatted = formatCnic(e.target.value);
                    setFormData({ ...formData, cnic: formatted });
                  }}
                  placeholder="54400-1234567-1"
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono font-bold ${
                    formErrors.cnic ? 'border-[#EF4444]' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.cnic ? (
                  <p className="text-[11px] text-[#EF4444] mt-0.5">{formErrors.cnic}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">13 digits format: XXXXX-XXXXXXX-X</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Student Contact Number * <span className="text-[#2563EB]">(Required)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0300 1234567"
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono ${
                    formErrors.phone ? 'border-[#EF4444]' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-[#EF4444] mt-0.5">{formErrors.phone}</p>
                )}
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

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Permanent Residential Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House #, Street #, Tehsil, District, Balochistan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: College / Educational Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4] mb-3 border-b border-blue-100 dark:border-blue-950 pb-1">
              2. College / Educational Institute Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  College / Institute Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. BUET Khuzdar / Degree College"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Degree / Program
                </label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. BS Civil Engineering"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  College Contact / Landline
                </label>
                <input
                  type="text"
                  value={formData.collegeContact}
                  onChange={(e) => setFormData({ ...formData, collegeContact: e.target.value })}
                  placeholder="+92 848 550123"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Three-Floor Hostel Structure Allocation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4] mb-3 border-b border-blue-100 dark:border-blue-950 pb-1">
              3. Three-Floor Hostel Allocation (12 Rooms Total)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Select Floor *
                </label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setSelectedRoomId('');
                    setFormData((prev) => ({ ...prev, floor: e.target.value, room: '', bed: '' }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                >
                  <option value="1">Floor 1 (Rooms 101, 102, 103, 104)</option>
                  <option value="2">Floor 2 (Rooms 201, 202, 203, 204)</option>
                  <option value="3">Floor 3 (Rooms 301, 302, 303, 304)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Select Room *
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    setFormData((prev) => ({ ...prev, room: e.target.value, bed: '' }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                >
                  <option value="">-- Choose Room on Floor {selectedFloor} --</option>
                  {filteredModalRooms.map((r) => {
                    const isFull = r.currentOccupants >= r.capacity;
                    return (
                      <option key={r._id} value={r._id} disabled={isFull}>
                        Room {r.roomNumber} ({r.currentOccupants}/{r.capacity} beds occupied
                        {isFull ? ' - FULL' : ` - ${r.availableBeds} available`})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Assign Bed Identifier *
                </label>
                <select
                  value={formData.bed}
                  onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                >
                  <option value="">-- Choose Available Bed --</option>
                  {availableBeds
                    .filter((b) => !selectedRoomId || String(b.room?._id || b.room) === String(selectedRoomId))
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.bedNumber} ({b.room?.roomNumber ? `Room ${b.room.roomNumber}` : 'Selected Room'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Emergency Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4] mb-3 border-b border-blue-100 dark:border-blue-950 pb-1">
              4. Emergency Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Guardian / Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="e.g. Abdul Samad"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  placeholder="Father / Brother / Uncle"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="text"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="+92 333 1234567"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Monthly Hostel Fee */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#06B6D4] mb-3 border-b border-blue-100 dark:border-blue-950 pb-1">
              5. Monthly Hostel Fee & Financial Records
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Monthly Hostel Fee (PKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101828] dark:text-slate-300 mb-1">
                  Initial Fee Status
                </label>
                <select
                  value={formData.feeStatus}
                  onChange={(e) => setFormData({ ...formData, feeStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* 2. TRANSFER ROOM MODAL (Requirement 3)                    */}
      {/* ========================================================= */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={`Change Room for ${studentToTransfer?.fullName || 'Student'}`}
        subtitle="Transfer resident to another room/floor with live capacity checks and history logging."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTransferRequest}
              disabled={!transferRoomId || !transferBedId || selectedTransferRoom?.currentOccupants >= selectedTransferRoom?.capacity}
            >
              Verify & Proceed with Transfer
            </Button>
          </>
        }
      >
        {studentToTransfer && (
          <div className="space-y-4 text-xs">
            {/* Current Room Highlight */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Current Room Assignment
              </span>
              <div className="flex items-center justify-between font-extrabold text-sm text-[#101828] dark:text-white">
                <span>
                  Floor {studentToTransfer.floor || studentToTransfer.room?.floor || '1'} • Room {studentToTransfer.room?.roomNumber || 'N/A'}
                </span>
                <span className="text-xs text-[#2563EB] dark:text-[#06B6D4]">
                  {studentToTransfer.bed?.bedNumber || 'Assigned Bed'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                CNIC ({studentToTransfer.cnic}), contact, photograph, and billing records will remain intact.
              </p>
            </div>

            {/* Destination Floor Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Floor:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3'].map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => {
                      setTransferFloor(fl);
                      setTransferRoomId('');
                      setTransferBedId('');
                    }}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-colors ${
                      transferFloor === fl
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Floor {fl}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Room Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Room (Floor {transferFloor}):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {filteredTransferRooms.map((room) => {
                  const isFull = room.currentOccupants >= room.capacity;
                  const isCurrent = String(room._id) === String(studentToTransfer.room?._id);
                  const isSelected = String(room._id) === String(transferRoomId);

                  return (
                    <button
                      key={room._id}
                      type="button"
                      disabled={isFull || isCurrent}
                      onClick={() => {
                        setTransferRoomId(room._id);
                        setTransferBedId('');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-[#2563EB]'
                          : isFull
                          ? 'border-[#EF4444]/30 bg-red-50/40 dark:bg-red-950/20 opacity-60 cursor-not-allowed'
                          : isCurrent
                          ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-700 hover:border-[#2563EB] bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-sm">
                        <span>Room {room.roomNumber}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            isFull
                              ? 'bg-[#EF4444] text-white'
                              : room.currentOccupants === 0
                              ? 'bg-[#10B981] text-white'
                              : 'bg-[#F59E0B] text-white'
                          }`}
                        >
                          {isFull ? 'FULL' : room.currentOccupants === 0 ? 'AVAILABLE' : 'PARTIAL'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Occupants: {room.currentOccupants}/{room.capacity}</span>
                        <span className="font-bold text-[#10B981]">
                          {room.availableBeds} beds free
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destination Bed Selection */}
            {transferRoomId && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Free Bed in Room {selectedTransferRoom?.roomNumber}:
                </label>
                <select
                  value={transferBedId}
                  onChange={(e) => setTransferBedId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="">-- Choose Free Bed --</option>
                  {availableBeds
                    .filter((b) => String(b.room?._id || b.room) === String(transferRoomId))
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.bedNumber} (Unallocated)
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Transfer Reason */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Room Change (Optional):
              </label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Resident requested quiet room, medical preference, roommate match"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Step Before Transfer Completion */}
      <ConfirmationModal
        isOpen={transferConfirmOpen}
        onClose={() => setTransferConfirmOpen(false)}
        onConfirm={executeTransfer}
        title="Confirm Resident Transfer"
        message={`Are you sure you want to transfer ${studentToTransfer?.fullName} to Room ${selectedTransferRoom?.roomNumber} (Floor ${selectedTransferRoom?.floor})? The previous bed will immediately become Available, and a permanent transfer history entry will be recorded.`}
      />

      {/* Confirmation Modal for Student Deactivation */}
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
