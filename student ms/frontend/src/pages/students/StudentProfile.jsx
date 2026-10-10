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
    } catch (err) {
      console.error(err);
      error('Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

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
    { id: 'personal', label: 'Personal', icon: Heart },
    { id: 'hostel', label: 'Hostel Info', icon: Building },
    { id: 'fees', label: `Fees (${relations?.fees?.length || 0})`, icon: CreditCard },
    { id: 'attendance', label: `Attendance (${relations?.attendanceStats?.percentage || 0}%)`, icon: CalendarCheck },
    { id: 'visitors', label: `Visitors (${relations?.visitors?.length || 0})`, icon: UserCheck },
    { id: 'complaints', label: `Complaints (${relations?.complaints?.length || 0})`, icon: MessageSquareWarning },
    { id: 'leaves', label: `Leave (${relations?.leaves?.length || 0})`, icon: FileText },
    { id: 'documents', label: `Documents (${student.documents?.length || 0})`, icon: FileUp },
    { id: 'activity', label: 'Activity Trail', icon: Activity },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Back Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/students')}
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Students
        </button>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigate(`/id-cards?studentId=${student._id}`)}
            variant="primary"
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
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            {student.profilePicture ? (
              <img
                src={student.profilePicture}
                alt={student.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-200/60 dark:border-slate-700 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-teal-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm shrink-0">
                {student.fullName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {student.fullName}
                </h1>
                <Badge>{student.studentStatus}</Badge>
              </div>
              <p className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 mt-1">
                ID: {student.studentId} • Admission: {student.admissionNumber}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {student.degree} • {student.institution}
              </p>
            </div>
          </div>

          {/* Quick Room & Bed Highlight */}
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
            <BedDouble className="w-8 h-8 text-teal-600 dark:text-teal-400 shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hostel Allocation</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {student.block} • Room {student.room?.roomNumber || 'N/A'}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {student.bed?.bedNumber || 'No Bed Assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
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
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">CNIC / B-Form</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{student.cnic}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Blood Group</span>
                  <span className="font-bold text-rose-600">{student.bloodGroup}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Permanent Address</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {student.address}, {student.city}, {student.province}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Emergency Guardian Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Guardian Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.emergencyContactName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Relationship</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.relationship}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Emergency Phone</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">{student.emergencyPhone}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Mini Metrics */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Hostel Dues Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Invoices Billed:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {relations?.fees?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Outstanding Balance:</span>
                  <span className="font-bold text-rose-600 font-mono text-sm">
                    {settings.currency}{' '}
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Attendance Rate</h3>
              <div className="text-center py-2">
                <p className="text-3xl font-extrabold text-emerald-600">
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

      {/* Tab 2: Personal */}
      {activeTab === 'personal' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Detailed Personal Particulars</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Full Legal Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Father's Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">National ID (CNIC / B-Form)</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{student.cnic}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Date of Birth</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Gender</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{student.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Blood Group</span>
              <span className="font-bold text-rose-600 text-sm">{student.bloodGroup}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Nationality</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{student.nationality}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Province</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{student.province}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">City</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{student.city}</span>
            </div>
            <div className="sm:col-span-3">
              <span className="text-slate-400 block mb-1">Permanent Residential Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{student.address}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Hostel Information */}
      {activeTab === 'hostel' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Hostel Residency Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Hostel Block</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.block}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Room Number</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                Room {student.room?.roomNumber || 'Not assigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Bed Identifier</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {student.bed?.bedNumber || 'Not assigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Admission Number</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.admissionNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Admission Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {new Date(student.admissionDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Check-In Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student.checkInDate ? new Date(student.checkInDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Floor</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{student.floor || '1'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Room Type</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student.room?.roomType || 'Standard'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Hostel Name</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                Royal Hostel Khuzdar
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Monthly Hostel Fee</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {settings.currency} {(student.monthlyFee || student.room?.monthlyFee || 10000).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">College / University</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {student.institution || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">College Contact Number</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {student.collegeContact || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Fee Status</span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                student.feeStatus === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : student.feeStatus === 'Partial'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}>
                {student.feeStatus || 'Paid'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Latest Payment Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student.paymentDate ? new Date(student.paymentDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="sm:col-span-3">
              <span className="text-slate-400 block mb-1">Hostel Administrative Notes</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {student.notes || 'Good academic standing.'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Fees */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Fee Invoices & Payments</h3>
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
                      <td className="py-3 px-4">
                        {fee.month} {fee.year}
                      </td>
                      <td className="py-3 px-4">{fee.feeType}</td>
                      <td className="py-3 px-4 font-semibold">
                        {settings.currency} {fee.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">
                        {settings.currency} {fee.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">
                        {settings.currency} {fee.remainingAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge>{fee.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab 5: Attendance */}
      {activeTab === 'attendance' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Attendance Logs</h3>
            <span className="text-xs font-bold text-indigo-600">
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
                    <p className="font-bold text-slate-800 dark:text-slate-200">{att.date}</p>
                    {att.remarks && <p className="text-[11px] text-slate-400">{att.remarks}</p>}
                  </div>
                  <Badge>{att.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 6: Visitors */}
      {activeTab === 'visitors' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Visitor Log</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.visitors?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No visitor records found.</p>
            ) : (
              relations?.visitors?.map((vis) => (
                <div key={vis._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
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

      {/* Tab 7: Complaints */}
      {activeTab === 'complaints' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Submitted Complaints</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.complaints?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No complaints registered.</p>
            ) : (
              relations?.complaints?.map((cmp) => (
                <div key={cmp._id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {cmp.complaintId} • {cmp.category}
                    </span>
                    <Badge>{cmp.status}</Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{cmp.description}</p>
                  {cmp.resolution && (
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      Resolution: {cmp.resolution}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 8: Leaves */}
      {activeTab === 'leaves' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Leave Requests</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.leaves?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No leave requests found.</p>
            ) : (
              relations?.leaves?.map((leave) => (
                <div key={leave._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
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

      {/* Tab 9: Documents */}
      {activeTab === 'documents' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Uploaded Documents</h3>
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
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
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
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 10: Activity */}
      {activeTab === 'activity' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Audit Trail for this Resident</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {relations?.activities?.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No activity logged.</p>
            ) : (
              relations?.activities?.map((act) => (
                <div key={act._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
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
