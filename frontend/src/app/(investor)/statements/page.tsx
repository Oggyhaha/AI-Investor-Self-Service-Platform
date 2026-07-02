'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statementAPI } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { FileDown, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function StatementsPage() {
  const queryClient = useQueryClient();
  const [stmtType, setStmtType] = useState('account');
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState('2026-07-02');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch statements list
  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['statements'],
    queryFn: async () => {
      const { data } = await statementAPI.getAll();
      return data;
    },
  });

  // Generate statement mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setSuccessMsg(null);
      setErrorMsg(null);
      const { data } = await statementAPI.generate(stmtType, fromDate, toDate);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      setSuccessMsg('Statement generated successfully! You can download it below.');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.detail || 'Failed to generate statement. Try again.');
    },
  });

  const handleDownload = async (statementId: string, filename: string) => {
    try {
      const response = await statementAPI.download(statementId);
      // Create local URL for download blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download statement:', err);
    }
  };

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-primary -top-10 -right-20 opacity-20"></div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-wide text-slate-800">Tax and Account Statements</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">Generate and download official investment portfolios, transaction ledgers, or capital gains certificates.</p>
      </div>

      {/* Main split: left = Request Form, right = History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start z-10">
        
        {/* Request Form */}
        <div className="glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Request Statement</h3>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-semibold leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              generateMutation.mutate();
            }}
            className="flex flex-col gap-4 text-xs"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Statement Type</label>
              <select
                value={stmtType}
                onChange={(e) => setStmtType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
              >
                <option value="account">Account Statement (CAS)</option>
                <option value="capital_gains">Capital Gains Certificate</option>
                <option value="holding">Holdings Summary</option>
                <option value="transaction">Transaction Ledger</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Period From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Period To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="w-full mt-2 bg-gradient-indigo py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <span>{generateMutation.isPending ? 'Generating...' : 'Compile Document'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Generated History */}
        <div className="lg:col-span-2 glass-card bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement Archive</h3>
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse font-semibold">Loading statements...</div>
            ) : statements.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">No statements archived yet. Request one above!</div>
            ) : (
              statements.map((s: any) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-lg flex items-center justify-center border border-indigo-100/30">
                      <FileText className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{s.statement_type.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                        Period: {formatDate(s.period_from)} to {formatDate(s.period_to)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                    <button
                      onClick={() => handleDownload(s.id, `statement_${s.statement_type}_${s.id}.txt`)}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm"
                      title="Download"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
