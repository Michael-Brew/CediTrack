import React, { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { Transaction, TransactionFilters, CreateTransactionPayload, transactionsApi } from '../api/transactions';
import { Account, accountsApi } from '../api/accounts';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { TransactionFilterBar } from '../components/transactions/TransactionFilterBar';
import { TransactionModal } from '../components/transactions/TransactionModal';

interface TransactionsPageProps {
  onRefreshParent?: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ onRefreshParent }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txnsRes, accsRes] = await Promise.all([
        transactionsApi.list(filters),
        accountsApi.list(),
      ]);
      setTransactions(txnsRes);
      setAccounts(accsRes);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleSaveTransaction = async (payload: CreateTransactionPayload) => {
    if (editingTxn) {
      await transactionsApi.update(editingTxn.id, payload);
    } else {
      await transactionsApi.create(payload);
    }
    await loadData();
    onRefreshParent?.();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await transactionsApi.delete(id);
      await loadData();
      onRefreshParent?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const handleDismissAnomaly = async (id: string) => {
    try {
      await transactionsApi.dismissAnomaly(id);
      await loadData();
      onRefreshParent?.();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss anomaly');
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    const headers = ['Date', 'Description', 'Amount (GHS)', 'Type', 'Category', 'Account', 'Anomaly Flag', 'Reference'];
    const csvRows = [
      headers.join(','),
      ...transactions.map((t) => [
        `"${t.date}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        `"${t.type}"`,
        `"${t.category}"`,
        `"${t.account_name || ''}"`,
        t.is_flagged_anomaly ? 'YES' : 'NO',
        `"${t.reference_id || ''}"`,
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `ceditrack_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ledger & Transaction History</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {transactions.length} record{transactions.length === 1 ? '' : 's'} found
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingTxn(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <TransactionFilterBar
        filters={filters}
        onFilterChange={setFilters}
        accounts={accounts}
        onReset={() => setFilters({})}
      />

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactions}
        onEdit={(t) => {
          setEditingTxn(t);
          setModalOpen(true);
        }}
        onDelete={handleDeleteTransaction}
        onDismissAnomaly={handleDismissAnomaly}
        loading={loading}
      />

      {/* Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTransaction}
        accounts={accounts}
        transactionToEdit={editingTxn}
      />
    </div>
  );
};
