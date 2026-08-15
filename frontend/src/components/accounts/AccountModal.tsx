import React, { useState, useEffect } from 'react';
import { X, Smartphone, Landmark, Banknote, Sparkles } from 'lucide-react';
import { Account, CreateAccountPayload } from '../../api/accounts';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateAccountPayload) => Promise<void>;
  accountToEdit?: Account | null;
}

const GH_PRESETS = [
  { name: 'MTN MoMo', type: 'mobile_money', color: '#F59E0B' },
  { name: 'Telecel Cash', type: 'mobile_money', color: '#EF4444' },
  { name: 'AT Money', type: 'mobile_money', color: '#3B82F6' },
  { name: 'GCB Bank', type: 'bank', color: '#0284C7' },
  { name: 'Ecobank Ghana', type: 'bank', color: '#059669' },
  { name: 'Stanbic Bank', type: 'bank', color: '#6366F1' },
  { name: 'Fidelity Bank', type: 'bank', color: '#F97316' },
  { name: 'Absa Bank', type: 'bank', color: '#DC2626' },
  { name: 'CalBank', type: 'bank', color: '#D97706' },
  { name: 'Shop Cash Till', type: 'cash', color: '#10B981' },
  { name: 'Susu Savings Box', type: 'cash', color: '#8B5CF6' },
];

const COLORS = [
  '#10B981', '#059669', '#F59E0B', '#D97706', '#EF4444',
  '#3B82F6', '#0284C7', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'mobile_money' | 'bank' | 'cash' | 'other'>('mobile_money');
  const [initialBalance, setInitialBalance] = useState('0.00');
  const [color, setColor] = useState('#10B981');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setInitialBalance(String(accountToEdit.initial_balance));
      setColor(accountToEdit.color || '#10B981');
    } else {
      setName('');
      setType('mobile_money');
      setInitialBalance('0.00');
      setColor('#10B981');
    }
    setError(null);
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    const initAmt = parseFloat(initialBalance);
    if (isNaN(initAmt) || initAmt < 0) {
      setError('Initial balance must be a valid positive number');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        type,
        initial_balance: initAmt,
        color,
        currency: 'GHS',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (preset: typeof GH_PRESETS[0]) => {
    setName(preset.name);
    setType(preset.type as any);
    setColor(preset.color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {accountToEdit ? 'Edit Account' : 'Add New Account / Wallet'}
            </h3>
            <p className="text-xs text-slate-400">
              Track balances across MoMo, Ghanaian Banks, and Cash Tills
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        {!accountToEdit && (
          <div className="px-5 pt-4 pb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Ghana Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {GH_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => selectPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MTN MoMo, GCB Salary Account, Shop Cash Till"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="mobile_money">Mobile Money (MoMo)</option>
                <option value="bank">Bank Account</option>
                <option value="cash">Cash / Shop Till</option>
                <option value="other">Other Account</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Balance (₵)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Account Badge Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
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
              {loading ? 'Saving...' : accountToEdit ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
