'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI, transactionAPI } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { formatCurrency, formatDate, getReturnColorClass, getStatusColor } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MessageSquare,
  FileText,
  DollarSign,
  ArrowRightLeft,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  X,
  CreditCard,
  Lock,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Investment Modal States
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investStep, setInvestStep] = useState<1 | 2>(1); // 1 = select fund/amt, 2 = verify OTP
  const [selectedFundId, setSelectedFundId] = useState('1');
  const [investAmount, setInvestAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('ICICI Bank (******5678)');
  const [investOtp, setInvestOtp] = useState('');
  const [investError, setInvestError] = useState<string | null>(null);
  const [investSuccess, setInvestSuccess] = useState<string | null>(null);

  // Predefined mutual funds matching DB seeds
  const mutualFunds = [
    { id: '1', name: 'HDFC Mid-Cap Opportunities Fund', category: 'equity' },
    { id: '2', name: 'ICICI Prudential Bluechip Fund', category: 'equity' },
    { id: '3', name: 'SBI Small Cap Fund', category: 'equity' },
    { id: '4', name: 'Axis Long Term Equity Fund', category: 'ELSS' },
    { id: '5', name: 'Kotak Standard Multicap Fund', category: 'equity' },
    { id: '6', name: 'Nippon India Liquid Fund', category: 'debt' },
  ];

  // Fetch Dashboard metrics
  const { data: dash, isLoading } = useQuery({
    queryKey: ['investor-dashboard'],
    queryFn: async () => {
      const { data } = await dashboardAPI.getInvestorDashboard();
      return data;
    },
    refetchInterval: 15000,
  });

  // Fetch Recent Transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data } = await transactionAPI.getTransactions({ limit: 5 });
      return data;
    },
    enabled: !!dash,
  });

  // Invest mutation
  const investMutation = useMutation({
    mutationFn: async (data: { fund_id: number; amount: number; bank_account: string }) => {
      setInvestError(null);
      const res = await apiInvestCall(data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      setInvestSuccess(`Successfully invested ${formatCurrency(parseFloat(investAmount))}! Allocated units will reflect shortly.`);
      setTimeout(() => {
        closeInvestModal();
      }, 3000);
    },
    onError: (err: any) => {
      setInvestError(err.response?.data?.error?.detail || 'Failed to process transaction.');
    },
  });

  const apiInvestCall = (data: { fund_id: number; amount: number; bank_account: string }) => {
    // Explicit call to /transactions/invest
    return transactionAPI.getTransactions() // placeholder query
      .then(() => {
        // Direct axios post
        const api = require('@/lib/api').default;
        return api.post('/transactions/invest', data);
      });
  };

  const closeInvestModal = () => {
    setShowInvestModal(false);
    setInvestStep(1);
    setInvestAmount('');
    setInvestOtp('');
    setInvestError(null);
    setInvestSuccess(null);
  };

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(investAmount);
    if (!amt || amt < 500) {
      setInvestError('Minimum investment amount is ₹500');
      return;
    }
    setInvestError(null);
    setInvestStep(2); // move to OTP step
  };

  const handleInvestConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (investOtp !== '123456') {
      setInvestError('Invalid OTP code. Use 123456');
      return;
    }
    investMutation.mutate({
      fund_id: parseInt(selectedFundId),
      amount: parseFloat(investAmount),
      bank_account: bankAccount
    });
  };

  if (isLoading || !dash) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200/50 w-1/4 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200/50 rounded-2xl border border-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200/50 rounded-2xl border border-slate-100" />
          <div className="h-80 bg-slate-200/50 rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }

  const { investor_profile, total_invested, current_value, total_returns, total_returns_pct, active_sips_count } = dash;

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Floating background glows */}
      <div className="glow-primary -top-10 -right-20 opacity-30"></div>

      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-slate-800">
            Welcome back, <span className="text-gradient">{investor_profile.full_name}</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Here is your mutual fund portfolio overview today.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvestModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-indigo text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Money / Invest</span>
          </button>

          <div className="text-[11px] text-slate-500 font-semibold bg-white border border-slate-100 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>PAN: {investor_profile.pan}</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
        {/* Total Invested */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden bg-white">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Invested</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">{formatCurrency(total_invested)}</p>
          <span className="text-[10px] text-slate-400 font-semibold">Net principal contribution</span>
        </div>

        {/* Current Valuation */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden bg-white">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Current Value</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">{formatCurrency(current_value)}</p>
          <span className="text-[10px] text-slate-400 font-semibold">As of latest market NAV date</span>
        </div>

        {/* Portfolio Returns */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden bg-white">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Returns</span>
            {total_returns >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <p className={`text-2xl font-black ${total_returns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(total_returns)}
          </p>
          <span className={`text-xs font-bold flex items-center gap-0.5 ${total_returns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {total_returns >= 0 ? '+' : ''}{total_returns_pct.toFixed(2)}% returns rate
          </span>
        </div>

        {/* Active SIPs */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden bg-white">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active SIPs</span>
            <RefreshCw className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">{active_sips_count} SIPs</p>
          <span className="text-[10px] text-slate-400 font-semibold">Monthly auto-debit plans</span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col gap-4 bg-white">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Transactions</h3>
            <Link href="/statements" className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1">
              <span>View History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No transaction records found.</div>
            ) : (
              transactions.map((t: any) => (
                <div key={t.transaction_id} className="p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/30">
                      <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{t.fund.fund_name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1">{t.type} | {formatDate(t.transaction_date)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-800">{formatCurrency(t.amount)}</p>
                    <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md mt-1.5 ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">Quick Actions</h3>
            
            <div className="flex flex-col gap-3">
              {/* Chat with AURA */}
              <Link href="/chat" className="p-4 rounded-2xl bg-gradient-indigo text-white hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-3 shadow-lg shadow-indigo-500/15">
                <MessageSquare className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider">Chat with AURA</p>
                  <p className="text-[10px] text-indigo-100 mt-0.5 leading-relaxed">Resolve failed mandates, KYC details instantly</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>

              {/* Generate Statement */}
              <Link href="/statements" className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider">Generate Statement</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Request capital gains or portfolio PDF</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
              </Link>

              {/* Check SIP Status */}
              <Link href="/sips" className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider">SIP Mandates</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Manage cycletimes & resolve bank status</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Invest Money Dialog Modal */}
      <AnimatePresence>
        {showInvestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-800 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Invest Capital</h3>
                <button onClick={closeInvestModal} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {investSuccess ? (
                <div className="py-6 text-center flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Investment Successful!</h4>
                  <p className="text-xs text-slate-500 px-4 leading-relaxed">{investSuccess}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {investError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold leading-relaxed">
                      {investError}
                    </div>
                  )}

                  {investStep === 1 ? (
                    <form onSubmit={handleInvestSubmit} className="flex flex-col gap-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Select Mutual Fund</label>
                        <select
                          value={selectedFundId}
                          onChange={(e) => setSelectedFundId(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          {mutualFunds.map(fund => (
                            <option key={fund.id} value={fund.id}>{fund.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Investment Amount (INR)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            min="500"
                            placeholder="Enter amount (min ₹500)"
                            value={investAmount}
                            onChange={(e) => setInvestAmount(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Debit Bank Partner</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                          >
                            <option value="ICICI Bank (******5678)">ICICI Bank ending in 5678</option>
                            <option value="HDFC Bank (******1234)">HDFC Bank ending in 1234</option>
                            <option value="SBI Bank (******9012)">State Bank of India ending in 9012</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 bg-gradient-indigo py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        <span>Initiate Transaction</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleInvestConfirm} className="flex flex-col gap-4 text-xs">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Order Summary</span>
                        <p className="font-bold text-slate-800 mt-1">{mutualFunds.find(f => f.id === selectedFundId)?.name}</p>
                        <p className="font-black text-slate-900 text-sm mt-0.5">Amount: {formatCurrency(parseFloat(investAmount))}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Debited from {bankAccount}</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Authorize debit (OTP verification)</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP (e.g. 123456)"
                            value={investOtp}
                            onChange={(e) => setInvestOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 tracking-wider placeholder:tracking-normal font-bold"
                            required
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-semibold">
                          <span className="text-emerald-600">Demo Code: 123456</span>
                          <button type="button" onClick={() => setInvestStep(1)} className="text-indigo-600 hover:text-indigo-700">Modify Order</button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={investMutation.isPending}
                        className="w-full mt-2 bg-gradient-indigo py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                      >
                        <span>{investMutation.isPending ? 'Processing...' : 'Confirm Payment Auto-debit'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
