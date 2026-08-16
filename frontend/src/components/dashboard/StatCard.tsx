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
      border: 'border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/40',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40',
      iconBg: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    blue: {
      border: 'border-sky-200 dark:border-sky-500/20 hover:border-sky-400 dark:hover:border-sky-500/40',
      iconBg: 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400',
    },
    rose: {
      border: 'border-rose-200 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/40',
      iconBg: 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
    slate: {
      border: 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
  }[variant];

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border ${variantStyles.border} transition-all duration-200 shadow-sm relative overflow-hidden group`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${variantStyles.iconBg} flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold px-1.5 py-0.5 rounded ${trend.isPositive ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'}`}>
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate text-[11px] sm:text-xs">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
