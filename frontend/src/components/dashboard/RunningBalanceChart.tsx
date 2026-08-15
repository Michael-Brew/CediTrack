import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { AccountBalanceHistoryPoint } from '../../api/dashboard';
import { formatGHS } from '../../lib/formatters';

interface RunningBalanceChartProps {
  data: AccountBalanceHistoryPoint[];
}

const LINE_COLORS = [
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#38BDF8', // Sky Blue
  '#EC4899', // Pink
  '#A855F7', // Purple
  '#F97316', // Orange
];

export const RunningBalanceChart: React.FC<RunningBalanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center h-80 text-slate-400 text-sm">
        No balance history available yet. Add transactions or import a statement to view running balances.
      </div>
    );
  }

  // Get all unique account names
  const accountNames = Array.from(
    new Set(data.flatMap(d => Object.keys(d.balances)))
  );

  // Flatten data for Recharts
  const chartData = data.map(d => ({
    date: d.date,
    ...d.balances
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[160px]">
          <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 truncate max-w-[100px]">{item.name}:</span>
              </div>
              <span className="font-bold text-white">{formatGHS(item.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Running Balance by Account</h3>
          <p className="text-xs text-slate-400">Cumulative balance trajectory across all active accounts</p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
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
              tickFormatter={(v) => `₵${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            {accountNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
