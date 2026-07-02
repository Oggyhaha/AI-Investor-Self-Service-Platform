'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketAPI } from '@/lib/api';
import { formatDate, getStatusColor, formatCategory } from '@/lib/utils';
import { Ticket, ChevronDown, ChevronUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function TicketsPage() {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data } = await ticketAPI.getAll();
      return data;
    },
    refetchInterval: 10000,
  });

  // Fetch single ticket details (notes) when expanded
  const { data: activeTicketDetails } = useQuery({
    queryKey: ['ticket-detail', expandedTicketId],
    queryFn: async () => {
      const { data } = await ticketAPI.getById(expandedTicketId!);
      return data;
    },
    enabled: !!expandedTicketId,
  });

  const toggleExpand = (ticketId: string) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
    } else {
      setExpandedTicketId(ticketId);
    }
  };

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-primary -top-10 -right-20 opacity-20"></div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-wide text-white">Service Tickets</h1>
        <p className="text-sm text-slate-400 font-medium">Track resolution progress on your KYC re-verifications, nominee additions, or billing inquiries.</p>
      </div>

      {/* Tickets List */}
      <div className="flex flex-col gap-4 z-10">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading service tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
            No service tickets registered. Issues escalated during Chat with AURA will show up here.
          </div>
        ) : (
          tickets.map((t: any) => {
            const isExpanded = expandedTicketId === t.ticket_id;
            return (
              <div key={t.ticket_id} className="glass-card rounded-2xl overflow-hidden">
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(t.ticket_id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/10 shrink-0">
                      <Ticket className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.subject}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        ID: {t.ticket_id} | Category: {formatCategory(t.category)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-auto sm:ml-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Submitted</p>
                      <p className="text-[10px] text-slate-300 font-semibold mt-0.5">{formatDate(t.created_at)}</p>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-slate-900/10 text-xs flex flex-col gap-4">
                    {activeTicketDetails ? (
                      <>
                        {/* Description */}
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Ticket Description</p>
                          <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-slate-300 whitespace-pre-line leading-relaxed">
                            {activeTicketDetails.description || 'No description provided.'}
                          </div>
                        </div>

                        {/* AI Summary */}
                        {activeTicketDetails.ai_summary && (
                          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-200">
                            <p className="text-[9px] text-indigo-400 uppercase font-bold tracking-wider mb-1">AI Generated Summary</p>
                            <p className="leading-relaxed">{activeTicketDetails.ai_summary}</p>
                          </div>
                        )}

                        {/* Resolution details */}
                        {activeTicketDetails.resolution && (
                          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-200">
                            <p className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider mb-1">Official Resolution</p>
                            <p className="leading-relaxed">{activeTicketDetails.resolution}</p>
                            {activeTicketDetails.resolved_at && (
                              <span className="block text-[9px] text-slate-500 mt-2">Resolved on: {formatDate(activeTicketDetails.resolved_at)}</span>
                            )}
                          </div>
                        )}

                        {/* Notes / Conversation Log */}
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-2">Advisor Notes ({activeTicketDetails.notes.length})</p>
                          <div className="flex flex-col gap-2">
                            {activeTicketDetails.notes.length === 0 ? (
                              <p className="text-slate-500 italic text-[11px] py-1">No notes added by support team yet.</p>
                            ) : (
                              activeTicketDetails.notes.map((note: any) => (
                                <div key={note.id} className="p-3 rounded-xl bg-slate-800/20 border border-white/5 flex flex-col gap-1">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-300">Author: Support Team</span>
                                    <span>{formatDate(note.created_at)}</span>
                                  </div>
                                  <p className="text-slate-300 mt-1 leading-relaxed">{note.content}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-500 animate-pulse">Loading ticket details...</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
