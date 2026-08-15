import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { MonthlyIncomeExpensePoint } from '../../api/dashboard';
import { formatGHS } from '../../lib/formatters';

interface IncomeExpenseChartProps {
  data: MonthlyIncomeExpensePoint[];
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center h-80 text-slate-400 text-sm">
        No monthly flow data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inc = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = inc - exp;

      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[150px]">
          <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          <div className="flex items-center justify-between text-emerald-400">
            <span>Inflow:</span>
            <span className="font-bold">{formatGHS(inc)}</span>
          </div>
          <div className="flex items-center justify-between text-rose-400">
            <span>Outflow:</span>
            <span className="font-bold">{formatGHS(exp)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-slate-200">
            <span>Net Savings:</span>
            <span className={`font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatGHS(net)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Income vs Expense Over Time</h3>
          <p className="text-xs text-slate-400">Monthly cash inflow vs expense outflow</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₵${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar dataKey="income" name="Income (Inflow)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="expense" name="Expense (Outflow)" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
