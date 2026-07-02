'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { formatDate } from '@/lib/utils';
import {
  MessageSquare,
  Send,
  Plus,
  Sparkles,
  User,
  AlertTriangle,
  History
} from 'lucide-react';

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch past conversations
  const { data: conversations = [], isLoading: isLoadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await chatAPI.getConversations();
      return data;
    },
    enabled: !!user,
  });

  // Fetch active conversation messages details
  const { data: activeConvDetails, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['conversation-messages', activeConvId],
    queryFn: async () => {
      const { data } = await chatAPI.getConversation(activeConvId!);
      return data;
    },
    enabled: !!activeConvId,
    refetchInterval: 5000, // Poll every 5s for advisor notes/responses
  });

  // Create new conversation mutation
  const createConvMutation = useMutation({
    mutationFn: async () => {
      const { data } = await chatAPI.createConversation();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConvId(data.conversation_id);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ convId, content }: { convId: string; content: string }) => {
      const { data } = await chatAPI.sendMessage(convId, content);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', activeConvId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConvDetails?.messages, sendMessageMutation.isPending]);

  // Set default active conversation if none is selected and list loaded
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].conversation_id);
    } else if (!activeConvId && !isLoadingConvs && conversations.length === 0) {
      // Auto-create initial conversation if none exists
      createConvMutation.mutate();
    }
  }, [conversations, activeConvId, isLoadingConvs]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || !activeConvId || sendMessageMutation.isPending) return;

    const content = inputVal.trim();
    setInputVal('');
    sendMessageMutation.mutate({ convId: activeConvId, content });
  };

  const handleQuickAction = (actionText: string) => {
    if (!activeConvId || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ convId: activeConvId, content: actionText });
  };

  const quickActionPills = [
    'Check my SIP status',
    'Download statement',
    'View portfolio',
    'KYC status',
    'Talk to advisor'
  ];

  return (
    <div className="h-[calc(100vh-130px)] flex border border-slate-100 rounded-3xl overflow-hidden glass-card bg-white relative z-10 shadow-md">
      
      {/* Left panel: chats list */}
      <div className="w-80 border-r border-slate-100 bg-slate-50/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-500" />
            <span>Chat Sessions</span>
          </h3>
          <button
            onClick={() => createConvMutation.mutate()}
            className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100/30 text-indigo-500 hover:bg-indigo-100/60 transition-all"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {isLoadingConvs ? (
            <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Loading history...</div>
          ) : conversations.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">No past conversations.</div>
          ) : (
            conversations.map((c: any) => {
              const isActive = activeConvId === c.conversation_id;
              return (
                <button
                  key={c.conversation_id}
                  onClick={() => setActiveConvId(c.conversation_id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 group flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-100/50 text-indigo-600 shadow-sm'
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100/40 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="overflow-hidden w-full">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {c.summary || c.primary_intent || 'Chat Session'}
                    </p>
                    <span className="text-[9px] text-slate-400 block mt-1 font-medium">{formatDate(c.started_at)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col bg-slate-50/10">
        {/* Chat window Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-indigo flex items-center justify-center shadow-md shadow-indigo-500/10">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AURA Assistant</h4>
              <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span>Conversational Agent</span>
              </span>
            </div>
          </div>

          {activeConvDetails?.status === 'escalated' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-150 text-[10px] font-bold text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Escalated to Advisor</span>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {isLoadingMessages ? (
            <div className="my-auto text-center text-xs text-slate-400 animate-pulse font-semibold">Loading message details...</div>
          ) : activeConvDetails ? (
            activeConvDetails.messages.map((m: any) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-[85%] ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                    isUser
                      ? 'bg-indigo-50 border border-indigo-100 text-indigo-500'
                      : 'bg-gradient-indigo text-white shadow-md'
                  }`}>
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser ? 'bubble-user text-white' : 'bubble-bot text-slate-700 bg-white border border-slate-100 shadow-sm'
                    }`}>
                      <p className="whitespace-pre-line font-medium">{m.content}</p>
                    </div>
                    {/* Timestamp */}
                    <span className={`text-[9px] text-slate-400 font-semibold ${isUser ? 'text-right' : 'text-left'}`}>
                      {formatDate(m.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="my-auto text-center text-xs text-slate-400 font-bold uppercase tracking-wider">Select a chat to begin.</div>
          )}

          {/* Typing Indicator */}
          {sendMessageMutation.isPending && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-gradient-indigo text-white flex items-center justify-center font-bold text-xs shadow-md">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="bubble-bot p-4 rounded-2xl flex items-center gap-1 bg-white border border-slate-100 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dot-3" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips & Input Form */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          
          {/* Quick action chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickActionPills.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action)}
                disabled={sendMessageMutation.isPending || !activeConvId}
                className="shrink-0 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/60 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50/40 hover:border-indigo-200/50 transition-colors disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input text form */}
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                activeConvDetails?.status === 'escalated'
                  ? 'Chat is currently escalated to advisor. Type here to reply...'
                  : 'Type a message (e.g. why did my SIP fail? or show portfolio)'
              }
              className="flex-1 bg-white border border-slate-200 rounded-2xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-semibold"
              disabled={sendMessageMutation.isPending || !activeConvId}
              required
            />
            <button
              type="submit"
              disabled={sendMessageMutation.isPending || !activeConvId || !inputVal.trim()}
              className="p-3 bg-gradient-indigo text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
