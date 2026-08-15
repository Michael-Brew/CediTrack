import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { UploadPage } from './pages/UploadPage';
import { AnomalyPage } from './pages/AnomalyPage';
import { AuthPage } from './pages/AuthPage';
import { TransactionModal } from './components/transactions/TransactionModal';
import { TransferModal } from './components/accounts/TransferModal';
import { Account, accountsApi } from './api/accounts';
import { CreateTransactionPayload, transactionsApi } from './api/transactions';
import { dashboardApi } from './api/dashboard';

const MainAppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    if (user) {
      accountsApi.list().then(setAccounts).catch(console.error);
    }
  }, [user, refreshKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSeedDemoData = async () => {
    try {
      setSeeding(true);
      const res = await dashboardApi.seedDemoData();
      showToast(`🇬🇭 ${res.message} (${res.flagged_anomalies_count} 30-day high-expense alerts detected)`);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to seed sample data');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateTransaction = async (payload: CreateTransactionPayload) => {
    await transactionsApi.create(payload);
    showToast('Transaction saved successfully');
    triggerRefresh();
  };

  const handleTransferFunds = async (payload: any) => {
    await accountsApi.transfer(payload);
    showToast('Funds transferred successfully');
    triggerRefresh();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Initializing CediTrack...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onOpenAddTransaction={() => setAddTxnOpen(true)}
          onSeedData={handleSeedDemoData}
          seeding={seeding}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <div className="relative w-64 bg-slate-900 h-full z-50">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              onOpenAddTransaction={() => {
                setAddTxnOpen(true);
                setMobileMenuOpen(false);
              }}
              onSeedData={handleSeedDemoData}
              seeding={seeding}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAddTransaction={() => setAddTxnOpen(true)}
          onSeedData={handleSeedDemoData}
          seeding={seeding}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto" key={refreshKey}>
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAddTransaction={() => setAddTxnOpen(true)}
              onOpenTransfer={() => setTransferOpen(true)}
              onSeedData={handleSeedDemoData}
              seeding={seeding}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsPage onRefreshParent={triggerRefresh} />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage onRefreshParent={triggerRefresh} />
          )}

          {currentTab === 'upload' && (
            <UploadPage
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRefreshParent={triggerRefresh}
            />
          )}

          {currentTab === 'anomalies' && (
            <AnomalyPage onRefreshParent={triggerRefresh} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={addTxnOpen}
        onClose={() => setAddTxnOpen(false)}
        onSave={handleCreateTransaction}
        accounts={accounts}
      />

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        onTransfer={handleTransferFunds}
        accounts={accounts}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
