import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react';
import {
  Category,
  Client,
  CompanySettings,
  Expense,
  PaymentMethod,
  PaymentStatus,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  Quotation,
  QuotationItem,
  RealTimeActivity,
  SaleInvoice,
  SaleItem,
  SaleReturn,
  StockMovement,
  Supplier,
  ThemeAccent,
  TimeRange,
} from '../types/erp';
import { api, API_BASE_URL } from '../services/api';
import { useAuth } from './AuthContext';

interface SaleCreationInput {
  clientId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitSellingPrice?: number;
    discountPercentage?: number;
  }>;
  taxRate?: number;
  paymentMethod: PaymentMethod;
  initialAmountPaid?: number;
  notes?: string;
  dueDate?: string;
}

interface PurchaseOrderCreationInput {
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
  expectedDeliveryDate?: string;
  notes?: string;
}

interface QuotationCreationInput {
  clientId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    discountPercentage?: number;
  }>;
  taxRate?: number;
  validUntil?: string;
  notes?: string;
}

interface ERPContextType {
  products: Product[];
  categories: Category[];
  clients: Client[];
  sales: SaleInvoice[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  quotations: Quotation[];
  returns: SaleReturn[];
  settings: CompanySettings;
  isLoading: boolean;
  serverStatus: 'connected' | 'offline';
  
  // Real-Time & Live Multi-User State
  activeTerminals: number;
  lastSynced: string;
  activities: RealTimeActivity[];
  activeToast: RealTimeActivity | null;
  soundEnabled: boolean;
  toggleSound: () => void;
  clearActivities: () => void;
  dismissToast: () => void;

  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string, permanent?: boolean) => Promise<void>;
  restoreProduct: (id: string) => Promise<void>;
  restockProduct: (productId: string, quantity: number, unitCost?: number, notes?: string, supplierName?: string) => Promise<void>;
  adjustStock: (productId: string, newStock: number, reason: string) => Promise<void>;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Client actions
  addClient: (client: Omit<Client, 'id' | 'totalSpent' | 'outstandingBalance' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string, permanent?: boolean) => Promise<void>;
  restoreClient: (id: string) => Promise<void>;

  // Sales actions
  createSale: (input: SaleCreationInput) => Promise<SaleInvoice | null>;
  recordPayment: (saleId: string, amount: number, method: PaymentMethod, note?: string) => Promise<void>;
  deleteSale: (saleId: string, permanent?: boolean) => Promise<void>;
  restoreSale: (saleId: string) => Promise<void>;

  // Returns & Refunds
  processReturn: (data: {
    invoiceId: string;
    items: Array<{
      productId: string;
      quantity: number;
      reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE_OF_MIND' | 'DAMAGED' | 'OTHER';
      restockItem: boolean;
    }>;
    restockingFee?: number;
    refundMethod: 'CASH' | 'CARD' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    notes?: string;
  }) => Promise<SaleReturn | null>;

