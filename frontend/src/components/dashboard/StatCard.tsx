import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'slate'
}) => {
  const variantStyles = {
    emerald: {
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      glow: 'hover:border-emerald-500/40',
    },
    amber: {
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/15 text-amber-400',
      glow: 'hover:border-amber-500/40',
    },
    blue: {
      border: 'border-sky-500/20',
      iconBg: 'bg-sky-500/15 text-sky-400',
      glow: 'hover:border-sky-500/40',
    },
    rose: {
      border: 'border-rose-500/20',
      iconBg: 'bg-rose-500/15 text-rose-400',
      glow: 'hover:border-rose-500/40',
    },
    slate: {
      border: 'border-slate-800',
      iconBg: 'bg-slate-800 text-slate-300',
      glow: 'hover:border-slate-700',
    },
  }[variant];

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/90 border ${variantStyles.border} ${variantStyles.glow} transition-all duration-200 shadow-sm relative overflow-hidden group`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${variantStyles.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold px-1.5 py-0.5 rounded ${trend.isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-400 truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
