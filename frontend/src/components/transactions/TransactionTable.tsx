import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  FileText
} from 'lucide-react';
import { Transaction } from '../../api/transactions';
import { formatGHS, formatDate, getCategoryColor } from '../../lib/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDismissAnomaly?: (id: string) => void;
  loading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onDismissAnomaly,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span>Loading ledger entries...</span>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-10 sm:p-12 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Transactions Found</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          No records match your filters. Add a new manual transaction or upload a bank/MoMo statement.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
      {/* Mobile Card View (< sm / 640px) */}
      <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.map((t) => {
          const isIncome = t.type === 'Income';
          const catColor = getCategoryColor(t.category);

          return (
            <div
              key={t.id}
              className={`p-4 transition-colors ${
                t.is_flagged_anomaly ? 'bg-amber-500/10 dark:bg-amber-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{t.description}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(t.date)} • {t.account_name || 'Account'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-bold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isIncome ? '+' : '-'}{formatGHS(t.amount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                    <span>{t.category}</span>
                  </span>

                  {t.is_flagged_anomaly && (
                    <span
                      title={t.anomaly_reason || 'Unusually high expense'}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>High Spend</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {t.is_flagged_anomaly && onDismissAnomaly && (
                    <button
                      onClick={() => onDismissAnomaly(t.id)}
                      title="Dismiss Anomaly"
                      className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(t)}
                    title="Edit"
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop / Tablet Table (>= sm / 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description / Narration</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Account</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Anomaly Flag</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {transactions.map((t) => {
              const isIncome = t.type === 'Income';
              const catColor = getCategoryColor(t.category);

              return (
                <tr
                  key={t.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    t.is_flagged_anomaly ? 'bg-amber-500/5 dark:bg-amber-950/20' : ''
                  }`}
                >
                  {/* Date */}
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                    {formatDate(t.date)}
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}>
                        {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{t.description}</p>
                        {t.reference_id && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Ref: {t.reference_id}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ backgroundColor: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                      <span>{t.category}</span>
                    </span>
                  </td>

                  {/* Account */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{t.account_name || 'Account'}</span>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className={`font-bold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {isIncome ? '+' : '-'}{formatGHS(t.amount)}
                    </span>
                  </td>

                  {/* Anomaly Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {t.is_flagged_anomaly ? (
                      <div
                        title={t.anomaly_reason || 'Unusually high expense'}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-help"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>High Spend</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.is_flagged_anomaly && onDismissAnomaly && (
                        <button
                          onClick={() => onDismissAnomaly(t.id)}
                          title="Dismiss Anomaly Flag"
                          className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(t)}
                        title="Edit"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
                        title="Delete"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
