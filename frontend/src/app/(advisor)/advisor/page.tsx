'use client';

import { useQuery } from '@tanstack/react-query';
import { ticketAPI } from '@/lib/api';
import { formatDate, getStatusColor, formatCategory } from '@/lib/utils';
import { ArrowRight, Inbox } from 'lucide-react';
import Link from 'next/link';

export default function AdvisorDashboardPage() {
  // Fetch tickets queue
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['advisor-queue'],
    queryFn: async () => {
      const { data } = await ticketAPI.getQueue();
      return data;
    },
    refetchInterval: 10000,
  });

  const openTickets = queue.filter((t: any) => t.status === 'open');
  const inProgressTickets = queue.filter((t: any) => t.status === 'in_progress');

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200/50 w-1/4 rounded-xl" />
        <div className="h-64 bg-slate-200/50 rounded-2xl border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-primary -top-10 -right-20 opacity-20"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-slate-800">Support Escalation Queue</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Review and resolve service requests escalated by AURA conversational engine.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 z-10">
        <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-2 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Queue Size</span>
          <p className="text-2xl font-black text-slate-800">{queue.length} Tickets</p>
        </div>

        <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-2 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open & Unassigned</span>
          <p className="text-2xl font-black text-indigo-600">{openTickets.length} Tickets</p>
        </div>

        <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-2 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
          <p className="text-2xl font-black text-amber-600">{inProgressTickets.length} Tickets</p>
        </div>
      </div>

      {/* Queue list table */}
      <div className="glass-card bg-white rounded-2xl overflow-hidden border border-slate-100 z-10 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-indigo-500" />
            <span>Escalation Queue Feed</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Ticket Reference</th>
                <th className="px-6 py-4">Investor</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No active support requests in the queue.
                  </td>
                </tr>
              ) : (
                queue.map((t: any) => (
                  <tr key={t.ticket_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 tracking-wide">{t.ticket_id}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{t.investor_name}</td>
                    <td className="px-6 py-4 uppercase text-[10px] tracking-wide text-indigo-600 font-bold">{formatCategory(t.category)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 truncate max-w-xs">{t.subject}</td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded-md ${
                        t.priority === 'high' || t.priority === 'critical' ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100'
                      }`}>
                        {t.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-semibold">{formatDate(t.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/tickets/${t.ticket_id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider transition-colors"
                      >
                        <span>Resolve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
