'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycAPI } from '@/lib/api';
import { getStatusColor, formatDate } from '@/lib/utils';
import { CheckCircle2, AlertCircle, ShieldAlert, Sparkles, User, FileText, ArrowRight } from 'lucide-react';

export default function KYCPage() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch KYC status
  const { data: kyc, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: async () => {
      const { data } = await kycAPI.getStatus();
      return data;
    },
  });

  const reverifyMutation = useMutation({
    mutationFn: async (data: { full_name: string; dob: string; pan_number: string; aadhaar_number: string }) => {
      setSuccessMsg(null);
      setErrorMsg(null);
      const res = await kycAPI.requestReVerification(data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      setSuccessMsg(data.message || 'Verification request submitted successfully. Support team will verify.');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.detail || 'Failed to submit KYC update request.');
    },
  });

  if (isLoading || !kyc) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-800/40 w-1/4 rounded-xl" />
        <div className="h-64 bg-slate-800/40 rounded-2xl border border-white/5" />
      </div>
    );
  }

  const checklistItems = [
    { label: 'PAN Card Validation', verified: kyc.pan_verified, details: 'Permanent Account Number linkage verification' },
    { label: 'Aadhaar Card Linkage', verified: kyc.aadhaar_verified, details: '12-digit UIDAI identity and OTP validation' },
    { label: 'Registered Address Check', verified: kyc.address_verified, details: 'Physical residency and proof records mapping' },
    { label: 'Investor Identity Photo Match', verified: kyc.photo_verified, details: 'Live webcam verification matching PAN database' }
  ];

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-secondary top-20 -left-10 opacity-20"></div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-wide text-white">KYC Verification</h1>
        <p className="text-sm text-slate-400 font-medium">Verify your identity status (Know Your Customer) as per SEBI regulations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start z-10">
        {/* Status & Checklist */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Status card */}
          <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-3 rounded-xl flex items-center justify-center border border-indigo-500/10">
                {kyc.kyc_status === 'verified' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KYC Status</p>
                <h2 className="text-xl font-black text-white uppercase tracking-wide mt-0.5">
                  {kyc.kyc_status}
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verification Model</p>
              <p className="text-xs font-semibold text-white mt-0.5">{kyc.kyc_type?.toUpperCase() || 'NOT ATTACHED'}</p>
              {kyc.verification_date && (
                <p className="text-[10px] text-slate-500 mt-1">Verified: {formatDate(kyc.verification_date)}</p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-3">Checklist Verification Status</h3>
            
            <div className="flex flex-col gap-3">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/30 border border-white/5 flex items-center justify-between gap-4">
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white tracking-wide">{item.label}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.details}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    item.verified 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {item.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Update Request Form (if KYC pending or needs re-verification) */}
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Request Re-Verification</h3>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              reverifyMutation.mutate({
                full_name: fullName,
                dob: dob,
                pan_number: pan,
                aadhaar_number: aadhaar
              });
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name (as in PAN)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">PAN Card Number</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="Enter 10-char PAN"
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium uppercase tracking-widest placeholder:tracking-normal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Aadhaar Card Number</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Enter 12-digit Aadhaar"
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium tracking-widest placeholder:tracking-normal"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={reverifyMutation.isPending}
              className="w-full mt-2 bg-gradient-indigo py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <span>{reverifyMutation.isPending ? 'Submitting...' : 'Request Update'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
