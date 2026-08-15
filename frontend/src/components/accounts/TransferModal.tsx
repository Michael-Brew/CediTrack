import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { Account, TransferPayload } from '../../api/accounts';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (payload: TransferPayload) => Promise<void>;
  accounts: Account[];
  initialFromAccount?: Account | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onTransfer,
  accounts,
  initialFromAccount
}) => {
  const [fromAccountId, setFromAccountId] = useState(initialFromAccount?.id || (accounts[0]?.id ?? ''));
  const [toAccountId, setToAccountId] = useState(
    accounts.find(a => a.id !== (initialFromAccount?.id || accounts[0]?.id))?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('Account Transfer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      setError('Source and Destination accounts must be different');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid transfer amount greater than ₵0.00');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onTransfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: amt,
        date,
        description: description.trim() || 'Account Transfer',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Transfer Funds</h3>
              <p className="text-xs text-slate-400">Move money between your wallets and accounts</p>
            </div>
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

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                From Account (Debit)
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (₵{acc.current_balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                To Account (Credit)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (₵{acc.current_balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount (₵) *
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
                Date
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Memo / Note
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. MoMo Cashout to Cash, Susu deposit"
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
              {loading ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
