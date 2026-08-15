import React from 'react';
import { Search, Filter, RotateCcw, AlertTriangle } from 'lucide-react';
import { Account } from '../../api/accounts';
import { TransactionFilters } from '../../api/transactions';

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
  accounts: Account[];
  onReset: () => void;
}

const CATEGORIES = [
  'Transport', 'Food', 'MoMo/Airtime', 'Data Bundle', 'Rent', 'Bills',
  'Susu/Savings', 'Entertainment', 'Personal Care', 'Inventory/Supplies',
  'Logistics/Delivery', 'Marketing', 'Salary', 'Business Income',
  'Gift/Remittance', 'Susu Payout', 'Investment/Interest', 'Other Income', 'Other Expense'
];

export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  filters,
  onFilterChange,
  accounts,
  onReset,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
      {/* Top row: search & flags */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search by description, category, or reference..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Anomaly Flag toggle */}
        <button
          type="button"
          onClick={() => {
            onFilterChange({
              ...filters,
              is_flagged_anomaly: filters.is_flagged_anomaly === true ? undefined : true,
            });
          }}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
            filters.is_flagged_anomaly === true
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-850 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Flagged Only</span>
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          title="Reset Filters"
          className="p-2 rounded-xl bg-slate-850 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom row: select dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Account select */}
        <select
          value={filters.account_id || ''}
          onChange={(e) => onFilterChange({ ...filters, account_id: e.target.value || undefined })}
          className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        {/* Type select */}
        <select
          value={filters.type || ''}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value || undefined })}
          className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Types</option>
          <option value="Expense">Expenses Only</option>
          <option value="Income">Income Only</option>
        </select>

        {/* Category select */}
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value || undefined })}
          className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Date From */}
        <input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value || undefined })}
          className="px-3 py-1.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};
