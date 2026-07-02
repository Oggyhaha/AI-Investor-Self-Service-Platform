'use client';

import { useQuery } from '@tanstack/react-query';
import { portfolioAPI } from '@/lib/api';
import { formatCurrency, formatDate, getReturnColorClass, formatPercent } from '@/lib/utils';
import { TrendingUp, Briefcase } from 'lucide-react';

export default function PortfolioPage() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const { data } = await portfolioAPI.getSummary();
      return data;
    },
  });

  if (isLoading || !portfolio) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200/50 w-1/4 rounded-xl" />
        <div className="h-44 bg-slate-200/50 rounded-2xl border border-slate-100" />
        <div className="h-64 bg-slate-200/50 rounded-2xl border border-slate-100" />
      </div>
    );
  }

  const { total_invested, current_value, absolute_returns, returns_pct, holdings } = portfolio;

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-secondary top-40 -left-20 opacity-20"></div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-wide text-slate-800">My Holdings</h1>
        <p className="text-xs text-slate-500 font-semibold mt-1">Detailed breakdown of all mutual fund holdings in your portfolio.</p>
      </div>

      {/* Aggregate Banner */}
      <div className="glass-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center bg-white border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-3 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/30">
            <Briefcase className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invested</p>
            <p className="text-lg font-black text-slate-800">{formatCurrency(total_invested)}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Value</p>
          <p className="text-lg font-black text-slate-800">{formatCurrency(current_value)}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absolute Returns</p>
          <p className={`text-lg font-black ${getReturnColorClass(absolute_returns)}`}>
            {formatCurrency(absolute_returns)}
          </p>
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Gain/Loss %</p>
          <div className="flex items-center gap-1">
            <span className={`text-lg font-black ${getReturnColorClass(absolute_returns)}`}>
              {absolute_returns >= 0 ? '+' : ''}{returns_pct.toFixed(2)}%
            </span>
            <TrendingUp className={`w-4 h-4 ${getReturnColorClass(absolute_returns)}`} />
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fund Allocation</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Mutual Fund</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Invested Value</th>
                <th className="px-6 py-4 text-right">Current Value</th>
                <th className="px-6 py-4 text-right">Gains/Loss</th>
                <th className="px-6 py-4 text-right">CAGR Returns</th>
                <th className="px-6 py-4">Purchase Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No holdings in your portfolio.
                  </td>
                </tr>
              ) : (
                holdings.map((h: any) => {
                  const gains = h.current_value - h.invested_amount;
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{h.fund.fund_name}</td>
                      <td className="px-6 py-4 uppercase text-[10px] tracking-wide text-indigo-500 font-bold">{h.fund.category}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-700">{formatCurrency(h.invested_amount)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">{formatCurrency(h.current_value)}</td>
                      <td className={`px-6 py-4 text-right font-bold ${getReturnColorClass(gains)}`}>
                        {formatCurrency(gains)}
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${getReturnColorClass(gains)}`}>
                        {formatPercent(h.returns_pct)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">{formatDate(h.purchase_date)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
