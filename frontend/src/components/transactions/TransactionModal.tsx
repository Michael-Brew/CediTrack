import React, { useState, useEffect } from 'react';
import { X, Sparkles, Tag, AlertCircle } from 'lucide-react';
import { Account } from '../../api/accounts';
import { Transaction, CreateTransactionPayload, transactionsApi } from '../../api/transactions';
import { getCategoryColor } from '../../lib/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateTransactionPayload) => Promise<void>;
  accounts: Account[];
  transactionToEdit?: Transaction | null;
}

const CATEGORIES = [
  'Transport', 'Food', 'MoMo/Airtime', 'Data Bundle', 'Rent', 'Bills',
  'Susu/Savings', 'Entertainment', 'Personal Care', 'Inventory/Supplies',
  'Logistics/Delivery', 'Marketing', 'Salary', 'Business Income',
  'Gift/Remittance', 'Susu Payout', 'Investment/Interest', 'Other Income', 'Other Expense'
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  transactionToEdit
}) => {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [category, setCategory] = useState('Food');
  const [referenceId, setReferenceId] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setAccountId(transactionToEdit.account_id);
      setDate(transactionToEdit.date);
      setDescription(transactionToEdit.description);
      setAmount(String(transactionToEdit.amount));
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setReferenceId(transactionToEdit.reference_id || '');
      setSuggestedCategory(null);
    } else {
      setAccountId(accounts[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setAmount('');
      setType('Expense');
      setCategory('Food');
      setReferenceId('');
      setSuggestedCategory(null);
    }
    setError(null);
  }, [transactionToEdit, isOpen, accounts]);

  // Real-time categorization auto-suggestion as user types
  useEffect(() => {
    if (!description.trim() || transactionToEdit) return;

    const timer = setTimeout(async () => {
      try {
        const res = await transactionsApi.categorizePreview(description, type);
        if (res && res.category) {
          setSuggestedCategory(res.category);
          // Auto-apply if default
          if (category === 'Food' || category === 'Other Expense' || category === 'Other Income') {
            setCategory(res.category);
          }
        }
      } catch {
        // silent
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [description, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Amount must be greater than ₵0.00');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        account_id: accountId,
        date,
        description: description.trim(),
        amount: numAmt,
        type,
        category,
        reference_id: referenceId.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="text-xs text-slate-400">
              Manual entry with intelligent Ghanaian categorization
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-850 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('Expense');
                if (category === 'Salary' || category === 'Business Income' || category === 'Gift/Remittance') {
                  setCategory('Food');
                }
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'Expense'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense (Money Out)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('Income');
                if (category === 'Food' || category === 'Transport' || category === 'Bills') {
                  setCategory('Business Income');
                }
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'Income'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income (Money In)
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Description / Narration *
              </label>
              {suggestedCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium animate-fade-in">
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-detected: <strong>{suggestedCategory}</strong></span>
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Waakye at Auntie Muni, Trotro Circle, Makola Restock, GCB Salary"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount (₵ GHS) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account / Wallet *
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reference / Transaction ID (Optional)
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. TXN984210, Receipt #04"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : transactionToEdit ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
