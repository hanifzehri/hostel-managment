import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/client';
import { useHostel } from '../../context/HostelContext';
import { useToast } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import HostelLogo from '../../components/ui/HostelLogo';
import {
  Printer,
  Download,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Building,
  Phone,
  QrCode,
  Users,
  CheckCircle2,
  Calendar,
  IdCard,
} from 'lucide-react';

const StudentCardGenerator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useHostel();
  const { success, error } = useToast();

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  const cardRef = useRef(null);

  // Load students list (all active hostel residents)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await api.get('/students?limit=50&status=Active');
        const list = res.data.data || [];
        setStudents(list);

        const currentId = searchParams.get('studentId') || (list[0] ? list[0]._id : '');
        setSelectedStudentId(currentId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [searchParams]);

  // Find active selected student
  useEffect(() => {
    if (selectedStudentId && students.length > 0) {
      const match = students.find((s) => s._id === selectedStudentId);
      if (match) setSelectedStudent(match);
    }
  }, [selectedStudentId, students]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCard = () => {
    window.print();
    success('Card rendering ready. Select "Save as PDF" to download high-resolution card.');
  };

  if (loading) {
    return <LoadingSpinner text="Generating Royal Hostel resident smart ID cards..." size="lg" />;
  }

  const getVerificationUrl = (stu) => {
    const origin = window.location.origin;
    return `${origin}/verify/${stu?.verificationToken || stu?.studentId}`;
  };

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#1D2939] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#2563EB] dark:text-[#06B6D4] text-xs font-bold uppercase tracking-wider mb-1">
            <IdCard className="w-4 h-4" />
            <span>Official Hostel Resident Credential</span>
          </div>
          <h1 className="text-2xl font-black text-[#101828] dark:text-white tracking-tight">
            Student Smart ID Card Generator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            High-resolution smart residency cards with photograph, mandatory CNIC, contact, 3-floor room allocation, and QR verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setBulkMode(!bulkMode)}
            variant={bulkMode ? 'primary' : 'outline'}
            size="sm"
            icon={Users}
          >
            {bulkMode ? 'Single Card View' : `All Residents Sheet (${students.length})`}
          </Button>

          <Button onClick={handleDownloadCard} variant="secondary" size="sm" icon={Download}>
            Download PDF
          </Button>

          <Button onClick={handlePrint} variant="primary" size="sm" icon={Printer}>
            Print Card(s)
          </Button>
        </div>
      </div>

      {/* Selector & Controls Bar (Hidden when printing) */}
      {!bulkMode && (
        <div className="no-print bg-white dark:bg-[#1D2939] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Select Resident:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-[#F8FAFC] dark:bg-[#101828] border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-[#101828] dark:text-white outline-none w-full sm:w-96"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId} • Floor {s.floor || s.room?.floor || '1'} • Room {s.room?.roomNumber || '101'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsFlipped(!isFlipped)}
              variant="secondary"
              size="sm"
              icon={RotateCw}
            >
              Flip to {isFlipped ? 'Front View' : 'Back (Rules)'}
            </Button>
          </div>
        </div>
      )}

      {/* SINGLE CARD DISPLAY MODE */}
      {!bulkMode && selectedStudent && (
        <div className="flex flex-col items-center justify-center py-6">
          <div ref={cardRef} className="printable-card-wrapper">
            {!isFlipped ? (
              /* FRONT SIDE OF ID CARD (Standard CR80 Ratio vertically oriented: 370px x 590px) */
              <div className="w-[370px] min-h-[590px] rounded-3xl bg-[#101828] text-white shadow-2xl border-2 border-[#2563EB]/80 p-6 flex flex-col justify-between relative overflow-hidden select-none">
                {/* Background ambient accents */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#06B6D4]/15 rounded-full blur-3xl pointer-events-none" />

                {/* Top Header: Logo & Hostel Name */}
                <div className="relative z-10 border-b border-[#2563EB]/30 pb-3 text-center">
                  <div className="flex items-center justify-center space-x-2.5 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white font-black flex items-center justify-center text-sm shadow ring-2 ring-[#06B6D4]/60">
                      RH
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-black tracking-wider uppercase text-white leading-tight">
                        Royal Hostel Khuzdar
                      </h2>
                      <p className="text-[8px] uppercase tracking-widest text-[#06B6D4] font-bold">
                        Khuzdar, Balochistan, Pakistan
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 bg-[#2563EB]/20 rounded-full py-0.5 px-3 inline-block border border-[#2563EB]/40">
                    <span className="text-[9px] uppercase tracking-widest text-[#06B6D4] font-extrabold">
                      Official Resident Smart Pass
                    </span>
                  </div>
                </div>

                {/* Center: Student Picture, Name, and Essential Details */}
                <div className="relative z-10 flex flex-col items-center my-auto py-2">
                  <div className="w-24 h-24 rounded-2xl bg-[#1D2939] p-1 shadow-xl mb-2.5 border-2 border-[#2563EB] overflow-hidden">
                    {selectedStudent.profilePhoto || selectedStudent.profilePicture ? (
                      <img
                        src={selectedStudent.profilePhoto || selectedStudent.profilePicture}
                        alt={selectedStudent.fullName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-extrabold text-3xl">
                        {selectedStudent.fullName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-black tracking-tight text-white text-center">
                    {selectedStudent.fullName}
                  </h3>
                  <p className="text-xs font-mono font-extrabold text-[#06B6D4] tracking-wider">
                    {selectedStudent.studentId}
                  </p>

                  {/* Detailed Field Grid */}
                  <div className="mt-2.5 w-full space-y-1.5 text-[11px] bg-[#1D2939]/90 rounded-2xl p-3 border border-slate-700/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Father's Name:</span>
                      <strong className="text-white text-right">{selectedStudent.fatherName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">CNIC Number:</span>
                      <strong className="text-[#06B6D4] font-mono text-right">{selectedStudent.cnic}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Contact Number:</span>
                      <span className="text-white font-mono font-bold text-right">{selectedStudent.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">College/University:</span>
                      <strong className="text-white text-right truncate max-w-[190px]">
                        {selectedStudent.institution}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Monthly Fee:</span>
                      <span className="text-[#10B981] font-mono font-bold text-right">
                        PKR {(selectedStudent.monthlyFee || 10000).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Floor / Room / Bed Allocation Grid */}
                  <div className="mt-2.5 w-full grid grid-cols-3 gap-2 bg-[#1D2939]/90 rounded-2xl p-2 border border-slate-700 text-center">
                    <div>
                      <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 block">
                        Floor
                      </span>
                      <span className="text-xs font-black text-white">
                        Floor {selectedStudent.floor || selectedStudent.room?.floor || '1'}
                      </span>
                    </div>
                    <div className="border-x border-slate-700">
                      <span className="text-[8px] uppercase font-bold tracking-wider text-[#06B6D4] block">
                        Room
                      </span>
                      <span className="text-xs font-black text-[#06B6D4]">
                        Room {selectedStudent.room?.roomNumber || '101'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 block">
                        Bed
                      </span>
                      <span className="text-xs font-black text-white">
                        {selectedStudent.bed?.bedNumber || 'Bed A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer: Dates, Emergency & QR Code */}
                <div className="relative z-10 border-t border-[#2563EB]/30 pt-2.5 flex items-center justify-between">
                  <div className="text-left text-[10px] space-y-0.5">
                    <p className="text-slate-400">
                      Admission: <strong className="text-white">{new Date(selectedStudent.admissionDate).toLocaleDateString()}</strong>
                    </p>
                    <p className="text-slate-400">
                      Issue Date: <strong className="text-white">{currentDateStr}</strong>
                    </p>
                    <p className="text-slate-400">
                      Emergency: <strong className="text-slate-200 font-mono">{selectedStudent.emergencyPhone || '+92 848 550123'}</strong>
                    </p>
                  </div>

                  {/* Verification QR Code */}
                  <div className="p-1 bg-white rounded-xl shadow-lg shrink-0">
                    <QRCodeSVG
                      value={getVerificationUrl(selectedStudent)}
                      size={52}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* BACK SIDE OF ID CARD */
              <div className="w-[370px] min-h-[590px] rounded-3xl bg-[#101828] text-white shadow-2xl border-2 border-slate-700 p-6 flex flex-col justify-between select-none">
                <div className="border-b border-slate-800 pb-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-[#2563EB] text-white font-bold flex items-center justify-center text-xs">
                      RH
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#06B6D4]">
                      Royal Hostel Khuzdar
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Resident Regulations & Security Guidelines
                  </p>
                </div>

                <div className="space-y-3 text-[11px] text-slate-300 leading-relaxed my-auto">
                  <p className="flex items-start">
                    <span className="text-[#06B6D4] font-bold mr-2">1.</span>
                    This card is non-transferable and must be presented to hostel reception/security upon entry and exit.
                  </p>
                  <p className="flex items-start">
                    <span className="text-[#06B6D4] font-bold mr-2">2.</span>
                    Hostel gate curfew is strictly 10:00 PM. Prior written approval from the Warden is required for late return.
                  </p>
                  <p className="flex items-start">
                    <span className="text-[#06B6D4] font-bold mr-2">3.</span>
                    Room movements are only permitted through official hostel manager authorization.
                  </p>
                  <p className="flex items-start">
                    <span className="text-[#06B6D4] font-bold mr-2">4.</span>
                    Scanning the QR code validates authorized student residence status via the official portal.
                  </p>
                  <p className="flex items-start">
                    <span className="text-[#06B6D4] font-bold mr-2">5.</span>
                    Monthly hostel fee is payable by the 10th of every calendar month.
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3 text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    If found, please return to:
                  </p>
                  <p className="text-xs font-black text-white">Royal Hostel Khuzdar</p>
                  <p className="text-[10px] text-slate-400">
                    College Road, Khuzdar, Balochistan, Pakistan
                  </p>
                  <p className="text-[10px] text-[#06B6D4] font-mono font-bold mt-1">
                    Emergency: +92 333 7891234 / +92 848 412345
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BULK BATCH SHEET PRINTING MODE */}
      {bulkMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
          {students.map((stu) => {
            const photo = stu.profilePhoto || stu.profilePicture;
            return (
              <div
                key={stu._id}
                className="printable-card-wrapper w-[350px] min-h-[550px] mx-auto rounded-3xl bg-[#101828] text-white shadow-xl border-2 border-[#2563EB] p-5 flex flex-col justify-between relative overflow-hidden page-break-inside-avoid select-none"
              >
                {/* Header */}
                <div className="text-center border-b border-[#2563EB]/40 pb-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-[#2563EB] text-white font-black flex items-center justify-center text-xs">
                      RH
                    </div>
                    <h3 className="text-xs font-black tracking-wider uppercase text-white truncate">
                      Royal Hostel Khuzdar
                    </h3>
                  </div>
                  <p className="text-[8px] uppercase tracking-widest text-[#06B6D4] font-bold">
                    Khuzdar, Balochistan
                  </p>
                </div>

                {/* Body */}
                <div className="flex flex-col items-center my-auto py-2">
                  <div className="w-16 h-16 rounded-xl bg-[#1D2939] p-0.5 shadow-md mb-2 border border-[#2563EB] overflow-hidden">
                    {photo ? (
                      <img src={photo} alt={stu.fullName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-[#2563EB] flex items-center justify-center font-bold text-xl text-white">
                        {stu.fullName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-white text-center">{stu.fullName}</h4>
                  <p className="text-[10px] font-mono font-bold text-[#06B6D4]">{stu.studentId}</p>

                  <div className="mt-2 w-full space-y-1 text-[9px] bg-[#1D2939] rounded-xl p-2 border border-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Father:</span>
                      <strong className="text-white">{stu.fatherName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CNIC:</span>
                      <strong className="text-[#06B6D4] font-mono">{stu.cnic}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-white font-mono font-bold">{stu.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">College:</span>
                      <strong className="text-white truncate max-w-[160px]">{stu.institution}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Floor & Room:</span>
                      <strong className="text-[#10B981]">
                        Floor {stu.floor || stu.room?.floor || '1'} • Room {stu.room?.roomNumber || '101'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#2563EB]/40 pt-2 flex items-center justify-between">
                  <div className="text-[8px] text-slate-400">
                    <p>Admission: {new Date(stu.admissionDate).toLocaleDateString()}</p>
                    <p>Fee: <strong className="text-white font-mono">PKR {(stu.monthlyFee || 10000).toLocaleString()}</strong></p>
                  </div>
                  <div className="p-1 bg-white rounded-lg">
                    <QRCodeSVG value={getVerificationUrl(stu)} size={38} level="M" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCardGenerator;
