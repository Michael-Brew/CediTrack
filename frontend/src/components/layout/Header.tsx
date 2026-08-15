import React from 'react';
import { Menu, Sparkles, Plus, Wallet, ShieldAlert } from 'lucide-react';
import { NavTab } from './Sidebar';

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

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{currentInfo.title}</h2>
          <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {flaggedCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{flaggedCount} High Expense {flaggedCount === 1 ? 'Alert' : 'Alerts'}</span>
          </div>
        )}

        <button
          onClick={onOpenAddTransaction}
          className="hidden sm:inline-flex items-center gap-2 py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-xs shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>
    </header>
  );
};
