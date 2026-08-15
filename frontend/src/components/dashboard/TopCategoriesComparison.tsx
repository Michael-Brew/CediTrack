import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CategoryChangeItem } from '../../api/dashboard';
import { formatGHS, getCategoryColor } from '../../lib/formatters';

interface TopCategoriesComparisonProps {
  data: CategoryChangeItem[];
}

export const TopCategoriesComparison: React.FC<TopCategoriesComparisonProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center h-80 text-slate-400 text-sm">
        No category comparison data available yet.
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-white tracking-tight">Top Spending Shifts</h3>
          <span className="text-[11px] font-medium text-slate-400">This Month vs Last Month</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">Highest expense categories and percentage variation</p>

        <div className="space-y-3">
          {data.map((item, idx) => {
            const isUp = item.trend === 'up';
            const isDown = item.trend === 'down';
            const catColor = getCategoryColor(item.category);

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-850/50 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                    <span className="font-semibold text-white">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Last: {formatGHS(item.last_month_amount)}</span>
                    <span className="font-bold text-white text-sm">{formatGHS(item.current_month_amount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="w-2/3 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: catColor,
                        width: `${Math.min(100, Math.max(10, item.current_month_amount > 0 ? (item.current_month_amount / (item.last_month_amount || item.current_month_amount)) * 50 : 0))}%`
                      }}
                    />
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      isUp
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : isDown
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isUp && <TrendingUp className="w-3 h-3" />}
                    {isDown && <TrendingDown className="w-3 h-3" />}
                    {!isUp && !isDown && <Minus className="w-3 h-3" />}
                    <span>{item.percentage_change > 0 ? `+${item.percentage_change}%` : `${item.percentage_change}%`}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
