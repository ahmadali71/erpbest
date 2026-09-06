import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/Dashboard/DashboardView';
import { InventoryView } from './components/Inventory/InventoryView';
import { SalesView } from './components/Sales/SalesView';
import { ClientsView } from './components/Clients/ClientsView';
import { PaymentsView } from './components/Payments/PaymentsView';
import { ExpensesView } from './components/Expenses/ExpensesView';
import { ReportsView } from './components/Reports/ReportsView';
import { StockMovementLogs } from './components/Inventory/StockMovementLogs';
import { POSTerminalView } from './components/POS/POSTerminalView';
import { QuotationsView } from './components/Quotations/QuotationsView';
import { SuppliersView } from './components/Suppliers/SuppliersView';
import { ReturnsView } from './components/Returns/ReturnsView';
import { SettingsView } from './components/Settings/SettingsView';
import { LiveActivityDrawer } from './components/RealTime/LiveActivityDrawer';
import { LoginPage } from './components/Auth/LoginPage';

// Modals
import { NewSaleModal } from './components/Modals/NewSaleModal';
import { InvoiceDetailsModal } from './components/Modals/InvoiceDetailsModal';
import { ProcessReturnModal } from './components/Modals/ProcessReturnModal';
import { ProductModal } from './components/Modals/ProductModal';
import { RestockModal } from './components/Modals/RestockModal';
import { ClientModal } from './components/Modals/ClientModal';
import { ClientLedgerModal } from './components/Modals/ClientLedgerModal';
import { RecordPaymentModal } from './components/Modals/RecordPaymentModal';
import { ExpenseModal } from './components/Modals/ExpenseModal';
import { CategoriesModal } from './components/Modals/CategoriesModal';

import { Client, Product, SaleInvoice } from './types/erp';

const ThemeApplier: React.FC = () => {
  const { settings } = useERP();
  useEffect(() => {
    const root = document.documentElement;
    const accentMap: Record<string, string> = {
      indigo: '#4f46e5',
      emerald: '#10b981',
      violet: '#8b5cf6',
      rose: '#f43f5e',
      amber: '#f59e0b',
      slate: '#64748b',
      cyan: '#06b6d4',
    };
    const color = accentMap[settings.themeAccent] || accentMap.indigo;
    root.style.setProperty('--accent-color', color);
    root.style.setProperty('--accent-color-light', `${color}1a`);
    root.style.setProperty('--accent-color-dark', `${color}cc`);
  }, [settings.themeAccent]);
  return null;
};

const MainAppContent: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { sales } = useERP();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [newSaleInitialClientId, setNewSaleInitialClientId] = useState<string | undefined>();

  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);

  const [isProcessReturnOpen, setIsProcessReturnOpen] = useState(false);
  const [processReturnInvoiceId, setProcessReturnInvoiceId] = useState<string | undefined>();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState<string | undefined>();

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [selectedLedgerClient, setSelectedLedgerClient] = useState<Client | null>(null);
  const [isClientLedgerOpen, setIsClientLedgerOpen] = useState(false);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<SaleInvoice | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState(false);

  // Handlers
  const handleOpenNewSale = (clientId?: string) => {
    setNewSaleInitialClientId(clientId);
    setIsNewSaleOpen(true);
  };

  const handleOpenInvoiceDetails = (invoice: SaleInvoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDetailsOpen(true);
  };

  const handleOpenProcessReturn = (invoiceId?: string) => {
    setProcessReturnInvoiceId(invoiceId);
    setIsProcessReturnOpen(true);
  };

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenRestock = (productId?: string) => {
    setRestockProductId(productId);
    setIsRestockOpen(true);
  };

  const handleOpenAddClient = () => {
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  const handleOpenClientLedger = (client: Client) => {
    setSelectedLedgerClient(client);
    setIsClientLedgerOpen(true);
  };

  const handleOpenRecordPayment = (invoice: SaleInvoice) => {
    setPaymentInvoice(invoice);
    setIsRecordPaymentOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--accent-color)] border-t-transparent mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <ThemeApplier />
      <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden select-none">
      {/* Navigation Sidebar with Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogout={logout}
        user={user}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <Header
          onOpenNewSale={() => handleOpenNewSale()}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenRestock={() => handleOpenRestock()}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onOpenLiveFeed={() => setIsLiveFeedOpen(true)}
          user={user}
          onLogout={logout}
        />

        {/* Dynamic Content Pane with bottom padding on mobile for MobileBottomNav */}
        <div className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto pb-20 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectInvoice={handleOpenInvoiceDetails}
              onNavigateTab={setActiveTab}
              onOpenNewSale={() => handleOpenNewSale()}
              onOpenRestockProduct={handleOpenRestock}
            />
          )}

          {activeTab === 'pos' && (
            <POSTerminalView />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              onOpenAddProduct={handleOpenAddProduct}
              onOpenEditProduct={handleOpenEditProduct}
              onOpenRestock={handleOpenRestock}
              onOpenManageCategories={() => setIsCategoriesModalOpen(true)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              onOpenNewSale={() => handleOpenNewSale()}
              onSelectInvoice={handleOpenInvoiceDetails}
              onOpenRecordPayment={handleOpenRecordPayment}
            />
          )}

          {activeTab === 'returns' && (
            <ReturnsView
              onOpenProcessReturn={() => handleOpenProcessReturn()}
              onSelectInvoice={(invId) => {
                const inv = sales.find(s => s.id === invId);
                if (inv) handleOpenInvoiceDetails(inv);
              }}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView onSelectInvoice={handleOpenInvoiceDetails} />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              onOpenAddClient={handleOpenAddClient}
              onOpenEditClient={handleOpenEditClient}
              onSelectClientLedger={handleOpenClientLedger}
              onOpenNewSaleForClient={(client) => handleOpenNewSale(client.id)}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              onOpenRecordPayment={handleOpenRecordPayment}
              onSelectInvoice={handleOpenInvoiceDetails}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView onOpenAddExpense={() => setIsExpenseModalOpen(true)} />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'stock_logs' && <StockMovementLogs />}

          {activeTab === 'settings' && <SettingsView />}
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />
      </main>
    </div>

      {/* Live Activity Drawer */}
      <LiveActivityDrawer
        isOpen={isLiveFeedOpen}
        onClose={() => setIsLiveFeedOpen(false)}
      />

      {/* Interactive Application Modals */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        initialClientId={newSaleInitialClientId}
        onOpenAddClient={handleOpenAddClient}
      />

      <InvoiceDetailsModal
        isOpen={isInvoiceDetailsOpen}
        onClose={() => setIsInvoiceDetailsOpen(false)}
        invoice={selectedInvoice}
        onOpenRecordPayment={handleOpenRecordPayment}
      />

      <ProcessReturnModal
        isOpen={isProcessReturnOpen}
        onClose={() => setIsProcessReturnOpen(false)}
        initialInvoiceId={processReturnInvoiceId}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
      />

      <RestockModal
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        productId={restockProductId}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clientToEdit={clientToEdit}
      />

      <ClientLedgerModal
        isOpen={isClientLedgerOpen}
        onClose={() => setIsClientLedgerOpen(false)}
        client={selectedLedgerClient}
        onSelectInvoice={handleOpenInvoiceDetails}
        onOpenNewSale={(client) => handleOpenNewSale(client.id)}
        onOpenRecordPayment={handleOpenRecordPayment}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        invoice={paymentInvoice}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </>
  );
};

  const App: React.FC = () => {
  return (
    <ERPProvider>
      <MainAppContent />
    </ERPProvider>
  );
};

export default App;
