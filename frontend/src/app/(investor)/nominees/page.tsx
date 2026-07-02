'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nomineeAPI } from '@/lib/api';
import { getStatusColor, formatDate } from '@/lib/utils';
import { Users, UserPlus, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function NomineesPage() {
  const queryClient = useQueryClient();
  const [nomineeName, setNomineeName] = useState('');
  const [relationship, setRelationship] = useState('Spouse');
  const [dob, setDob] = useState('1990-01-01');
  const [allocation, setAllocation] = useState(100);
  const [guardianName, setGuardianName] = useState('');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch nominees
  const { data: nominees = [], isLoading } = useQuery({
    queryKey: ['nominees'],
    queryFn: async () => {
      const { data } = await nomineeAPI.getAll();
      return data;
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (data: { nominee_name: string; relationship: string; date_of_birth: string; allocation_pct: number; guardian_name?: string }) => {
      setSuccessMsg(null);
      setErrorMsg(null);
      const res = await nomineeAPI.requestUpdate(data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nominees'] });
      setSuccessMsg(data.message || 'Nominee change ticket generated successfully.');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.detail || 'Failed to submit nominee request.');
    },
  });

  const isMinor = () => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 18;
  };

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-primary -top-10 -right-20 opacity-20"></div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-wide text-white">Nominees Management</h1>
        <p className="text-sm text-slate-400 font-medium">Add, update or view nominee beneficiary distributions registered to your mutual fund holdings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start z-10">
        
        {/* Nominees list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Registered Beneficiaries</span>
          </h3>

          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading nominees...</div>
            ) : nominees.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
                No nominees registered on your account yet. Use the panel on the right to request addition.
              </div>
            ) : (
              nominees.map((n: any) => (
                <div key={n.id} className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-indigo-500/10 p-3 rounded-xl flex items-center justify-center border border-indigo-500/10">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-relaxed">{n.nominee_name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
                        Relationship: {n.relationship} {n.is_minor ? '(Minor)' : ''}
                      </p>
                      {n.date_of_birth && (
                        <p className="text-[10px] text-slate-500 mt-1">DOB: {formatDate(n.date_of_birth)}</p>
                      )}
                      {n.is_minor && n.guardian_name && (
                        <p className="text-[10px] text-indigo-400 mt-1">Guardian: {n.guardian_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Share Allocation</p>
                      <p className="text-lg font-black text-white mt-0.5">{n.allocation_pct}%</p>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md mt-1 ${getStatusColor(n.status)}`}>
                      {n.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Change Request Form */}
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Register Nominee</h3>
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
              requestMutation.mutate({
                nominee_name: nomineeName,
                relationship: relationship,
                date_of_birth: dob,
                allocation_pct: allocation,
                guardian_name: isMinor() ? guardianName : undefined
              });
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Nominee Name</label>
              <input
                type="text"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
              >
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Sibling">Sibling</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Share %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={allocation}
                  onChange={(e) => setAllocation(parseInt(e.target.value))}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  required
                />
              </div>
            </div>

            {isMinor() && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Guardian Name (Required for Minor)</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Enter guardian full name"
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={requestMutation.isPending}
              className="w-full mt-2 bg-gradient-indigo py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <span>{requestMutation.isPending ? 'Submitting...' : 'Register Nominee'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
