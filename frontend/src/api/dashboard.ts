import { apiRequest } from './client';

export interface DashboardSummary {
  total_net_worth: number;
  total_monthly_income: number;
  total_monthly_expense: number;
  net_savings: number;
  savings_rate: number;
  total_flagged_anomalies: number;
  accounts_count: number;
  transactions_count: number;
}

export interface AccountBalanceHistoryPoint {
  date: string;
  balances: Record<string, number>;
}

export interface MonthlyIncomeExpensePoint {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategorySpendItem {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color?: string;
}

export interface CategoryChangeItem {
  category: string;
  current_month_amount: number;
  last_month_amount: number;
  percentage_change: number;
  trend: 'up' | 'down' | 'unchanged';
}

export interface AnomalyAlertItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  account_name: string;
  anomaly_reason: string;
}

export interface DashboardChartsResponse {
  balance_history: AccountBalanceHistoryPoint[];
  income_expense_trend: MonthlyIncomeExpensePoint[];
  category_spending: CategorySpendItem[];
  top_categories_comparison: CategoryChangeItem[];
  unusual_spending_alerts: AnomalyAlertItem[];
}

export interface SeedResponse {
  success: boolean;
  accounts_created: number;
  transactions_created: number;
  flagged_anomalies_count: number;
  message: string;
}

export const dashboardApi = {
  getSummary: () => apiRequest<DashboardSummary>('/api/dashboard/summary'),
  getCharts: () => apiRequest<DashboardChartsResponse>('/api/dashboard/charts'),
  seedDemoData: () => apiRequest<SeedResponse>('/api/dashboard/seed', {
    method: 'POST',
  }),
};
