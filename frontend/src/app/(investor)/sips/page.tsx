'use client';

import { useQuery } from '@tanstack/react-query';
import { sipAPI } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { RefreshCw, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function SIPPage() {
  // Fetch all SIPs
  const { data: sips = [], isLoading } = useQuery({
    queryKey: ['sips-all'],
    queryFn: async () => {
      const { data } = await sipAPI.getAll();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200/50 w-1/4 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-slate-200/50 rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const failedSIPs = sips.filter((s: any) => s.status === 'failed');
  const activeSIPs = sips.filter((s: any) => s.status !== 'failed');

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-primary -top-10 -right-20 opacity-20"></div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-wide text-slate-800">SIP Schedules</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">Manage your recurring mutual fund investments and bank auto-debit mandates.</p>
      </div>

      {/* Failed SIP Warnings */}
      {failedSIPs.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 animate-bounce" />
            <span>Action Required: Failed SIPs ({failedSIPs.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {failedSIPs.map((s: any) => (
              <div key={s.sip_id} className="p-6 rounded-2xl border border-rose-100 bg-rose-50/20 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-relaxed">{s.fund.fund_name}</h4>
                    <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1 block">SIP ID: {s.sip_id}</span>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md badge-failed shrink-0 uppercase tracking-wider">
                    {s.status}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-100/60 text-xs">
                  <p className="font-bold text-rose-700">Failure Reason from Bank:</p>
                  <p className="text-rose-600/90 mt-1 leading-relaxed font-medium">{s.mandate?.failure_reason || 'Mandate registration failed'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Bank Partner</p>
                    <p className="font-bold text-slate-800 mt-0.5">{s.mandate?.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Account Number</p>
                    <p className="font-bold text-slate-800 mt-0.5">{s.mandate?.account_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-2 border-t border-rose-100 pt-4">
                  <Link
                    href="/chat"
                    className="flex-1 text-center py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 text-xs font-bold uppercase tracking-wider border border-rose-500/20 transition-all duration-200"
                  >
                    Resolve in Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active SIPs list */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Active Schedules ({activeSIPs.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeSIPs.length === 0 ? (
            <div className="col-span-2 glass-card bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium shadow-sm">
              No active SIP investments registered.
            </div>
          ) : (
            activeSIPs.map((s: any) => (
              <div key={s.sip_id} className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-relaxed">{s.fund.fund_name}</h4>
                    <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1 block">SIP ID: {s.sip_id}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getStatusColor(s.status)}`}>
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-y border-slate-100 py-4 my-1 font-semibold text-slate-700">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Installment</p>
                    <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(s.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Frequency</p>
                    <p className="font-bold text-slate-800 mt-0.5 uppercase tracking-wider">{s.frequency}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Cycle Date</p>
                    <p className="font-bold text-slate-800 mt-0.5">Day {s.sip_date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Completed</p>
                    <p className="font-bold text-slate-800 mt-0.5">{s.completed_installments} / {s.total_installments || '∞'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Next Auto-debit</p>
                    <p className="font-bold text-slate-800 mt-0.5">{formatDate(s.next_due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Mandate Status</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{s.mandate?.status || 'Active'}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
