import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  CheckCheck, 
  Trash2,
  Send,
  RotateCcw
} from 'lucide-react';
import { CSVPreviewResponse, CSVPreviewRow, CSVCommitRow } from '../../api/upload';
import { Account } from '../../api/accounts';
import { formatGHS, getCategoryColor } from '../../lib/formatters';

interface StatementReviewGridProps {
  preview: CSVPreviewResponse;
  accounts: Account[];
  onCommit: (filename: string, rows: CSVCommitRow[]) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const CATEGORIES = [
  'Transport', 'Food', 'MoMo/Airtime', 'Data Bundle', 'Rent', 'Bills',
  'Susu/Savings', 'Entertainment', 'Personal Care', 'Inventory/Supplies',
  'Logistics/Delivery', 'Marketing', 'Salary', 'Business Income',
  'Gift/Remittance', 'Susu Payout', 'Investment/Interest', 'Other Income', 'Other Expense'
];

export const StatementReviewGrid: React.FC<StatementReviewGridProps> = ({
  preview,
  accounts,
  onCommit,
  onCancel,
  loading,
}) => {
  const [rows, setRows] = useState<CSVPreviewRow[]>(preview.rows);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(preview.rows.map((_, i) => i))
  );
  const [bulkAccount, setBulkAccount] = useState<string>(accounts[0]?.id || '');
  const [bulkCategory, setBulkCategory] = useState<string>('Food');

  const updateRow = (index: number, field: keyof CSVPreviewRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleSelectRow = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === rows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(rows.map((_, i) => i)));
    }
  };

  const applyBulkAccount = () => {
    if (!bulkAccount) return;
    const accObj = accounts.find((a) => a.id === bulkAccount);
    setRows((prev) =>
      prev.map((r, i) =>
        selectedIndices.has(i)
          ? { ...r, account_id: bulkAccount, account_name: accObj?.name || null }
          : r
      )
    );
  };

  const applyBulkCategory = () => {
    setRows((prev) =>
      prev.map((r, i) =>
        selectedIndices.has(i) ? { ...r, category: bulkCategory } : r
      )
    );
  };

  const handleCommit = async () => {
    const validSelectedRows = rows.filter((r, i) => selectedIndices.has(i) && r.is_valid && r.amount > 0);
    if (validSelectedRows.length === 0) {
      alert('Please select at least one valid row to commit.');
      return;
    }

    const payloadRows: CSVCommitRow[] = validSelectedRows.map((r) => ({
      date: r.date,
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      category: r.category,
      account_id: r.account_id || accounts[0]?.id || '',
    }));

    await onCommit(preview.filename, payloadRows);
  };

  // Summary Metrics
  const activeRows = rows.filter((_, i) => selectedIndices.has(i));
  const totalInflow = activeRows
    .filter((r) => r.type === 'Income')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalOutflow = activeRows
    .filter((r) => r.type === 'Expense')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header Banner & Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Review Statement Entries</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {preview.detected_format}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirm or edit inferred categories and accounts before committing to your ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={loading || activeRows.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/50 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : `Commit ${activeRows.length} Rows to Ledger`}</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Selected Rows</span>
            <p className="text-sm font-bold text-white">{activeRows.length} / {rows.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 text-emerald-400">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Inflow</span>
            <p className="text-sm font-bold">{formatGHS(totalInflow)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 text-rose-400">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Outflow</span>
            <p className="text-sm font-bold">{formatGHS(totalOutflow)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Net Flow</span>
            <p className={`text-sm font-bold ${totalInflow - totalOutflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatGHS(totalInflow - totalOutflow)}
            </p>
          </div>
        </div>

        {/* Bulk Editing Tools */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Bulk Actions:</span>
          
          <button
            type="button"
            onClick={toggleSelectAll}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium"
          >
            {selectedIndices.size === rows.length ? 'Deselect All' : 'Select All'}
          </button>

          <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
            <select
              value={bulkAccount}
              onChange={(e) => setBulkAccount(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 text-white text-xs"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyBulkAccount}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700 text-xs font-semibold"
            >
              Set Account
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 text-white text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyBulkCategory}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700 text-xs font-semibold"
            >
              Set Category
            </button>
          </div>
        </div>
      </div>

      {/* Editable Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-850 text-[11px] font-semibold text-slate-400 uppercase tracking-wider z-10">
              <tr className="border-b border-slate-800">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIndices.size === rows.length && rows.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-3 w-28">Date</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 w-28 text-right">Amount (₵)</th>
                <th className="py-3 px-3 w-24">Type</th>
                <th className="py-3 px-3 w-40">Category</th>
                <th className="py-3 px-3 w-44">Target Account</th>
                <th className="py-3 px-3 w-20 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {rows.map((row, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isIncome = row.type === 'Income';

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-850/60 transition-colors ${
                      !row.is_valid
                        ? 'bg-rose-950/20'
                        : isSelected
                        ? 'bg-slate-900'
                        : 'opacity-50 bg-slate-950'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(idx)}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                    </td>

                    {/* Date input */}
                    <td className="py-2 px-3">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateRow(idx, 'date', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-850 border border-slate-750 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </td>

                    {/* Description input */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    {/* Amount input */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.amount}
                        onChange={(e) => updateRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-850 border border-slate-750 text-right font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    {/* Type toggle */}
                    <td className="py-2 px-3">
                      <select
                        value={row.type}
                        onChange={(e) => updateRow(idx, 'type', e.target.value)}
                        className={`w-full px-2 py-1 rounded-lg border text-xs font-semibold focus:outline-none ${
                          isIncome
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                      </select>
                    </td>

                    {/* Category select */}
                    <td className="py-2 px-3">
                      <select
                        value={row.category}
                        onChange={(e) => updateRow(idx, 'category', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-850 border border-slate-750 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Account select */}
                    <td className="py-2 px-3">
                      <select
                        value={row.account_id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const acc = accounts.find((a) => a.id === val);
                          updateRow(idx, 'account_id', val);
                          updateRow(idx, 'account_name', acc?.name || null);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-slate-850 border border-slate-750 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status icon */}
                    <td className="py-2 px-3 text-center">
                      {row.is_valid ? (
                        <span title="Ready to import" className="inline-flex text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span title={row.validation_error || 'Invalid row'} className="inline-flex text-rose-400">
                          <AlertCircle className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
