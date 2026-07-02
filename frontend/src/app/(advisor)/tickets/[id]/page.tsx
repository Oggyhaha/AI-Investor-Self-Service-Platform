'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI, chatAPI } from '@/lib/api';
import { formatDate, getStatusColor, formatCategory } from '@/lib/utils';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageSquare, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdvisorTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ticketId = params.id as string;

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [resolution, setResolution] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch ticket details
  const { data: ticket, isLoading: isLoadingTicket } = useQuery({
    queryKey: ['advisor-ticket-detail', ticketId],
    queryFn: async () => {
      const { data } = await ticketAPI.getById(ticketId);
      // Pre-fill state when data loads
      setStatus(data.status);
      setPriority(data.priority);
      setResolution(data.resolution || '');
      return data;
    },
    enabled: !!ticketId,
  });

  // Fetch conversation messages
  const { data: conversationDetails } = useQuery({
    queryKey: ['ticket-conversation', ticket?.conversation_id],
    queryFn: async () => {
      const { data } = await chatAPI.getConversation(ticket.conversation_id);
      return data;
    },
    enabled: !!ticket?.conversation_id,
  });

  // Update ticket mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      setSuccessMsg(null);
      setErrorMsg(null);
      await ticketAPI.update(ticketId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor-ticket-detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['advisor-queue'] });
      setSuccessMsg('Ticket updated successfully.');
    },
    onError: () => {
      setErrorMsg('Failed to update ticket.');
    },
  });

  // Add Note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      await ticketAPI.addNote(ticketId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor-ticket-detail', ticketId] });
      setNoteContent('');
    },
  });

  if (isLoadingTicket || !ticket) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200/50 w-1/4 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-slate-200/50 rounded-2xl" />
          <div className="h-80 bg-slate-200/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Back button */}
      <div>
        <Link href="/advisor" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to support queue</span>
        </Link>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-wide">
            Ticket: {ticket.ticket_id} — <span className="text-indigo-600">{formatCategory(ticket.category)}</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Submitted by {ticket.investor_name} | Created: {formatDate(ticket.created_at)}</p>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Chat history log */}
        <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 max-h-[600px] overflow-y-auto shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>AI Conversation History</span>
          </h3>

          <div className="flex flex-col gap-4">
            {!conversationDetails?.messages ? (
              <p className="text-slate-400 italic text-xs py-4 text-center">No chat logs linked to this ticket.</p>
            ) : (
              conversationDetails.messages.map((m: any) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-[85%] ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] ${
                      isUser ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isUser ? 'U' : 'AI'}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isUser 
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-100/50' 
                          : 'bg-white border border-slate-100 text-slate-700 shadow-sm'
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1 block font-semibold">{formatDate(m.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Resolution form, descriptions, and internal notes */}
        <div className="flex flex-col gap-6">
          {/* AI problem summary */}
          {ticket.ai_summary && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-xs">
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Problem Analysis Summary</span>
              </p>
              <p className="leading-relaxed font-semibold">{ticket.ai_summary}</p>
            </div>
          )}

          {/* Ticket Description */}
          <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Description</h3>
            <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-semibold">
              {ticket.description || 'No description provided.'}
            </div>
          </div>

          {/* Update / Resolution form */}
          <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Resolve Ticket</h3>

            {successMsg && (
              <div className="p-3 bg-emerald-55 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ status, priority, resolution });
              }}
              className="flex flex-col gap-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-semibold"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-semibold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Resolution Notes</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how the ticket was resolved..."
                  className="w-full bg-slate-55 border border-slate-200/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white min-h-[80px] font-semibold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full md:w-auto bg-gradient-indigo py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 disabled:opacity-50 self-start"
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Resolution'}
              </button>
            </form>
          </div>

          {/* Notes Section */}
          <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Internal Advisor Notes</h3>

            <div className="flex flex-col gap-3 max-h-40 overflow-y-auto mb-2">
              {ticket.notes.length === 0 ? (
                <p className="text-slate-400 italic text-xs py-2 font-semibold">No internal notes added yet.</p>
              ) : (
                ticket.notes.map((n: any) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Advisor Team</span>
                      <span>{formatDate(n.created_at)}</span>
                    </div>
                    <p className="text-slate-750 mt-1 leading-relaxed font-semibold">{n.content}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!noteContent.trim()) return;
                addNoteMutation.mutate(noteContent.trim());
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Type internal advisor note..."
                className="flex-1 bg-slate-55 border border-slate-200/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-semibold"
                required
              />
              <button
                type="submit"
                disabled={addNoteMutation.isPending}
                className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-all shadow-sm"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
