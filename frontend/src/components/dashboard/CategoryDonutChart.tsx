import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { CategorySpendItem } from '../../api/dashboard';
import { formatGHS, getCategoryColor } from '../../lib/formatters';
import { useTheme } from '../../context/ThemeContext';

interface CategoryDonutChartProps {
  data: CategorySpendItem[];
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center h-80 text-slate-500 dark:text-slate-400 text-sm shadow-sm">
        No expense category data found.
      </div>
    );
  }

  const totalExpense = data.reduce((acc, curr) => acc + curr.amount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategorySpendItem;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 min-w-[150px]">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || getCategoryColor(item.category) }} />
            <span>{item.category}</span>
          </div>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{formatGHS(item.amount)}</p>
          <p className="text-slate-500 dark:text-slate-400">{item.percentage}% of spending ({item.count} txns)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
      <div className="mb-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Spending by Category</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of recent expense categories</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
        {/* Chart */}
        <div className="sm:col-span-6 h-52 sm:h-56 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                dataKey="amount"
                stroke={isDark ? '#0f172a' : '#ffffff'}
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || getCategoryColor(entry.category)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">Total</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">{formatGHS(totalExpense)}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="sm:col-span-6 space-y-2 max-h-56 overflow-y-auto pr-1">
          {data.slice(0, 7).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || getCategoryColor(item.category) }}
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.category}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-slate-900 dark:text-white">{formatGHS(item.amount)}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono w-9 text-right">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
