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

  // Load students list
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
    // Open clean print window or prompt PDF save
    window.print();
    success('Card rendering complete. Select "Save as PDF" to download high-resolution card.');
  };

  if (loading) {
    return <LoadingSpinner text="Generating Royal Hostel smart ID cards..." size="lg" />;
  }

  // QR Code link points safely to the public verification endpoint on the current domain
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
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <IdCard className="w-4 h-4" />
            <span>Official Institutional Credential</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Student Hostel Card Generator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Printable and downloadable high-resolution smart hostel passes for Royal Hostel Khuzdar residents.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setBulkMode(!bulkMode)}
            variant={bulkMode ? 'primary' : 'outline'}
            size="sm"
            icon={Users}
          >
            {bulkMode ? 'Single Card View' : 'Bulk Batch Sheet (20 Students)'}
          </Button>

          <Button onClick={handleDownloadCard} variant="secondary" size="sm" icon={Download}>
            Download Card
          </Button>

          <Button onClick={handlePrint} variant="primary" size="sm" icon={Printer}>
            Print Card(s)
          </Button>
        </div>
      </div>

      {/* Selector & Controls Bar (Hidden when printing) */}
      {!bulkMode && (
        <div className="no-print bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Select Resident:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none w-full sm:w-80"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId} • Room {s.room?.roomNumber || '101'})
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
              Flip to {isFlipped ? 'Front View' : 'Back View'}
            </Button>
          </div>
        </div>
      )}

      {/* SINGLE CARD DISPLAY MODE */}
      {!bulkMode && selectedStudent && (
        <div className="flex flex-col items-center justify-center py-6">
          <div ref={cardRef} className="printable-card-wrapper">
            {!isFlipped ? (
              /* FRONT SIDE OF ID CARD (Standard CR80 Credit Card Ratio ~ 85.6mm x 54mm, vertically oriented) */
              <div className="w-[370px] min-h-[570px] rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-teal-500/60 p-6 flex flex-col justify-between relative overflow-hidden select-none">
                {/* Background ambient accents */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-slate-800/30 rounded-full blur-2xl pointer-events-none" />

                {/* Top Header: Logo & Hostel Name */}
                <div className="relative z-10 border-b border-teal-500/30 pb-3 text-center">
                  <div className="flex items-center justify-center space-x-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow ring-2 ring-teal-400/40">
                      RH
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-black tracking-wider uppercase text-white leading-tight">
                        Royal Hostel Khuzdar
                      </h2>
                      <p className="text-[8px] uppercase tracking-widest text-teal-300 font-bold">
                        Khuzdar, Balochistan, Pakistan
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 bg-teal-500/15 rounded-full py-0.5 px-3 inline-block border border-teal-500/30">
                    <span className="text-[9px] uppercase tracking-widest text-teal-300 font-extrabold">
                      Official Resident Smart Pass
                    </span>
                  </div>
                </div>

                {/* Center: Student Picture, Name, and Essential Details */}
                <div className="relative z-10 flex flex-col items-center my-auto py-2">
                  <div className="w-24 h-24 rounded-2xl bg-slate-800 p-1 shadow-xl mb-3 border-2 border-teal-500/60 overflow-hidden">
                    {selectedStudent.profilePhoto ? (
                      <img
                        src={selectedStudent.profilePhoto}
                        alt={selectedStudent.fullName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-teal-600 flex items-center justify-center text-white font-extrabold text-3xl">
                        {selectedStudent.fullName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-black tracking-tight text-white text-center">
                    {selectedStudent.fullName}
                  </h3>
                  <p className="text-xs font-mono font-extrabold text-teal-400 tracking-wider">
                    {selectedStudent.studentId}
                  </p>

                  {/* Detailed Field Grid */}
                  <div className="mt-3 w-full space-y-1.5 text-[11px] bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Father's Name:</span>
                      <strong className="text-white text-right">{selectedStudent.fatherName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">CNIC Number:</span>
                      <strong className="text-teal-300 font-mono text-right">{selectedStudent.cnic}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">College/University:</span>
                      <strong className="text-white text-right truncate max-w-[190px]">
                        {selectedStudent.institution}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">College Contact:</span>
                      <span className="text-slate-200 font-mono text-right">
                        {selectedStudent.collegeContact || '+92 848 550123'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Student Contact:</span>
                      <span className="text-teal-400 font-mono font-bold text-right">
                        {selectedStudent.phone}
                      </span>
                    </div>
                  </div>

                  {/* Room / Bed / Block Grid */}
                  <div className="mt-3 w-full grid grid-cols-3 gap-2 bg-slate-800/80 backdrop-blur-md rounded-2xl p-2 border border-slate-700 text-center">
                    <div>
                      <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 block">
                        Block
                      </span>
                      <span className="text-xs font-black text-white">{selectedStudent.block}</span>
                    </div>
                    <div className="border-x border-slate-700">
                      <span className="text-[8px] uppercase font-bold tracking-wider text-teal-300 block">
                        Room
                      </span>
                      <span className="text-xs font-black text-teal-400">
                        {selectedStudent.room?.roomNumber || '101'}
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

                {/* Bottom Footer: Dates, Emergency Contact & QR Code */}
                <div className="relative z-10 border-t border-teal-500/30 pt-2.5 flex items-center justify-between">
                  <div className="text-left text-[10px] space-y-0.5">
                    <p className="text-slate-400">
                      Admission: <strong className="text-white">{new Date(selectedStudent.admissionDate).toLocaleDateString()}</strong>
                    </p>
                    <p className="text-slate-400">
                      Issue Date: <strong className="text-white">{currentDateStr}</strong>
                    </p>
                    <p className="text-slate-400">
                      Emergency: <strong className="text-slate-200 font-mono">{selectedStudent.emergencyPhone}</strong>
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
              <div className="w-[370px] min-h-[570px] rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-slate-700 p-6 flex flex-col justify-between select-none">
                <div className="border-b border-slate-800 pb-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                      RH
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-teal-400">
                      Royal Hostel Khuzdar
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Resident Terms & Regulations
                  </p>
                </div>

                <div className="space-y-3 text-[11px] text-slate-300 leading-relaxed my-auto">
                  <p className="flex items-start">
                    <span className="text-teal-400 font-bold mr-2">1.</span>
                    This card is non-transferable and must be presented to hostel security upon entry and exit.
                  </p>
                  <p className="flex items-start">
                    <span className="text-teal-400 font-bold mr-2">2.</span>
                    Hostel gate curfew is strictly 10:00 PM. Prior written approval from the Warden is required for late return.
                  </p>
                  <p className="flex items-start">
                    <span className="text-teal-400 font-bold mr-2">3.</span>
                    Unauthorized visitors, alcohol, smoking, weapons, and narcotics are strictly prohibited within the hostel.
                  </p>
                  <p className="flex items-start">
                    <span className="text-teal-400 font-bold mr-2">4.</span>
                    Scanning the QR code validates authorized student residence status via the official portal.
                  </p>
                  <p className="flex items-start">
                    <span className="text-teal-400 font-bold mr-2">5.</span>
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
                  <p className="text-[10px] text-teal-400 font-mono font-bold mt-1">
                    Emergency Contact: +92 333 7891234 / +92 848 412345
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BULK BATCH SHEET PRINTING MODE (All 20 Students) */}
      {bulkMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
          {students.map((stu) => (
            <div
              key={stu._id}
              className="printable-card-wrapper w-[350px] min-h-[540px] mx-auto rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-950 to-black text-white shadow-xl border-4 border-amber-500/60 p-5 flex flex-col justify-between relative overflow-hidden page-break-inside-avoid select-none"
            >
              {/* Header */}
              <div className="text-center border-b border-amber-500/40 pb-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-amber-400 text-indigo-950 font-black flex items-center justify-center text-xs">
                    RH
                  </div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-white truncate">
                    Royal Hostel Khuzdar
                  </h3>
                </div>
                <p className="text-[8px] uppercase tracking-widest text-amber-300 font-bold">
                  Khuzdar, Balochistan
                </p>
              </div>

              {/* Body */}
              <div className="flex flex-col items-center my-auto py-2">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-600 p-0.5 shadow-md mb-2 border border-amber-400/80 overflow-hidden">
                  {stu.profilePhoto ? (
                    <img src={stu.profilePhoto} alt={stu.fullName} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-slate-900 flex items-center justify-center font-bold text-xl">
                      {stu.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-black text-white text-center">{stu.fullName}</h4>
                <p className="text-[10px] font-mono font-bold text-amber-400">{stu.studentId}</p>

                <div className="mt-2 w-full space-y-1 text-[9px] bg-slate-900/80 rounded-xl p-2 border border-indigo-900/40">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Father:</span>
                    <strong className="text-white">{stu.fatherName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CNIC:</span>
                    <strong className="text-amber-300 font-mono">{stu.cnic}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">College:</span>
                    <strong className="text-white truncate max-w-[160px]">{stu.institution}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-emerald-400 font-mono font-bold">{stu.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Room:</span>
                    <strong className="text-amber-300">
                      Room {stu.room?.roomNumber || '101'} ({stu.bed?.bedNumber || 'Bed A'})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-amber-500/40 pt-2 flex items-center justify-between">
                <div className="text-[8px] text-slate-400">
                  <p>Admission: {new Date(stu.admissionDate).toLocaleDateString()}</p>
                  <p>Emergency: <strong className="text-rose-400 font-mono">{stu.emergencyPhone}</strong></p>
                </div>
                <div className="p-1 bg-white rounded-lg">
                  <QRCodeSVG value={getVerificationUrl(stu)} size={40} level="M" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCardGenerator;
