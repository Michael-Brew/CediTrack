import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { Transaction, transactionsApi } from '../api/transactions';
import { formatGHS, formatDate, getCategoryColor } from '../lib/formatters';

interface AnomalyPageProps {
  onRefreshParent?: () => void;
}

export const AnomalyPage: React.FC<AnomalyPageProps> = ({ onRefreshParent }) => {
  const [anomalies, setAnomalies] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const data = await transactionsApi.list({ is_flagged_anomaly: true });
      setAnomalies(data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch anomaly list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await transactionsApi.dismissAnomaly(id);
      await loadAnomalies();
      onRefreshParent?.();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss anomaly');
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 lg:pb-12">
      {/* Friendly Guide Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/60 dark:bg-gradient-to-br dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-500/30 space-y-3 shadow-sm transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Smart Spending Alerts
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-3xl">
              CediTrack automatically keeps an eye on your expenses over the past <strong>30 days</strong>. If a payment or purchase is much higher than what you normally spend in that category, it gets highlighted here so you can double-check it and stay in control of your budget.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-850/80 border border-amber-200/80 dark:border-slate-800 flex items-start gap-2.5 shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Your Regular Spending Habits</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                We learn what you typically spend on things like food, transport, or bills, and alert you if an expense jumps way above normal.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-850/80 border border-amber-200/80 dark:border-slate-800 flex items-start gap-2.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Sudden High Expenses</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                If an expense is 3 times higher than your usual average, we highlight it right away so no surprise charge goes unnoticed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Transactions Feed */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            High Expenses to Review ({anomalies.length})
          </h4>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Checking your recent spending...</span>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="p-10 sm:p-12 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">Everything Looks Good!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              All your expenses over the last 30 days are right within your normal spending range.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-base">{item.description}</span>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">via {item.account_name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">• {formatDate(item.date)}</span>
                  </div>

                  <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed font-sans bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20">
                    {item.anomaly_reason || 'This expense is higher than what you usually spend in this category.'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Amount</span>
                    <span className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400">{formatGHS(item.amount)}</span>
                  </div>

                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 hover:text-white dark:hover:text-white text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-emerald-500 shadow-sm"
                  >
                    Got It (Dismiss)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
