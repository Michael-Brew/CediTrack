import React, { useState, useEffect } from 'react';
import { Plus, ArrowRightLeft, Wallet, Smartphone, Landmark, Banknote } from 'lucide-react';
import { Account, CreateAccountPayload, TransferPayload, accountsApi } from '../api/accounts';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountModal } from '../components/accounts/AccountModal';
import { TransferModal } from '../components/accounts/TransferModal';
import { formatGHS } from '../lib/formatters';

interface AccountsPageProps {
  onRefreshParent?: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onRefreshParent }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferFromAccount, setTransferFromAccount] = useState<Account | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsApi.list();
      setAccounts(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSaveAccount = async (payload: CreateAccountPayload) => {
    if (editingAccount) {
      await accountsApi.update(editingAccount.id, payload);
    } else {
      await accountsApi.create(payload);
    }
    await loadAccounts();
    onRefreshParent?.();
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account? All associated transactions will also be deleted.')) {
      return;
    }
    try {
      await accountsApi.delete(id);
      await loadAccounts();
      onRefreshParent?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const handleTransfer = async (payload: TransferPayload) => {
    await accountsApi.transfer(payload);
    await loadAccounts();
    onRefreshParent?.();
  };

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Liquidity</span>
          <h3 className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{formatGHS(totalBalance)}</h3>
          <p className="text-xs text-slate-400 mt-1">Across {accounts.length} Wallets & Accounts</p>
        </div>

        <div className="flex items-center gap-2.5">
          {accounts.length >= 2 && (
            <button
              onClick={() => {
                setTransferFromAccount(null);
                setTransferOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Transfer Funds</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingAccount(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      {loading && accounts.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Loading accounts...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">No Accounts Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Add your MTN MoMo wallet, Telecel Cash, GCB bank account, or shop cash till to begin tracking.
          </p>
          <button
            onClick={() => {
              setEditingAccount(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            Create Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onEdit={(a) => {
                setEditingAccount(a);
                setModalOpen(true);
              }}
              onDelete={handleDeleteAccount}
              onTransfer={(a) => {
                setTransferFromAccount(a);
                setTransferOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAccount}
        accountToEdit={editingAccount}
      />

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        onTransfer={handleTransfer}
        accounts={accounts}
        initialFromAccount={transferFromAccount}
      />
    </div>
  );
};
