import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useHostel } from '../../context/HostelContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import {
  ShieldCheck,
  Building,
  BedDouble,
  Phone,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

const VerifyStudent = () => {
  const { identifier } = useParams();
  const { settings } = useHostel();

  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/students/verify/${identifier}`);
        setVerification(res.data.data);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Invalid or expired student verification identifier.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [identifier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <LoadingSpinner text="Verifying student authentication records..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Verification Result Card */}
        {verification ? (
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            {/* Verified Header Badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4 ring-8 ring-emerald-500/10">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              Official Verification
            </h1>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              Authorized Resident • Verified Record
            </p>

            {/* Student Particulars */}
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                {verification.fullName.charAt(0)}
              </div>

              <div>
                <h2 className="text-lg font-black text-white">{verification.fullName}</h2>
                <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                  ID: {verification.studentId}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {verification.degree} • {verification.institution}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                <Badge variant={verification.status === 'Active' ? 'success' : 'danger'} size="lg">
                  {verification.status} Resident
                </Badge>
              </div>

              {/* Hostel Details Box */}
              <div className="bg-slate-800/80 rounded-2xl p-4 text-left border border-slate-700/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hostel Entity:</span>
                  <span className="font-bold text-white">{settings.hostelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allocated Room:</span>
                  <span className="font-bold text-indigo-400">
                    {verification.block} • Room {verification.roomNumber} ({verification.bedNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session Validity:</span>
                  <span className="font-bold text-white">Active Academic Session</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <span className="font-mono font-bold text-emerald-400">{verification.emergencyPhone}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 flex items-center justify-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Verified live at {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Verification Failed */
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white">Verification Failed</h2>
            <p className="text-xs text-rose-400 mt-2">{errorMsg}</p>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              This identification code could not be verified in the hostel directory. Please contact the administration office.
            </p>
          </div>
        )}

        {/* Back to Portal */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center"
          >
            Access Staff Portal <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyStudent;