  // Settings
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  formatCurrency: (amount: number) => string;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchased' | 'createdAt'>) => Promise<Supplier | null>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Purchase Order actions
  createPurchaseOrder: (input: PurchaseOrderCreationInput) => Promise<PurchaseOrder | null>;
  updatePurchaseOrderStatus: (id: string, status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED') => Promise<void>;
  receivePurchaseOrder: (id: string) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;

  // Quotation actions
  createQuotation: (input: QuotationCreationInput) => Promise<Quotation | null>;
  updateQuotationStatus: (id: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED') => Promise<void>;
  convertQuotationToInvoice: (id: string) => Promise<SaleInvoice | null>;
  deleteQuotation: (id: string) => Promise<void>;

  // Backup & Restore
  restoreDatabase: (backupData: any) => Promise<void>;
  exportBackup: () => void;
  resetToEmptyDatabase: () => Promise<void>;

  // Financial & Inventory computed metrics
  totalRevenue: number;
  totalCollected: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalPendingReceivables: number;
  totalAccountsPayable: number;
  inventoryCostValue: number;
  inventoryRetailValue: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  pendingQuotationsCount: number;
  orderedPOCount: number;

  // Time-based aggregation helper for charts
  getFinancialPerformanceData: (timeRange: TimeRange) => Array<{
    label: string;
    revenue: number;
    cost: number;
    expenses: number;
    profit: number;
  }>;

  // Utilities
  resetToDemoData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

// Web Audio synthesizer for unobtrusive polite live notifications
function playLiveChime(type: 'success' | 'alert' | 'info') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'alert') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Silent fail if AudioContext is restricted before user gesture
  }
}

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('erp_settings');
    return saved ? JSON.parse(saved) : {
      companyName: '',
      tagline: '',
      email: '',
      phone: '',
      address: '',
      taxRegistrationNumber: '',
      taxNumber: '',
      website: '',
      currencySymbol: '$',
      currencyCode: 'USD',
      defaultTaxRate: 5.0,
      defaultPaymentTermsDays: 30,
      defaultLowStockThreshold: 5,
      stockAlertThreshold: 3,
      invoicePrefix: 'INV-',
      quotePrefix: 'QT-',
      receiptHeader: 'Thank you for choosing Nexus Enterprise!',
      receiptFooter: 'Goods once sold can be returned within 30 days with original invoice.',
      receiptHeaderMessage: 'Thank you for shopping at Nexus Enterprise!',
      receiptFooterMessage: 'Returns accepted within 30 days with valid receipt.',
      showBarcodeOnReceipt: true,
      showTaxBreakdown: true,
      autoPrintReceipt: false,
      compactMode: false,
      themeAccent: 'indigo',
      enableSoundEffects: true,
      enableAutoPrintReceipt: false,
      barcodeLabelConfig: {
        labelSize: '50x25',
        showPrice: true,
        showSku: true,
        showProductName: true,
        showCompanyName: true,
        barcodeType: 'CODE128',
      },
    };
  });

  const initialProducts: Product[] = [];
  const initialCategories: Category[] = [];
  const initialClients: Client[] = [];
  const initialSales: SaleInvoice[] = [];
  const initialExpenses: Expense[] = [];
  const initialStockMovements: StockMovement[] = [];
  const initialSuppliers: Supplier[] = [];
  const initialPurchaseOrders: PurchaseOrder[] = [];
  const initialQuotations: Quotation[] = [];
  const initialReturns: SaleReturn[] = [];
  const initialSettings: CompanySettings = settings;

  useEffect(() => {
    localStorage.setItem('erp_settings', JSON.stringify(settings));
  }, [settings]);

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverStatus, setServerStatus] = useState<'connected' | 'offline'>('connected');

  // Real-Time Live Feed & Presence State
  const [activeTerminals, setActiveTerminals] = useState<number>(1);
  const [lastSynced, setLastSynced] = useState<string>('Just now');
  const [activities, setActivities] = useState<RealTimeActivity[]>([]);
  const [activeToast, setActiveToast] = useState<RealTimeActivity | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('erp_sound_enabled') !== 'false';
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('erp_sound_enabled', String(next));
      return next;
    });
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const pushActivity = useCallback((activity: Omit<RealTimeActivity, 'id' | 'timestamp'>) => {
    const fullActivity: RealTimeActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setActivities(prev => [fullActivity, ...prev.slice(0, 49)]); // keep latest 50
    setActiveToast(fullActivity);
    setLastSynced('Just now');

    // Auto dismiss toast after 4.5 seconds
    setTimeout(() => {
      setActiveToast(current => (current?.id === fullActivity.id ? null : current));
    }, 4500);

    // Audio chime if enabled
    if (soundEnabled) {
      if (activity.type === 'SALE_CREATED' || activity.type === 'PO_RECEIVED' || activity.type === 'QUOTATION_CONVERTED') {
        playLiveChime('success');
      } else if (activity.type === 'STOCK_ADJUSTED' || activity.type === 'RETURN_PROCESSED' || activity.type === 'DB_RESET') {
        playLiveChime('alert');
      } else {
        playLiveChime('info');
      }
    }
  }, [soundEnabled]);

  // Load from backend on mount or when authenticated
  const refreshData = useCallback(async () => {
    // Only fetch data if user is authenticated (has token)
    const currentToken = token || localStorage.getItem('erp_token');
    if (!currentToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const data = await api.getBootstrapData();
      if (data) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setClients(data.clients || []);
        setSales(data.sales || []);
        setExpenses(data.expenses || []);
        setStockMovements(data.stockMovements || []);
        setSuppliers(data.suppliers || []);
        setPurchaseOrders(data.purchaseOrders || []);
        setQuotations(data.quotations || []);
        if (data.returns) setReturns(data.returns);
        if (data.settings) setSettings(data.settings);
        if (data.activeTerminals) {
          setActiveTerminals(data.activeTerminals);
        }
        setServerStatus('connected');
        setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      try {
        const serverSettings = await api.getSettings();
        if (serverSettings) {
          setSettings(serverSettings);
        }
      } catch {
        // Settings fetch is optional — bootstrap already provides them
      }
    } catch (err) {
      console.warn('Backend offline or initializing, using local cache:', err);
      setServerStatus('offline');
      // Don't force redirect on 401 here — let AuthContext handle session expiry
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Dynamic load when authenticated or when auth token becomes available
  useEffect(() => {
    if (isAuthenticated || token || localStorage.getItem('erp_token')) {
      refreshData();
    }
  }, [isAuthenticated, token, refreshData]);

  // ==========================================
  // REAL-TIME EVENT STREAM (SERVER-SENT EVENTS)
  // ==========================================
  useEffect(() => {
    const activeToken = token || localStorage.getItem('erp_token');
    if (!isAuthenticated && !activeToken) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      // Only connect SSE when user is authenticated
      const sseToken = token || localStorage.getItem('erp_token');
      if (!sseToken) return;

      try {
        // Pass token via query param since EventSource API cannot send custom headers
        eventSource = new EventSource(`${API_BASE_URL}/api/events?token=${encodeURIComponent(sseToken)}`);

        eventSource.addEventListener('connected', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setServerStatus('connected');
            if (data.activeConnections) {
              setActiveTerminals(data.activeConnections);
            }
          } catch {}
        });

        eventSource.addEventListener('ping', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setServerStatus('connected');
            if (data.activeConnections) {
              setActiveTerminals(data.activeConnections);
            }
          } catch {}
        });

        eventSource.addEventListener('erp_event', (e: MessageEvent) => {
          try {
            const eventObj = JSON.parse(e.data);
            const { type, payload } = eventObj;
            setServerStatus('connected');
            setLastSynced('Just now');

            switch (type) {
              case 'PRESENCE_UPDATED':
                if (payload?.activeConnections) {
                  setActiveTerminals(payload.activeConnections);
                }
                break;

              case 'SALE_CREATED':
                if (payload?.invoice) {
                  setSales(prev => [payload.invoice, ...prev.filter(s => s.id !== payload.invoice.id)]);
                }
                if (payload?.products) setProducts(payload.products);
                if (payload?.clients) setClients(payload.clients);
                if (payload?.stockMovements) setStockMovements(payload.stockMovements);
                pushActivity({
                  type: 'SALE_CREATED',
                  title: `New Sale ${payload.invoice?.invoiceNumber || ''}`,
                  description: `$${payload.invoice?.grandTotal?.toFixed(2)} • ${payload.invoice?.clientName}`,
                  badgeColor: 'bg-emerald-500',
                  iconType: 'sale',
                });
                break;

              case 'SALE_DELETED':
                if (payload?.saleId) {
                  setSales(prev => prev.filter(s => s.id !== payload.saleId));
                }
                if (payload?.products) setProducts(payload.products);
                if (payload?.clients) setClients(payload.clients);
                if (payload?.stockMovements) setStockMovements(payload.stockMovements);
                break;

              case 'PAYMENT_RECORDED':
                if (payload?.sale) {
                  setSales(prev => prev.map(s => (s.id === payload.sale.id ? payload.sale : s)));
                }
                if (payload?.client) {
                  setClients(prev => prev.map(c => (c.id === payload.client.id ? payload.client : c)));
                }
                pushActivity({
                  type: 'PAYMENT_RECORDED',
                  title: 'Payment Received',
                  description: payload.message || `Payment recorded for ${payload.sale?.invoiceNumber}`,
                  badgeColor: 'bg-blue-500',
                  iconType: 'payment',
                });
                break;

              case 'STOCK_RESTOCKED':
                if (payload?.product) {
                  setProducts(prev => prev.map(p => (p.id === payload.product.id ? payload.product : p)));
                }
                if (payload?.movement) {
                  setStockMovements(prev => [payload.movement, ...prev]);
                }
                pushActivity({
                  type: 'STOCK_RESTOCKED',
                  title: 'Inventory Restocked',
                  description: payload.message || `${payload.product?.name} restocked`,
                  badgeColor: 'bg-[var(--accent-color)]',
                  iconType: 'stock',
                });
                break;

              case 'STOCK_ADJUSTED':
                if (payload?.product) {
                  setProducts(prev => prev.map(p => (p.id === payload.product.id ? payload.product : p)));
                }
                if (payload?.movement) {
                  setStockMovements(prev => [payload.movement, ...prev]);
                }
                pushActivity({
                  type: 'STOCK_ADJUSTED',
                  title: 'Stock Adjustment',
                  description: payload.message || `Stock adjusted for ${payload.product?.name}`,
                  badgeColor: 'bg-amber-500',
                  iconType: 'stock',
                });
                break;

              case 'PRODUCT_CREATED':
                if (payload?.product) {
                  setProducts(prev => [payload.product, ...prev.filter(p => p.id !== payload.product.id)]);
                  pushActivity({
                    type: 'PRODUCT_CREATED',
                    title: 'New Product Added',
                    description: `${payload.product.name} (${payload.product.sku}) added to catalog`,
                    badgeColor: 'bg-[var(--accent-color)]',
                    iconType: 'product',
                  });
                }
                break;

              case 'PRODUCT_UPDATED':
                if (payload?.product) {
                  setProducts(prev => prev.map(p => (p.id === payload.product.id ? payload.product : p)));
                }
                break;

              case 'PRODUCT_DELETED':
                if (payload?.productId) {
                  setProducts(prev => prev.filter(p => p.id !== payload.productId));
                }
                break;

              case 'EXPENSE_ADDED':
                if (payload?.expense) {
                  setExpenses(prev => [payload.expense, ...prev.filter(e => e.id !== payload.expense.id)]);
                  pushActivity({
                    type: 'EXPENSE_ADDED',
                    title: 'Expense Logged',
                    description: `${payload.expense.title} ($${payload.expense.amount.toFixed(2)})`,
                    badgeColor: 'bg-red-500',
                    iconType: 'expense',
                  });
                }
                break;

              case 'EXPENSE_DELETED':
                if (payload?.expenseId) {
                  setExpenses(prev => prev.filter(e => e.id !== payload.expenseId));
                }
                break;

              case 'CLIENT_CREATED':
                if (payload?.client) {
                  setClients(prev => [payload.client, ...prev.filter(c => c.id !== payload.client.id)]);
                }
                break;

              case 'CLIENT_UPDATED':
                if (payload?.client) {
                  setClients(prev => prev.map(c => (c.id === payload.client.id ? payload.client : c)));
                }
                break;

              case 'CLIENT_DELETED':
                if (payload?.clientId) {
                  setClients(prev => prev.filter(c => c.id !== payload.clientId));
                }
                break;

              case 'SUPPLIER_CREATED':
                if (payload?.supplier) {
                  setSuppliers(prev => [payload.supplier, ...prev.filter(s => s.id !== payload.supplier.id)]);
                }
                break;

              case 'SUPPLIER_UPDATED':
                if (payload?.supplier) {
                  setSuppliers(prev => prev.map(s => (s.id === payload.supplier.id ? payload.supplier : s)));
                }
                break;

              case 'SUPPLIER_DELETED':
                if (payload?.supplierId) {
                  setSuppliers(prev => prev.filter(s => s.id !== payload.supplierId));
                }
                break;

              case 'PO_CREATED':
                if (payload?.purchaseOrder) {
                  setPurchaseOrders(prev => [payload.purchaseOrder, ...prev.filter(po => po.id !== payload.purchaseOrder.id)]);
                  pushActivity({
                    type: 'PO_CREATED',
                    title: 'Purchase Order Issued',
                    description: payload.message || `PO #${payload.purchaseOrder.orderNumber}`,
                    badgeColor: 'bg-[var(--accent-color)]',
                    iconType: 'po',
                  });
                }
                break;

              case 'PO_UPDATED':
                if (payload?.purchaseOrder) {
                  setPurchaseOrders(prev => prev.map(po => (po.id === payload.purchaseOrder.id ? payload.purchaseOrder : po)));
                }
                break;

              case 'PO_RECEIVED':
                if (payload?.purchaseOrder) {
                  setPurchaseOrders(prev => prev.map(po => (po.id === payload.purchaseOrder.id ? payload.purchaseOrder : po)));
                }
                if (payload?.products) setProducts(payload.products);
                if (payload?.stockMovements) setStockMovements(payload.stockMovements);
                pushActivity({
                  type: 'PO_RECEIVED',
                  title: 'PO Stock Received',
                  description: payload.message || `Items added to inventory from PO #${payload.purchaseOrder?.orderNumber}`,
                  badgeColor: 'bg-emerald-500',
                  iconType: 'po',
                });
                break;

              case 'PO_DELETED':
                if (payload?.poId) {
                  setPurchaseOrders(prev => prev.filter(po => po.id !== payload.poId));
                }
                break;

              case 'QUOTATION_CREATED':
                if (payload?.quotation) {
                  setQuotations(prev => [payload.quotation, ...prev.filter(q => q.id !== payload.quotation.id)]);
                  pushActivity({
                    type: 'QUOTATION_CREATED',
                    title: 'Quotation Generated',
                    description: `${payload.quotation.quotationNumber} for ${payload.quotation.clientName}`,
                    badgeColor: 'bg-violet-500',
                    iconType: 'quote',
                  });
                }
                break;

              case 'QUOTATION_UPDATED':
                if (payload?.quotation) {
                  setQuotations(prev => prev.map(q => (q.id === payload.quotation.id ? payload.quotation : q)));
                }
                break;

              case 'QUOTATION_CONVERTED':
                if (payload?.quotation) {
                  setQuotations(prev => prev.map(q => (q.id === payload.quotation.id ? payload.quotation : q)));
                }
                if (payload?.invoice) {
                  setSales(prev => [payload.invoice, ...prev.filter(s => s.id !== payload.invoice.id)]);
                }
                if (payload?.products) setProducts(payload.products);
                if (payload?.clients) setClients(payload.clients);
                if (payload?.stockMovements) setStockMovements(payload.stockMovements);
                pushActivity({
                  type: 'QUOTATION_CONVERTED',
                  title: 'Quotation Converted',
                  description: payload.message || `Converted into Invoice #${payload.invoice?.invoiceNumber}`,
                  badgeColor: 'bg-emerald-500',
                  iconType: 'quote',
                });
                break;

              case 'QUOTATION_DELETED':
                if (payload?.quotationId) {
                  setQuotations(prev => prev.filter(q => q.id !== payload.quotationId));
                }
                break;

              case 'RETURN_PROCESSED':
                if (payload?.saleReturn) {
                  setReturns(prev => [payload.saleReturn, ...prev.filter(r => r.id !== payload.saleReturn.id)]);
                }
                if (payload?.products) setProducts(payload.products);
                if (payload?.clients) setClients(payload.clients);
                if (payload?.stockMovements) setStockMovements(payload.stockMovements);
                pushActivity({
                  type: 'RETURN_PROCESSED',
                  title: 'Return Processed',
                  description: payload.message || `Return #${payload.saleReturn?.returnNumber} processed`,
                  badgeColor: 'bg-rose-500',
                  iconType: 'sale',
                });
                break;

              case 'SETTINGS_UPDATED':
                if (payload?.settings) {
                  setSettings(payload.settings);
                }
                pushActivity({
                  type: 'DB_RESET',
                  title: 'Settings Updated',
                  description: payload.message || 'System settings synchronized',
                  badgeColor: 'bg-blue-600',
                  iconType: 'sync',
                });
                break;

              case 'DB_RESET':
              case 'DB_RESTORED':
                refreshData();
                pushActivity({
                  type: 'DB_RESET',
                  title: 'System Synced',
                  description: payload.message || 'Database state refreshed',
                  badgeColor: 'bg-slate-700',
                  iconType: 'sync',
                });
                break;

              default:
                break;
            }
          } catch (err) {
            console.error('Error handling SSE event:', err);
          }
        });

        eventSource.onerror = () => {
          setServerStatus('offline');
          eventSource?.close();
          // Attempt reconnection after 3 seconds
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        setServerStatus('offline');
        reconnectTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isAuthenticated, token, pushActivity, refreshData]);


  // Product operations
  const addProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await api.addProduct(data);
      if (created) {
        setProducts(prev => [created, ...prev]);
        if (data.stockQuantity > 0) {
          const movement: StockMovement = {
            id: `mov-${Date.now()}`,
            productId: created.id,
            productName: created.name,
            sku: created.sku,
            type: 'PURCHASE_RESTOCK',
            quantity: data.stockQuantity,
            previousStock: 0,
            newStock: data.stockQuantity,
            unitCost: data.purchasePrice,
            note: 'Initial catalog stock entry',
            date: new Date().toISOString(),
          };
          setStockMovements(prev => [movement, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error adding product to backend:', err);
      // Fallback local
      const newProduct: Product = {
        ...data,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts(prev => [newProduct, ...prev]);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
    try {
      await api.updateProduct(id, updates);
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const deleteProduct = async (id: string, permanent: boolean = false) => {
    try {
      await api.deleteProduct(id, permanent);
      await refreshData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const restoreProduct = async (id: string) => {
    try {
      await api.restoreProduct(id);
      await refreshData();
    } catch (err) {
      console.error('Error restoring product:', err);
    }
  };

  const restockProduct = async (
    productId: string,
    quantity: number,
    unitCost?: number,
    notes?: string,
    supplierName?: string
  ) => {
    try {
      const res = await api.restockProduct(productId, quantity, unitCost, notes, supplierName);
      if (res && res.product) {
        setProducts(prev => prev.map(p => (p.id === productId ? res.product : p)));
        if (res.movement) {
          setStockMovements(prev => [res.movement, ...prev]);
        }
        return;
      }
    } catch (err) {
      console.error('Error restocking via API, falling back locally:', err);
    }

    // Local fallback
    const product = products.find(p => p.id === productId);
    if (!product || quantity <= 0) return;

    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;
    const cost = unitCost !== undefined && unitCost > 0 ? unitCost : product.purchasePrice;

    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              stockQuantity: newStock,
              purchasePrice: unitCost !== undefined && unitCost > 0 ? unitCost : p.purchasePrice,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'PURCHASE_RESTOCK',
      quantity,
      previousStock,
      newStock,
      unitCost: cost,
      referenceId: supplierName ? `Supplier: ${supplierName}` : undefined,
      note: notes || `Restocked +${quantity} units`,
      date: new Date().toISOString(),
    };

    setStockMovements(prev => [movement, ...prev]);
  };

  const adjustStock = async (productId: string, newStock: number, reason: string) => {
    try {
      const res = await api.adjustStock(productId, newStock, reason);
      if (res && res.product) {
        setProducts(prev => prev.map(p => (p.id === productId ? res.product : p)));
        if (res.movement) {
          setStockMovements(prev => [res.movement, ...prev]);
        }
        return;
      }
    } catch (err) {
      console.error('Error adjusting stock via API:', err);
    }

    const product = products.find(p => p.id === productId);
    if (!product || newStock < 0) return;

    const diff = newStock - product.stockQuantity;
    const previousStock = product.stockQuantity;

    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() }
          : p
      )
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'ADJUSTMENT',
      quantity: diff,
      previousStock,
      newStock,
      note: reason || 'Inventory manual adjustment',
      date: new Date().toISOString(),
    };

    setStockMovements(prev => [movement, ...prev]);
  };

  // Category operations
  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const created = await api.addCategory(categoryData);
      setCategories(prev => [...prev, created]);
    } catch (err) {
      console.error('Error adding category:', err);
      const newCat: Category = {
        ...categoryData,
        id: `cat-${Date.now()}`,
      };
      setCategories(prev => [...prev, newCat]);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    try {
      await api.deleteCategory(id);
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // Client operations
  const addClient = async (
    clientData: Omit<Client, 'id' | 'totalSpent' | 'outstandingBalance' | 'createdAt'>
  ): Promise<Client> => {
    try {
      const created = await api.addClient(clientData);
      setClients(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Error adding client:', err);
      const newClient: Client = {
        ...clientData,
        id: `client-${Date.now()}`,
        totalSpent: 0,
        outstandingBalance: 0,
        createdAt: new Date().toISOString(),
      };
      setClients(prev => [newClient, ...prev]);
      return newClient;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      await api.updateClient(id, updates);
    } catch (err) {
      console.error('Error updating client:', err);
    }
  };

  const deleteClient = async (id: string, permanent: boolean = false) => {
    try {
      await api.deleteClient(id, permanent);
      await refreshData();
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  const restoreClient = async (id: string) => {
    try {
      await api.restoreClient(id);
      await refreshData();
    } catch (err) {
      console.error('Error restoring client:', err);
    }
  };

  // Sales
  const createSale = async (input: SaleCreationInput): Promise<SaleInvoice | null> => {
    try {
      const created = await api.createSale({
        clientId: input.clientId,
        items: input.items,
        taxRate: input.taxRate,
        paymentMethod: input.paymentMethod,
        initialAmountPaid: input.initialAmountPaid,
        notes: input.notes,
        dueDate: input.dueDate,
      });

      if (created) {
        // Refresh full state from backend to sync inventory, ledger & client balances
        await refreshData();
        return created;
      }
    } catch (err) {
      console.error('Error creating sale via backend API:', err);
    }

    // Fallback local logic
    const client = clients.find(c => c.id === input.clientId);
    if (!client || !input.items || input.items.length === 0) return null;

    let subtotal = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    const saleItems: SaleItem[] = [];
    const newMovements: StockMovement[] = [];
    const updatedProductsMap = new Map<string, Product>();

    const countToday = sales.length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(countToday).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    for (const itemInput of input.items) {
      const prod = products.find(p => p.id === itemInput.productId);
      if (!prod) continue;

      const qty = Math.max(1, itemInput.quantity);
      const unitPrice = itemInput.unitSellingPrice ?? prod.sellingPrice;
      const discountPct = itemInput.discountPercentage ?? 0;
      const discountedUnit = unitPrice * (1 - discountPct / 100);
      const lineTotal = discountedUnit * qty;
      const lineCost = prod.purchasePrice * qty;
      const lineProfit = lineTotal - lineCost;

      subtotal += unitPrice * qty;
      totalDiscount += (unitPrice * (discountPct / 100)) * qty;
      totalCost += lineCost;

      saleItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: qty,
        unitPurchasePrice: prod.purchasePrice,
        unitSellingPrice: unitPrice,
        discountPercentage: discountPct,
        total: Math.round(lineTotal * 100) / 100,
        profit: Math.round(lineProfit * 100) / 100,
      });

      const currentStock = prod.stockQuantity;
      const newStock = Math.max(0, currentStock - qty);

      updatedProductsMap.set(prod.id, {
        ...prod,
        stockQuantity: newStock,
        updatedAt: nowIso,
      });

      newMovements.push({
        id: `mov-${Date.now()}-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'SALE',
        quantity: -qty,
        previousStock: currentStock,
        newStock: newStock,
        referenceId: invoiceNumber,
        note: `Sold to ${client.name}`,
        date: nowIso,
      });
    }

    if (saleItems.length === 0) return null;

    const taxRate = input.taxRate ?? 0;
    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
    const netProfit = Math.round((taxableAmount - totalCost) * 100) / 100;

    let initialPayment = input.initialAmountPaid ?? 0;
    if (input.paymentMethod === 'CASH' && initialPayment === 0) {
      initialPayment = grandTotal;
    }
    initialPayment = Math.min(grandTotal, Math.max(0, initialPayment));

    const amountDue = Math.round((grandTotal - initialPayment) * 100) / 100;

    let paymentStatus: PaymentStatus = 'PENDING';
    if (amountDue <= 0.001) {
      paymentStatus = 'PAID';
    } else if (initialPayment > 0) {
      paymentStatus = 'PARTIAL';
    }

    const saleId = `inv-${Date.now()}`;
    const newInvoice: SaleInvoice = {
      id: saleId,
      invoiceNumber,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      items: saleItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate,
      grandTotal,
      totalCost: Math.round(totalCost * 100) / 100,
      profit: netProfit,
      amountPaid: initialPayment,
      amountDue,
      paymentStatus,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      dueDate: input.dueDate,
      date: nowIso,
      payments: initialPayment > 0 ? [{
        id: `pay-${Date.now()}`,
        saleId,
        amount: initialPayment,
        method: input.paymentMethod,
        date: nowIso,
        recordedBy: 'Admin',
        note: `Initial payment`,
      }] : [],
    };

    setSales(prev => [newInvoice, ...prev]);
    setProducts(prev =>
      prev.map(p => (updatedProductsMap.has(p.id) ? updatedProductsMap.get(p.id)! : p))
    );
    setStockMovements(prev => [...newMovements, ...prev]);
    setClients(prev =>
      prev.map(c =>
        c.id === client.id
          ? {
              ...c,
              totalSpent: Math.round((c.totalSpent + grandTotal) * 100) / 100,
              outstandingBalance: Math.round((c.outstandingBalance + amountDue) * 100) / 100,
            }
          : c
      )
    );

    return newInvoice;
  };

  const recordPayment = async (saleId: string, amount: number, method: PaymentMethod, note?: string) => {
    if (amount <= 0) return;

    try {
      await api.recordPayment(saleId, amount, method, note);
      await refreshData();
      return;
    } catch (err) {
      console.error('Error recording payment via API, applying locally:', err);
    }

    setSales(prev =>
      prev.map(sale => {
        if (sale.id !== saleId) return sale;

        const effectivePayment = Math.min(amount, sale.amountDue);
        const newAmountPaid = Math.round((sale.amountPaid + effectivePayment) * 100) / 100;
        const newAmountDue = Math.max(0, Math.round((sale.grandTotal - newAmountPaid) * 100) / 100);

        let status: PaymentStatus = 'PARTIAL';
        if (newAmountDue <= 0.01) {
          status = 'PAID';
        }

        const newPayment = {
          id: `pay-${Date.now()}`,
          saleId: sale.id,
          amount: effectivePayment,
          method,
          date: new Date().toISOString(),
          recordedBy: 'Admin',
          note: note || `Payment of $${effectivePayment.toFixed(2)} recorded`,
        };

        setClients(clientList =>
          clientList.map(c =>
            c.id === sale.clientId
              ? {
                  ...c,
                  outstandingBalance: Math.max(0, Math.round((c.outstandingBalance - effectivePayment) * 100) / 100),
                }
              : c
          )
        );

        return {
          ...sale,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          paymentStatus: status,
          payments: [newPayment, ...sale.payments],
        };
      })
    );
  };

  const deleteSale = async (saleId: string, permanent: boolean = false) => {
    try {
      await api.deleteSale(saleId, permanent);
      await refreshData();
      return;
    } catch (err) {
      console.error('Error deleting sale on backend, applying locally:', err);
    }

    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    setProducts(prev =>
      prev.map(p => {
        const item = sale.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stockQuantity: p.stockQuantity + item.quantity, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    setClients(prev =>
      prev.map(c =>
        c.id === sale.clientId
          ? {
              ...c,
              totalSpent: Math.max(0, Math.round((c.totalSpent - sale.grandTotal) * 100) / 100),
              outstandingBalance: Math.max(0, Math.round((c.outstandingBalance - sale.amountDue) * 100) / 100),
            }
          : c
      )
    );

    setSales(prev => prev.filter(s => s.id !== saleId));
  };

  const restoreSale = async (saleId: string) => {
    try {
      await api.restoreSale(saleId);
      await refreshData();
    } catch (err) {
      console.error('Error restoring sale:', err);
    }
  };

  // Expenses
  const addExpense = async (data: Omit<Expense, 'id'>) => {
    try {
      const created = await api.addExpense(data);
      setExpenses(prev => [created, ...prev]);
    } catch (err) {
      console.error('Error adding expense on backend:', err);
      const newExp: Expense = {
        ...data,
        id: `exp-${Date.now()}`,
      };
      setExpenses(prev => [newExp, ...prev]);
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      await api.deleteExpense(id);
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  // Suppliers
  const addSupplier = async (data: Omit<Supplier, 'id' | 'totalPurchased' | 'createdAt'>): Promise<Supplier | null> => {
    try {
      const created = await api.addSupplier(data);
      if (created) {
        setSuppliers(prev => [created, ...prev]);
        return created;
      }
    } catch (err) {
      console.error('Error adding supplier:', err);
    }
    const fallback: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers(prev => [fallback, ...prev]);
    return fallback;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    try {
      await api.updateSupplier(id, updates);
    } catch (err) {
      console.error('Error updating supplier:', err);
    }
  };

  const deleteSupplier = async (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    try {
      await api.deleteSupplier(id);
    } catch (err) {
      console.error('Error deleting supplier:', err);
    }
  };

  // Purchase Orders
  const createPurchaseOrder = async (input: PurchaseOrderCreationInput): Promise<PurchaseOrder | null> => {
    try {
      const created = await api.createPurchaseOrder(input);
      if (created) {
        setPurchaseOrders(prev => [created, ...prev]);
        await refreshData();
        return created;
      }
    } catch (err) {
      console.error('Error creating purchase order:', err);
    }
    return null;
  };

  const updatePurchaseOrderStatus = async (id: string, status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED') => {
    setPurchaseOrders(prev => prev.map(po => (po.id === id ? { ...po, status } : po)));
    try {
      await api.updatePurchaseOrderStatus(id, status);
    } catch (err) {
      console.error('Error updating PO status:', err);
    }
  };

  const receivePurchaseOrder = async (id: string) => {
    try {
      const res = await api.receivePurchaseOrder(id);
      if (res && res.data) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error receiving purchase order:', err);
      // Fallback local restock
      const po = purchaseOrders.find(p => p.id === id);
      if (po && po.status !== 'RECEIVED') {
        po.status = 'RECEIVED';
        po.receivedDate = new Date().toISOString();
        po.items.forEach(item => {
          restockProduct(item.productId, item.quantity, item.unitCost, `PO ${po.orderNumber}`, po.supplierName);
        });
      }
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    setPurchaseOrders(prev => prev.filter(p => p.id !== id));
    try {
      await api.deletePurchaseOrder(id);
    } catch (err) {
      console.error('Error deleting PO:', err);
    }
  };

  // Quotations
  const createQuotation = async (input: QuotationCreationInput): Promise<Quotation | null> => {
    try {
      const created = await api.createQuotation(input);
      if (created) {
        setQuotations(prev => [created, ...prev]);
        return created;
      }
    } catch (err) {
      console.error('Error creating quotation:', err);
    }
    return null;
  };

  const updateQuotationStatus = async (id: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED') => {
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, status } : q)));
    try {
      await api.updateQuotationStatus(id, status);
    } catch (err) {
      console.error('Error updating quotation status:', err);
    }
  };

  const convertQuotationToInvoice = async (id: string): Promise<SaleInvoice | null> => {
    try {
      const res = await api.convertQuotationToInvoice(id);
      if (res && res.data && res.data.invoice) {
        await refreshData();
        return res.data.invoice;
      }
    } catch (err) {
      console.error('Error converting quotation:', err);
    }
    return null;
  };

  const deleteQuotation = async (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    try {
      await api.deleteQuotation(id);
    } catch (err) {
      console.error('Error deleting quotation:', err);
    }
  };

  // Returns & Refunds
  const processReturn = async (data: {
    invoiceId: string;
    items: Array<{
      productId: string;
      quantity: number;
      reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE_OF_MIND' | 'DAMAGED' | 'OTHER';
      restockItem: boolean;
    }>;
    restockingFee?: number;
    refundMethod: 'CASH' | 'CARD' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    notes?: string;
  }): Promise<SaleReturn | null> => {
    try {
      const res = await api.processReturn(data);
      if (res) {
        setReturns(prev => [res, ...prev.filter(r => r.id !== res.id)]);
        await refreshData();
        return res;
      }
    } catch (err) {
      console.error('Error processing return:', err);
    }
    return null;
  };

  // Settings
  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    try {
      const updated = await api.updateSettings(newSettings);
      if (updated) {
        setSettings(prev => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  const formatCurrency = useCallback((amount: number) => {
    const symbol = settings?.currencySymbol || '$';
    const num = Number(amount) || 0;
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [settings?.currencySymbol]);

  // Backup & Restore
  const restoreDatabase = async (backupData: any) => {
    try {
      const data = await api.restoreDatabase(backupData);
      if (data) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setClients(data.clients || []);
        setSales(data.sales || []);
        setExpenses(data.expenses || []);
        setStockMovements(data.stockMovements || []);
        setSuppliers(data.suppliers || []);
        setPurchaseOrders(data.purchaseOrders || []);
        setQuotations(data.quotations || []);
        if (data.returns) setReturns(data.returns);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error restoring database:', err);
      throw err;
    }
  };

  const resetToEmptyDatabase = async () => {
    try {
      const data = await api.resetToEmptyDatabase();
      if (data) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setClients(data.clients || []);
        setSales(data.sales || []);
        setExpenses(data.expenses || []);
        setStockMovements(data.stockMovements || []);
        setSuppliers(data.suppliers || []);
        setPurchaseOrders(data.purchaseOrders || []);
        setQuotations(data.quotations || []);
        if (data.returns) setReturns(data.returns);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error clearing database:', err);
      throw err;
    }
  };

  const exportBackup = () => {
    const fullBackup = {
      products,
      categories,
      clients,
      sales,
      expenses,
      stockMovements,
      suppliers,
      purchaseOrders,
      quotations,
      returns,
      settings,
      exportedAt: new Date().toISOString(),
      system: 'Nexus ERP Enterprise Suite',
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_erp_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Active (non-deleted) items for accurate financial & stock calculations
  const activeSales = useMemo(() => sales.filter(s => !s.isDeleted), [sales]);
  const activeProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);

  // Computed Financial Metrics
  const totalRevenue = useMemo(() => {
    return Math.round(activeSales.reduce((acc, s) => acc + s.grandTotal, 0) * 100) / 100;
  }, [activeSales]);

  const totalCollected = useMemo(() => {
    return Math.round(activeSales.reduce((acc, s) => acc + s.amountPaid, 0) * 100) / 100;
  }, [activeSales]);

  const totalCostOfGoodsSold = useMemo(() => {
    return Math.round(activeSales.reduce((acc, s) => acc + s.totalCost, 0) * 100) / 100;
  }, [activeSales]);

  const grossProfit = useMemo(() => {
    return Math.round((totalRevenue - totalCostOfGoodsSold) * 100) / 100;
  }, [totalRevenue, totalCostOfGoodsSold]);

  const totalExpenses = useMemo(() => {
    return Math.round(expenses.reduce((acc, e) => acc + e.amount, 0) * 100) / 100;
  }, [expenses]);

  const netProfit = useMemo(() => {
    return Math.round((grossProfit - totalExpenses) * 100) / 100;
  }, [grossProfit, totalExpenses]);

  const totalPendingReceivables = useMemo(() => {
    return Math.round(activeSales.reduce((acc, s) => acc + s.amountDue, 0) * 100) / 100;
  }, [activeSales]);

  const totalAccountsPayable = useMemo(() => {
    const pendingPOs = purchaseOrders.filter(po => po.status === 'ORDERED' || po.status === 'DRAFT');
    return Math.round(pendingPOs.reduce((acc, po) => acc + po.grandTotal, 0) * 100) / 100;
  }, [purchaseOrders]);

  const inventoryCostValue = useMemo(() => {
    return Math.round(activeProducts.reduce((acc, p) => acc + p.purchasePrice * p.stockQuantity, 0) * 100) / 100;
  }, [activeProducts]);

  const inventoryRetailValue = useMemo(() => {
    return Math.round(activeProducts.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0) * 100) / 100;
  }, [activeProducts]);

  const lowStockProducts = useMemo(() => {
    return activeProducts.filter(p => p.stockQuantity <= p.minStockThreshold);
  }, [activeProducts]);

  const lowStockCount = lowStockProducts.length;

  const pendingQuotationsCount = useMemo(() => {
    return quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length;
  }, [quotations]);

  const orderedPOCount = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'ORDERED').length;
  }, [purchaseOrders]);

  // Time range performance aggregator for recharts
  const getFinancialPerformanceData = (timeRange: TimeRange) => {
    const now = new Date();

    if (timeRange === 'daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayLabel = `${days[d.getDay()]} (${d.getMonth() + 1}/${d.getDate()})`;

        const daySales = sales.filter(s => s.date.startsWith(dayStr));
        const dayExpenses = expenses.filter(e => e.date.startsWith(dayStr));

        const rev = daySales.reduce((acc, s) => acc + s.grandTotal, 0);
        const cost = daySales.reduce((acc, s) => acc + s.totalCost, 0);
        const exp = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
        const profit = rev - cost - exp;

        result.push({
          label: dayLabel,
          revenue: Math.round(rev),
          cost: Math.round(cost),
          expenses: Math.round(exp),
          profit: Math.round(profit),
        });
      }
      return result;
    }

    if (timeRange === 'weekly') {
      const result = [];
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - (i + 1) * 7);
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);

        const weekSales = sales.filter(s => {
          const sd = new Date(s.date);
          return sd >= start && sd <= end;
        });

        const weekExpenses = expenses.filter(e => {
          const ed = new Date(e.date);
          return ed >= start && ed <= end;
        });

        const rev = weekSales.reduce((acc, s) => acc + s.grandTotal, 0);
        const cost = weekSales.reduce((acc, s) => acc + s.totalCost, 0);
        const exp = weekExpenses.reduce((acc, e) => acc + e.amount, 0);
        const profit = rev - cost - exp;

        result.push({
          label: `Wk ${4 - i}`,
          revenue: Math.round(rev),
          cost: Math.round(cost),
          expenses: Math.round(exp),
          profit: Math.round(profit),
        });
      }
      return result;
    }

    if (timeRange === 'yearly') {
      const currentYear = now.getFullYear();
      const result = [];
      for (let y = currentYear - 3; y <= currentYear; y++) {
        const yearSales = sales.filter(s => new Date(s.date).getFullYear() === y);
        const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === y);

        let rev = yearSales.reduce((acc, s) => acc + s.grandTotal, 0);
        let cost = yearSales.reduce((acc, s) => acc + s.totalCost, 0);
        let exp = yearExpenses.reduce((acc, e) => acc + e.amount, 0);

        if (y < currentYear && rev === 0) {
          const factor = (y - (currentYear - 3) + 1) * 0.35;
          rev = Math.round(totalRevenue * factor * 10);
          cost = Math.round(totalCostOfGoodsSold * factor * 10);
          exp = Math.round(totalExpenses * factor * 10);
        }

        const profit = rev - cost - exp;

        result.push({
          label: `${y}`,
          revenue: Math.round(rev),
          cost: Math.round(cost),
          expenses: Math.round(exp),
          profit: Math.round(profit),
        });
      }
      return result;
    }

    // Default 'monthly'
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = now.getMonth();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = now.getFullYear();
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const mSales = sales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });

      const mExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });

      let rev = mSales.reduce((acc, s) => acc + s.grandTotal, 0);
      let cost = mSales.reduce((acc, s) => acc + s.totalCost, 0);
      let exp = mExpenses.reduce((acc, e) => acc + e.amount, 0);

      if (i > 0 && rev === 0) {
        const simFactor = 0.7 + (5 - i) * 0.06;
        rev = Math.round(totalRevenue * simFactor);
        cost = Math.round(totalCostOfGoodsSold * simFactor);
        exp = Math.round(totalExpenses * simFactor);
      }

      const profit = rev - cost - exp;

      result.push({
        label: `${monthNames[targetMonth]}`,
        revenue: Math.round(rev),
        cost: Math.round(cost),
        expenses: Math.round(exp),
        profit: Math.round(profit),
      });
    }

    return result;
  };

  const resetToDemoData = async () => {
    try {
      await api.resetDatabase();
      await refreshData();
    } catch (err) {
      console.error('Error resetting via API:', err);
      setProducts(initialProducts);
      setCategories(initialCategories);
      setClients(initialClients);
      setSales(initialSales);
      setExpenses(initialExpenses);
      setStockMovements(initialStockMovements);
      setSuppliers(initialSuppliers);
      setPurchaseOrders(initialPurchaseOrders);
      setQuotations(initialQuotations);
      setReturns(initialReturns);
      setSettings(initialSettings);
    }
  };

  return (
    <ERPContext.Provider
      value={{
        products,
        categories,
        clients,
        sales,
        expenses,
        stockMovements,
        suppliers,
        purchaseOrders,
        quotations,
        returns,
        settings,
        isLoading,
        serverStatus,
        activeTerminals,
        lastSynced,
        activities,
        activeToast,
        soundEnabled,
        toggleSound,
        clearActivities,
        dismissToast,
        addProduct,
        updateProduct,
        deleteProduct,
        restoreProduct,
        restockProduct,
        adjustStock,
        addCategory,
        deleteCategory,
        addClient,
        updateClient,
        deleteClient,
        restoreClient,
        createSale,
        recordPayment,
        deleteSale,
        restoreSale,
        processReturn,
        updateSettings,
        formatCurrency,
        addExpense,
        deleteExpense,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        receivePurchaseOrder,
        deletePurchaseOrder,
        createQuotation,
        updateQuotationStatus,
        convertQuotationToInvoice,
        deleteQuotation,
        restoreDatabase,
        exportBackup,
        totalRevenue,
        totalCollected,
        totalCostOfGoodsSold,
        grossProfit,
        totalExpenses,
        netProfit,
        totalPendingReceivables,
        totalAccountsPayable,
        inventoryCostValue,
        inventoryRetailValue,
        lowStockCount,
        lowStockProducts,
        pendingQuotationsCount,
        orderedPOCount,
        getFinancialPerformanceData,
        resetToDemoData,
        resetToEmptyDatabase,
        refreshData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
