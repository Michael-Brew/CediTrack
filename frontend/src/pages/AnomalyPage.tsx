import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, ArrowUpRight, TrendingUp } from 'lucide-react';
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
    <div className="space-y-6 pb-12">
      {/* Educational Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              30-Day High Expense & Anomaly Intelligence
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
              CediTrack continuously monitors your spending using a <strong>30-day statistical rolling window</strong> per category. 
              Transactions exceeding your standard variance (mean + 2σ for categories with ≥5 transactions, or 3x category average) 
              are flagged below so you can prevent overspending and catch unexpected charges early.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Statistical Baseline (≥5 transactions)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluates standard deviation (σ). Flags if spend &gt; 30-day mean + 2σ.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Early Threshold (&lt;5 transactions)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Flags when a transaction is &gt; 3x your rolling average in that category.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Transactions Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white tracking-tight">
            Flagged Transactions for Review ({anomalies.length})
          </h4>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Auditing 30-day window transactions...</span>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">All Clear! No High Expenses Flagged</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Your recent expenses over the last 30 days are within normal variance for all categories.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{item.description}</span>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-400">via {item.account_name}</span>
                    <span className="text-xs text-slate-400">• {formatDate(item.date)}</span>
                  </div>

                  <p className="text-xs text-amber-200/90 leading-relaxed font-sans bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    {item.anomaly_reason || 'This expense is abnormally high compared to your usual category average.'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Flagged Amount</span>
                    <span className="text-xl font-extrabold text-amber-400">{formatGHS(item.amount)}</span>
                  </div>

                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 hover:border-emerald-500 shadow-sm"
                  >
                    Acknowledge
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
