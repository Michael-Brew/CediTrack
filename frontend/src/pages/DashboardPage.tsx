import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PiggyBank, 
  ShieldAlert, 
  Plus, 
  UploadCloud, 
  ArrowRightLeft,
  Smartphone,
  Landmark,
  Banknote,
  Sparkles
} from 'lucide-react';
import { DashboardSummary, DashboardChartsResponse, dashboardApi } from '../api/dashboard';
import { Account, accountsApi } from '../api/accounts';
import { transactionsApi } from '../api/transactions';
import { StatCard } from '../components/dashboard/StatCard';
import { RunningBalanceChart } from '../components/dashboard/RunningBalanceChart';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { TopCategoriesComparison } from '../components/dashboard/TopCategoriesComparison';
import { UnusualSpendingAlerts } from '../components/dashboard/UnusualSpendingAlerts';
import { formatGHS } from '../lib/formatters';

interface DashboardPageProps {
  onNavigateTab: (tab: any) => void;
  onOpenAddTransaction: () => void;
  onOpenTransfer: () => void;
  onSeedData: () => void;
  seeding: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateTab,
  onOpenAddTransaction,
  onOpenTransfer,
  onSeedData,
  seeding
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardChartsResponse | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, chartRes, accRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getCharts(),
        accountsApi.list(),
      ]);
      setSummary(sumRes);
      setCharts(chartRes);
      setAccounts(accRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDismissAnomaly = async (id: string) => {
    try {
      await transactionsApi.dismissAnomaly(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss anomaly');
    }
  };

  if (loading && !summary) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span>Loading financial overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Actions for New Accounts */}
      {accounts.length === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Welcome to CediTrack Ghana!</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Get started by adding your Mobile Money wallet (MTN MoMo, Telecel Cash), bank account, or load sample realistic Ghanaian transactions with 1-click.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onSeedData}
              disabled={seeding}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow"
            >
              {seeding ? 'Seeding...' : 'Seed Sample Ghana Data'}
            </button>
            <button
              onClick={() => onNavigateTab('accounts')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
            >
              Add Accounts
            </button>
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Worth"
          value={formatGHS(summary?.total_net_worth || 0)}
          subtitle={`Across ${summary?.accounts_count || 0} active accounts`}
          icon={Wallet}
          variant="emerald"
        />
        <StatCard
          title="This Month Inflows"
          value={formatGHS(summary?.total_monthly_income || 0)}
          subtitle="Salary, sales & remittances"
          icon={ArrowDownLeft}
          variant="blue"
        />
        <StatCard
          title="This Month Outflows"
          value={formatGHS(summary?.total_monthly_expense || 0)}
          subtitle="Expenses & bill payments"
          icon={ArrowUpRight}
          variant="rose"
        />
        <StatCard
          title="Net Savings"
          value={formatGHS(summary?.net_savings || 0)}
          subtitle={`${summary?.savings_rate || 0}% monthly savings rate`}
          icon={PiggyBank}
          variant="amber"
        />
      </div>

      {/* Account Balances Quick Slider */}
      {accounts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Balances</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenTransfer}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>
              <button
                onClick={() => onNavigateTab('accounts')}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Manage
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {accounts.map((acc) => {
              const Icon = acc.type === 'mobile_money' ? Smartphone : acc.type === 'bank' ? Landmark : Banknote;
              return (
                <div
                  key={acc.id}
                  onClick={() => onNavigateTab('transactions')}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px]"
                      style={{ backgroundColor: acc.color || '#10B981' }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-white truncate">{acc.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-white block">
                      {formatGHS(acc.current_balance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 30-Day Window Unusual Spending Alert Panel */}
      {charts && (
        <UnusualSpendingAlerts
          alerts={charts.unusual_spending_alerts}
          onDismiss={handleDismissAnomaly}
          onViewAll={() => onNavigateTab('anomalies')}
        />
      )}

      {/* Primary Visualizations */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RunningBalanceChart data={charts.balance_history} />
          <IncomeExpenseChart data={charts.income_expense_trend} />
        </div>
      )}

      {/* Secondary Visualizations */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryDonutChart data={charts.category_spending} />
          <TopCategoriesComparison data={charts.top_categories_comparison} />
        </div>
      )}
    </div>
  );
};
