import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import {
  User,
  Building,
  BedDouble,
  CreditCard,
  CalendarCheck,
  UserCheck,
  MessageSquareWarning,
  FileText,
  FileUp,
  Activity,
  ArrowLeft,
  IdCard,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Heart,
  Plus,
  CheckCircle,
  Clock,
  Download,
  AlertCircle,
  ArrowRightLeft,
  History,
} from 'lucide-react';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [student, setStudent] = useState(null);
  const [relations, setRelations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Room Transfer Modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFloor, setTransferFloor] = useState('1');
  const [transferRoomId, setTransferRoomId] = useState('');
  const [transferBedId, setTransferBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Transfer history state
  const [transferHistory, setTransferHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Document Upload Modal state
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Fetch full student profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${id}`);
      setStudent(res.data.student);
      setRelations(res.data.relations || {});
      setTransferFloor(String(res.data.student?.floor || res.data.student?.room?.floor || '1'));
    } catch (err) {
      console.error(err);
      error('Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transfer history
  const fetchTransferHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get(`/students/${id}/transfer-history`);
      setTransferHistory(res.data.data || []);
    } catch (err) {
      console.error('Failed to load transfer history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTransferHistory();
  }, [id]);

  // Load available rooms & beds for transfer
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

  const openTransferModal = () => {
    setTransferFloor(String(student?.floor || student?.room?.floor || '1'));
    setTransferRoomId('');
    setTransferBedId('');
    setTransferReason('');
    loadAvailableBedsAndRooms();
    setTransferModalOpen(true);
  };

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

  const executeTransfer = async () => {
    if (!transferRoomId || !transferBedId) return;
    setTransferLoading(true);
    try {
      const res = await api.post(`/students/${id}/transfer-room`, {
        newRoomId: transferRoomId,
        newBedId: transferBedId,
        reason: transferReason || 'Transfer requested via student profile',
      });
      success(res.data.message || 'Room changed successfully.');
      setTransferConfirmOpen(false);
      setTransferModalOpen(false);
      fetchProfile();
      fetchTransferHistory();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to complete room transfer.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!docFile) {
      error('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('title', docTitle || docFile.name);

    setUploadingDoc(true);
    try {
      await api.post(`/students/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      success('Document uploaded successfully.');
      setDocModalOpen(false);
      setDocTitle('');
      setDocFile(null);
      fetchProfile();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving complete student records..." size="lg" />;
  }

  if (!student) {
    return (
      <EmptyState
        title="Student record not found"
        description="The requested student could not be located."
        actionLabel="Back to Students"
        onAction={() => navigate('/students')}
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal & CNIC', icon: Heart },
    { id: 'hostel', label: 'Hostel & Floor', icon: Building },
    { id: 'transfers', label: `Room Transfers (${transferHistory.length})`, icon: History },
    { id: 'fees', label: `Fees (${relations?.fees?.length || 0})`, icon: CreditCard },
    { id: 'attendance', label: `Attendance (${relations?.attendanceStats?.percentage || 0}%)`, icon: CalendarCheck },
    { id: 'visitors', label: `Visitors (${relations?.visitors?.length || 0})`, icon: UserCheck },
    { id: 'complaints', label: `Complaints (${relations?.complaints?.length || 0})`, icon: MessageSquareWarning },
    { id: 'leaves', label: `Leave (${relations?.leaves?.length || 0})`, icon: FileText },
    { id: 'documents', label: `Documents (${student.documents?.length || 0})`, icon: FileUp },
    { id: 'activity', label: 'Activity Trail', icon: Activity },
  ];

  const filteredTransferRooms = availableRooms.filter(
    (r) => String(r.floor) === String(transferFloor)
  );
  const selectedTransferRoom = availableRooms.find(
    (r) => String(r._id) === String(transferRoomId)
  );

  const studentPhoto = student.profilePhoto || student.profilePicture;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Back Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/students')}
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-[#101828] dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Students
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {hasRole(['superadmin', 'admin', 'warden', 'receptionist']) && (
            <Button
              onClick={openTransferModal}
              variant="primary"
              size="sm"
              icon={ArrowRightLeft}
            >
              Change Room
            </Button>
          )}

          <Button
            onClick={() => navigate(`/id-cards?studentId=${student._id}`)}
            variant="outline"
            size="sm"
            icon={IdCard}
          >
            Generate Student Card
          </Button>

          <Button
            onClick={() => navigate(`/fees?studentId=${student._id}&action=collect`)}
            variant="secondary"
            size="sm"
            icon={CreditCard}
          >
            Manage Fees
          </Button>
        </div>
      </div>

      {/* Main Student Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#1D2939] border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            {studentPhoto ? (
              <img
                src={studentPhoto}
                alt={student.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#2563EB]/40 dark:border-slate-700 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#2563EB] text-white font-extrabold text-2xl flex items-center justify-center shadow-sm shrink-0">
                {student.fullName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-[#101828] dark:text-white tracking-tight">
                  {student.fullName}
                </h1>
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
              <p className="text-xs font-mono font-bold text-[#2563EB] dark:text-[#06B6D4] mt-1">
                ID: {student.studentId} • CNIC: {student.cnic}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {student.degree} • {student.institution}
              </p>
            </div>
          </div>

          {/* Quick Room & Floor Highlight with Change Room CTA */}
          <div className="flex items-center space-x-4 bg-[#F8FAFC] dark:bg-[#101828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <BedDouble className="w-9 h-9 text-[#2563EB] dark:text-[#06B6D4] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Floor & Room Assignment
              </p>
              <p className="text-sm font-black text-[#101828] dark:text-white">
                Floor {student.floor || student.room?.floor || '1'} • Room {student.room?.roomNumber || 'N/A'}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {student.bed?.bedNumber || 'No Bed Assigned'}
              </p>
            </div>
            {hasRole(['superadmin', 'admin', 'warden', 'receptionist']) && (
              <Button onClick={openTransferModal} size="xs" variant="outline" icon={ArrowRightLeft}>
                Transfer
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex items-center space-x-1 overflow-x-auto border-b border-slate-100 dark:border-slate-800 pb-px scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/20'
                    : 'text-slate-500 hover:text-[#101828] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Facts */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h3 className="text-base font-bold text-[#101828] dark:text-white mb-4">
                Personal & Contact Particulars
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">CNIC / B-Form (Mandatory)</span>
                  <span className="font-mono font-bold text-[#2563EB] dark:text-[#06B6D4] text-sm">
                    {student.cnic}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Student Contact Number</span>
                  <a
                    href={`tel:${student.phone}`}
                    className="font-mono font-bold text-[#101828] dark:text-slate-200 text-sm hover:underline"
                  >
                    {student.phone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">College / Institute</span>
                  <span className="font-bold text-[#101828] dark:text-slate-200">
                    {student.institution || 'BUET Khuzdar'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Blood Group</span>
                  <span className="font-bold text-[#EF4444]">{student.bloodGroup}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5 font-medium">Permanent Address</span>
                  <span className="font-medium text-[#101828] dark:text-slate-200">
                    {student.address}, {student.city}, {student.province}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-bold text-[#101828] dark:text-white mb-4">
                Emergency Guardian Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Guardian Name</span>
                  <span className="font-bold text-[#101828] dark:text-slate-200">
                    {student.emergencyContactName || student.fatherName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Relationship</span>
                  <span className="font-bold text-[#101828] dark:text-slate-200">
                    {student.relationship || 'Father'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Emergency Phone</span>
                  <span className="font-bold text-[#10B981] font-mono text-sm">
                    {student.emergencyPhone || 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Mini Metrics */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Hostel Dues Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Monthly Hostel Fee:</span>
                  <span className="font-bold text-[#101828] dark:text-slate-200 font-mono">
                    PKR {(student.monthlyFee || 10000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Fee Status:</span>
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
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="font-bold text-[#EF4444] font-mono text-sm">
                    PKR{' '}
                    {(
                      relations?.fees?.reduce((acc, f) => acc + (f.remainingAmount || 0), 0) || 0
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={() => setActiveTab('fees')}
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                  >
                    View Invoices
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Attendance Rate
              </h3>
              <div className="text-center py-2">
                <p className="text-3xl font-extrabold text-[#10B981]">
                  {relations?.attendanceStats?.percentage || 100}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {relations?.attendanceStats?.present || 0} of {relations?.attendanceStats?.total || 0} sessions present
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Personal Particulars */}
      {activeTab === 'personal' && (
        <Card>
          <h3 className="text-base font-bold text-[#101828] dark:text-white mb-6">
            Detailed Personal & National Identity Particulars
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Full Legal Name</span>
              <span className="font-bold text-[#101828] dark:text-slate-200 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Father's Name</span>
              <span className="font-bold text-[#101828] dark:text-slate-200 text-sm">{student.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">CNIC Number (Mandatory)</span>
              <span className="font-mono font-bold text-[#2563EB] dark:text-[#06B6D4] text-sm">
                {student.cnic}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Date of Birth</span>
              <span className="font-medium text-[#101828] dark:text-slate-200">
                {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Gender</span>
              <span className="font-medium text-[#101828] dark:text-slate-200">{student.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Blood Group</span>
              <span className="font-bold text-[#EF4444] text-sm">{student.bloodGroup}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Nationality</span>
              <span className="font-medium text-[#101828] dark:text-slate-200">{student.nationality}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Province</span>
              <span className="font-medium text-[#101828] dark:text-slate-200">{student.province}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">City / District</span>
              <span className="font-medium text-[#101828] dark:text-slate-200">{student.city}</span>
            </div>
            <div className="sm:col-span-3">
              <span className="text-slate-400 block mb-1 font-medium">Permanent Residential Address</span>
              <span className="font-medium text-[#101828] dark:text-slate-200 text-sm">{student.address}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Hostel Residency & 3-Floor Structure */}
      {activeTab === 'hostel' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-[#101828] dark:text-white">
              Hostel Residency & Room Assignment
            </h3>
            {hasRole(['superadmin', 'admin', 'warden', 'receptionist']) && (
              <Button onClick={openTransferModal} size="sm" icon={ArrowRightLeft}>
                Change Room
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Assigned Floor</span>
              <span className="font-bold text-[#2563EB] dark:text-[#06B6D4] text-sm">
                Floor {student.floor || student.room?.floor || '1'} (3 Floors System)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Room Number</span>
              <span className="font-bold text-[#101828] dark:text-white text-sm">
                Room {student.room?.roomNumber || 'Not assigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Bed Identifier</span>
              <span className="font-bold text-[#101828] dark:text-slate-200 text-sm">
                {student.bed?.bedNumber || 'Not assigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Admission Number</span>
              <span className="font-mono font-bold text-[#101828] dark:text-slate-200">{student.admissionNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Admission Date</span>
              <span className="font-medium text-[#101828] dark:text-slate-200">
                {new Date(student.admissionDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Hostel Name</span>
              <span className="font-bold text-[#101828] dark:text-white text-sm">
                Royal Hostel Khuzdar
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Monthly Hostel Fee</span>
              <span className="font-bold text-[#101828] dark:text-slate-200 font-mono text-sm">
                PKR {(student.monthlyFee || 10000).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">College / University</span>
              <span className="font-bold text-[#101828] dark:text-slate-200 text-sm">
                {student.institution || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">College Contact Landline</span>
              <span className="font-bold text-[#101828] dark:text-slate-200 font-mono text-sm">
                {student.collegeContact || '+92 848 550123'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Room Transfer History (Requirement 3) */}
      {activeTab === 'transfers' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#101828] dark:text-white">
                Room Movement & Transfer History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit trail of student movements across Floor 1, Floor 2, and Floor 3 rooms.
              </p>
            </div>
            {hasRole(['superadmin', 'admin', 'warden', 'receptionist']) && (
              <Button onClick={openTransferModal} size="sm" icon={ArrowRightLeft}>
                New Room Transfer
              </Button>
            )}
          </div>

          {loadingHistory ? (
            <LoadingSpinner text="Fetching room transfer history..." />
          ) : transferHistory.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No room transfers recorded for this student yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Student is currently in Room {student.room?.roomNumber || '101'} (Floor {student.floor || '1'}).
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {transferHistory.map((item) => (
                <div key={item._id} className="py-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">
                        Room {item.fromRoomNumber || 'Prev'} ({item.fromBedNumber || 'Bed'})
                      </span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 font-mono font-bold text-[#2563EB] dark:text-[#06B6D4]">
                        Floor {item.toFloor} • Room {item.toRoomNumber} ({item.toBedNumber})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.transferredAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-400">Reason:</strong> {item.reason || 'Administrative transfer'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Approved by: <strong className="text-[#101828] dark:text-white">{item.transferredByName}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 5: Fees */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#101828] dark:text-white">Fee Invoices & Payments</h3>
            <Button
              onClick={() => navigate(`/fees?studentId=${student._id}&action=collect`)}
              size="sm"
              icon={Plus}
            >
              Issue Invoice
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Month/Year</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Due</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {relations?.fees?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-400">
                      No invoices issued yet.
                    </td>
                  </tr>
                ) : (
                  relations?.fees?.map((fee) => (
                    <tr key={fee._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold">{fee.invoiceNumber}</td>
                      <td className="py-3 px-4">{fee.month} {fee.year}</td>
                      <td className="py-3 px-4">{fee.feeType}</td>
                      <td className="py-3 px-4 font-semibold font-mono">
                        PKR {fee.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#10B981] font-semibold font-mono">
                        PKR {fee.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[#EF4444] font-semibold font-mono">
                        PKR {fee.remainingAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            fee.status === 'Paid'
                              ? 'success'
                              : fee.status === 'Partial'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {fee.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab 6: Attendance */}
      {activeTab === 'attendance' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#101828] dark:text-white">Recent Attendance Logs</h3>
            <span className="text-xs font-bold text-[#2563EB]">
              Rate: {relations?.attendanceStats?.percentage || 100}%
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.attendance?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No attendance marked yet.</p>
            ) : (
              relations?.attendance?.map((att) => (
                <div key={att._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#101828] dark:text-slate-200">{att.date}</p>
                    {att.remarks && <p className="text-[11px] text-slate-400">{att.remarks}</p>}
                  </div>
                  <Badge variant={att.status === 'Present' ? 'success' : 'danger'}>
                    {att.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 7: Visitors */}
      {activeTab === 'visitors' && (
        <Card>
          <h3 className="text-base font-bold text-[#101828] dark:text-white mb-4">Visitor Log</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.visitors?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No visitor records found.</p>
            ) : (
              relations?.visitors?.map((vis) => (
                <div key={vis._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#101828] dark:text-slate-200">
                      {vis.visitorName} ({vis.relationship})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Purpose: {vis.purpose} • Date: {vis.visitDate}
                    </p>
                  </div>
                  <Badge>{vis.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 8: Complaints */}
      {activeTab === 'complaints' && (
        <Card>
          <h3 className="text-base font-bold text-[#101828] dark:text-white mb-4">Submitted Complaints</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.complaints?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No complaints registered.</p>
            ) : (
              relations?.complaints?.map((cmp) => (
                <div key={cmp._id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#101828] dark:text-white">
                      {cmp.complaintId} • {cmp.category}
                    </span>
                    <Badge>{cmp.status}</Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{cmp.description}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 9: Leaves */}
      {activeTab === 'leaves' && (
        <Card>
          <h3 className="text-base font-bold text-[#101828] dark:text-white mb-4">Leave Requests</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.leaves?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No leave requests found.</p>
            ) : (
              relations?.leaves?.map((leave) => (
                <div key={leave._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#101828] dark:text-slate-200">
                      {leave.leaveType} ({new Date(leave.startDate).toLocaleDateString()} -{' '}
                      {new Date(leave.endDate).toLocaleDateString()})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Reason: {leave.reason} • Destination: {leave.destination}
                    </p>
                  </div>
                  <Badge>{leave.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 10: Documents */}
      {activeTab === 'documents' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#101828] dark:text-white">Uploaded Documents</h3>
            <Button onClick={() => setDocModalOpen(true)} size="sm" icon={Plus}>
              Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {student.documents?.length === 0 ? (
              <p className="col-span-3 py-6 text-center text-slate-400 text-xs">
                No documents uploaded yet.
              </p>
            ) : (
              student.documents?.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#101828] flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-[#2563EB] shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#101828] dark:text-white truncate">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 11: Activity */}
      {activeTab === 'activity' && (
        <Card>
          <h3 className="text-base font-bold text-[#101828] dark:text-white mb-4">
            Audit Trail for this Resident
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.activities?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No activity logged.</p>
            ) : (
              relations?.activities?.map((act) => (
                <div key={act._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#101828] dark:text-slate-200">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">by {act.userName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* ROOM TRANSFER MODAL                                       */}
      {/* ========================================================= */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={`Change Room for ${student.fullName}`}
        subtitle="Move resident to another room or floor with real-time capacity and bed vacancy check."
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
              Verify & Proceed
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Current Room Highlight */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Current Assignment
            </span>
            <div className="flex items-center justify-between font-extrabold text-sm text-[#101828] dark:text-white">
              <span>
                Floor {student.floor || student.room?.floor || '1'} • Room {student.room?.roomNumber || 'N/A'}
              </span>
              <span className="text-xs text-[#2563EB] dark:text-[#06B6D4]">
                {student.bed?.bedNumber || 'Assigned Bed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              CNIC ({student.cnic}), contact, photograph, and billing records will remain intact.
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
                const isCurrent = String(room._id) === String(student.room?._id);
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
      </Modal>

      {/* Confirmation Step Before Transfer Completion */}
      <ConfirmationModal
        isOpen={transferConfirmOpen}
        onClose={() => setTransferConfirmOpen(false)}
        onConfirm={executeTransfer}
        title="Confirm Resident Transfer"
        message={`Are you sure you want to transfer ${student.fullName} to Room ${selectedTransferRoom?.roomNumber} (Floor ${selectedTransferRoom?.floor})? The previous bed will immediately become Available, and a permanent transfer history entry will be recorded.`}
      />

      {/* Document Upload Modal */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Upload Student Document"
        subtitle="Upload CNIC scan, admission form, photograph, or medical certificate."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setDocModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDocumentUpload} loading={uploadingDoc}>
              Upload File
            </Button>
          </>
        }
      >
        <form onSubmit={handleDocumentUpload} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Student CNIC Front/Back"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Select File (PDF, JPEG, PNG)
            </label>
            <input
              type="file"
              required
              onChange={(e) => setDocFile(e.target.files[0])}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentProfile;
