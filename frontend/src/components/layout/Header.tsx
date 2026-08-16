import React from 'react';
import { Menu, Plus, ShieldAlert, Sun, Moon } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenAddTransaction: () => void;
  onSeedData: () => void;
  seeding: boolean;
  flaggedCount?: number;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Financial Overview', subtitle: 'Real-time cashflow, MoMo balances & spending health' },
  accounts: { title: 'Accounts & Wallets', subtitle: 'Manage MTN MoMo, Telecel Cash, Bank accounts & Cash till' },
  transactions: { title: 'Transactions Ledger', subtitle: 'Complete log of income and expense transactions' },
  upload: { title: 'Smart Statement Import', subtitle: 'Upload and review bank & mobile money statements' },
  anomalies: { title: '30-Day Spending Alerts', subtitle: 'Unusually high expense warnings and variance detector' },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenAddTransaction,
  onSeedData,
  seeding,
  flaggedCount = 0
}) => {
  const currentInfo = TAB_TITLES[currentTab] || { title: 'CediTrack', subtitle: 'Finance Tracker' };
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {currentInfo.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden md:block truncate">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {flaggedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{flaggedCount} High Expense {flaggedCount === 1 ? 'Alert' : 'Alerts'}</span>
            <span className="sm:hidden">{flaggedCount} Alert{flaggedCount === 1 ? '' : 's'}</span>
          </div>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 shadow-sm"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-fade-in" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 animate-fade-in" />
          )}
        </button>

        {/* Quick Add Button (Desktop / Tablet) */}
        <button
          onClick={onOpenAddTransaction}
          className="hidden sm:inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs shadow-md shadow-emerald-950/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>
    </header>
  );
};
