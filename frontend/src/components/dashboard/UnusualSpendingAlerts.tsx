import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, ChevronRight, Sparkles } from 'lucide-react';
import { AnomalyAlertItem } from '../../api/dashboard';
import { formatGHS, formatDate, getCategoryColor } from '../../lib/formatters';

interface UnusualSpendingAlertsProps {
  alerts: AnomalyAlertItem[];
  onDismiss?: (id: string) => void;
  onViewAll?: () => void;
}

export const UnusualSpendingAlerts: React.FC<UnusualSpendingAlertsProps> = ({
  alerts,
  onDismiss,
  onViewAll
}) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Spending is Normal (30-Day Window)</h4>
            <p className="text-xs text-slate-400">No anomalous or irregular high expenses detected across your accounts.</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Healthy
        </span>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Unusual Spending Detected ({alerts.length})
            </h3>
            <p className="text-xs text-amber-300/80">30-day statistical variance flagged high expenses</p>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm truncate">{item.description}</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                >
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-400">via {item.account_name}</span>
                <span className="text-[11px] text-slate-400">• {formatDate(item.date)}</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                {item.anomaly_reason}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60">
              <span className="text-base font-extrabold text-amber-400">{formatGHS(item.amount)}</span>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(item.id)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
