import fs from 'fs';
import path from 'path';
import {
  Category,
  Client,
  CompanySettings,
  Expense,
  PaymentMethod,
  PaymentStatus,
  PaymentTransaction,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  Quotation,
  QuotationItem,
  SaleInvoice,
  SaleItem,
  SaleReturn,
  StockMovement,
  Supplier,
  TimeRange,
} from '../src/types/erp';
import {
  initialCategories,
  initialClients,
  initialExpenses,
  initialProducts,
  initialPurchaseOrders,
  initialQuotations,
  initialReturns,
  initialSales,
  initialSettings,
  initialStockMovements,
  initialSuppliers,
} from '../src/data/initialData';

export interface ERPDatabaseSchema {
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
  lastUpdated: string;
}

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'erp_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let inMemoryDb: ERPDatabaseSchema = {
  products: initialProducts,
  categories: initialCategories,
  clients: initialClients,
  sales: initialSales,
  expenses: initialExpenses,
  stockMovements: initialStockMovements,
  suppliers: initialSuppliers,
  purchaseOrders: initialPurchaseOrders,
  quotations: initialQuotations,
  returns: initialReturns,
  settings: initialSettings,
  lastUpdated: new Date().toISOString(),
};

// Initialize DB from disk or seed
function loadDatabase(): ERPDatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed.products && parsed.sales && parsed.clients) {
        inMemoryDb = {
          products: parsed.products || initialProducts,
          categories: parsed.categories || initialCategories,
          clients: parsed.clients || initialClients,
          sales: parsed.sales || initialSales,
          expenses: parsed.expenses || initialExpenses,
          stockMovements: parsed.stockMovements || initialStockMovements,
          suppliers: parsed.suppliers || initialSuppliers,
          purchaseOrders: parsed.purchaseOrders || initialPurchaseOrders,
          quotations: parsed.quotations || initialQuotations,
          returns: parsed.returns || initialReturns,
          settings: parsed.settings || initialSettings,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        return inMemoryDb;
      }
    }
  } catch (err) {
    console.error('Error loading DB file, fallback to initial seed:', err);
  }

  saveDatabase(inMemoryDb);
  return inMemoryDb;
}

function saveDatabase(data: ERPDatabaseSchema) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB file:', err);
  }
}

// Initial load
loadDatabase();

export const db = {
  get: () => inMemoryDb,
  
  save: () => {
    saveDatabase(inMemoryDb);
  },

  reset: () => {
    inMemoryDb = {
      products: JSON.parse(JSON.stringify(initialProducts)),
      categories: JSON.parse(JSON.stringify(initialCategories)),
      clients: JSON.parse(JSON.stringify(initialClients)),
      sales: JSON.parse(JSON.stringify(initialSales)),
      expenses: JSON.parse(JSON.stringify(initialExpenses)),
      stockMovements: JSON.parse(JSON.stringify(initialStockMovements)),
      suppliers: JSON.parse(JSON.stringify(initialSuppliers)),
      purchaseOrders: JSON.parse(JSON.stringify(initialPurchaseOrders)),
      quotations: JSON.parse(JSON.stringify(initialQuotations)),
      returns: JSON.parse(JSON.stringify(initialReturns)),
      settings: JSON.parse(JSON.stringify(initialSettings)),
      lastUpdated: new Date().toISOString(),
    };
    saveDatabase(inMemoryDb);
    return inMemoryDb;
  },

  clear: () => {
    inMemoryDb = {
      products: [],
      categories: [],
      clients: [],
      sales: [],
      expenses: [],
      stockMovements: [],
      suppliers: [],
      purchaseOrders: [],
      quotations: [],
      returns: [],
      settings: JSON.parse(JSON.stringify(initialSettings)),
      lastUpdated: new Date().toISOString(),
    };
    saveDatabase(inMemoryDb);
    return inMemoryDb;
  },

  restore: (backup: Partial<ERPDatabaseSchema>) => {
    inMemoryDb = {
      products: Array.isArray(backup.products) ? backup.products : inMemoryDb.products,
      categories: Array.isArray(backup.categories) ? backup.categories : inMemoryDb.categories,
      clients: Array.isArray(backup.clients) ? backup.clients : inMemoryDb.clients,
      sales: Array.isArray(backup.sales) ? backup.sales : inMemoryDb.sales,
      expenses: Array.isArray(backup.expenses) ? backup.expenses : inMemoryDb.expenses,
      stockMovements: Array.isArray(backup.stockMovements) ? backup.stockMovements : inMemoryDb.stockMovements,
      suppliers: Array.isArray(backup.suppliers) ? backup.suppliers : inMemoryDb.suppliers,
      purchaseOrders: Array.isArray(backup.purchaseOrders) ? backup.purchaseOrders : inMemoryDb.purchaseOrders,
      quotations: Array.isArray(backup.quotations) ? backup.quotations : inMemoryDb.quotations,
      returns: Array.isArray(backup.returns) ? backup.returns : inMemoryDb.returns,
      settings: backup.settings ? { ...inMemoryDb.settings, ...backup.settings } : inMemoryDb.settings,
      lastUpdated: new Date().toISOString(),
    };
    saveDatabase(inMemoryDb);
    return inMemoryDb;
  },

  // Products
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryDb.products.unshift(newProduct);

    if (newProduct.stockQuantity > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'PURCHASE_RESTOCK',
        quantity: newProduct.stockQuantity,
        previousStock: 0,
        newStock: newProduct.stockQuantity,
        unitCost: newProduct.purchasePrice,
        note: 'Initial catalog stock entry',
        date: new Date().toISOString(),
      };
      inMemoryDb.stockMovements.unshift(movement);
    }

    saveDatabase(inMemoryDb);
    return newProduct;
  },

  updateProduct: (id: string, updates: Partial<Product>) => {
    const idx = inMemoryDb.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    inMemoryDb.products[idx] = {
      ...inMemoryDb.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(inMemoryDb);
    return inMemoryDb.products[idx];
  },

  deleteProduct: (id: string) => {
    inMemoryDb.products = inMemoryDb.products.filter(p => p.id !== id);
    saveDatabase(inMemoryDb);
    return true;
  },

  restockProduct: (productId: string, quantity: number, unitCost?: number, notes?: string, supplierName?: string) => {
    const product = inMemoryDb.products.find(p => p.id === productId);
    if (!product || quantity <= 0) return null;

    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;
    const cost = unitCost !== undefined && unitCost > 0 ? unitCost : product.purchasePrice;

    product.stockQuantity = newStock;
    product.purchasePrice = cost;
    product.updatedAt = new Date().toISOString();

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

    inMemoryDb.stockMovements.unshift(movement);
    saveDatabase(inMemoryDb);
    return { product, movement };
  },

  adjustStock: (productId: string, newStock: number, reason: string) => {
    const product = inMemoryDb.products.find(p => p.id === productId);
    if (!product || newStock < 0) return null;

    const diff = newStock - product.stockQuantity;
    const previousStock = product.stockQuantity;

    product.stockQuantity = newStock;
    product.updatedAt = new Date().toISOString();

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

    inMemoryDb.stockMovements.unshift(movement);
    saveDatabase(inMemoryDb);
    return { product, movement };
  },

  // Categories
  addCategory: (data: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
    };
    inMemoryDb.categories.push(newCat);
    saveDatabase(inMemoryDb);
    return newCat;
  },

  deleteCategory: (id: string) => {
    inMemoryDb.categories = inMemoryDb.categories.filter(c => c.id !== id);
    saveDatabase(inMemoryDb);
    return true;
  },

  // Clients
  addClient: (data: Omit<Client, 'id' | 'totalSpent' | 'outstandingBalance' | 'createdAt'>) => {
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}`,
      totalSpent: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    inMemoryDb.clients.unshift(newClient);
    saveDatabase(inMemoryDb);
    return newClient;
  },

  updateClient: (id: string, updates: Partial<Client>) => {
    const idx = inMemoryDb.clients.findIndex(c => c.id === id);
    if (idx === -1) return null;
    inMemoryDb.clients[idx] = {
      ...inMemoryDb.clients[idx],
      ...updates,
    };
    saveDatabase(inMemoryDb);
    return inMemoryDb.clients[idx];
  },

  deleteClient: (id: string) => {
    inMemoryDb.clients = inMemoryDb.clients.filter(c => c.id !== id);
    saveDatabase(inMemoryDb);
    return true;
  },

  // Sales
  createSale: (input: {
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
  }) => {
    const client = inMemoryDb.clients.find(c => c.id === input.clientId);
    if (!client || !input.items || input.items.length === 0) return null;

    let subtotal = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    const saleItems: SaleItem[] = [];
    const newMovements: StockMovement[] = [];
    const nowIso = new Date().toISOString();

    const countToday = inMemoryDb.sales.length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(countToday).padStart(3, '0')}`;

    for (const itemInput of input.items) {
      const prod = inMemoryDb.products.find(p => p.id === itemInput.productId);
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

      // Deduct stock
      const previousStock = prod.stockQuantity;
      const newStock = Math.max(0, previousStock - qty);
      prod.stockQuantity = newStock;
      prod.updatedAt = nowIso;

      newMovements.push({
        id: `mov-${Date.now()}-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'SALE',
        quantity: -qty,
        previousStock,
        newStock,
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
    const paymentsList: PaymentTransaction[] = [];

    if (initialPayment > 0) {
      paymentsList.push({
        id: `pay-${Date.now()}`,
        saleId,
        amount: initialPayment,
        method: input.paymentMethod,
        date: nowIso,
        recordedBy: 'Admin',
        note: `Initial payment via ${input.paymentMethod.replace('_', ' ')}`,
      });
    }

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
      payments: paymentsList,
    };

    inMemoryDb.sales.unshift(newInvoice);
    inMemoryDb.stockMovements = [...newMovements, ...inMemoryDb.stockMovements];

    client.totalSpent = Math.round((client.totalSpent + grandTotal) * 100) / 100;
    client.outstandingBalance = Math.round((client.outstandingBalance + amountDue) * 100) / 100;

    saveDatabase(inMemoryDb);
    return newInvoice;
  },

  recordPayment: (saleId: string, amount: number, method: PaymentMethod, note?: string) => {
    const sale = inMemoryDb.sales.find(s => s.id === saleId);
    if (!sale || amount <= 0) return null;

    const effectivePayment = Math.min(amount, sale.amountDue);
    const newAmountPaid = Math.round((sale.amountPaid + effectivePayment) * 100) / 100;
    const newAmountDue = Math.max(0, Math.round((sale.grandTotal - newAmountPaid) * 100) / 100);

    let status: PaymentStatus = 'PARTIAL';
    if (newAmountDue <= 0.01) {
      status = 'PAID';
    }

    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      saleId: sale.id,
      amount: effectivePayment,
      method,
      date: new Date().toISOString(),
      recordedBy: 'Admin',
      note: note || `Payment of $${effectivePayment.toFixed(2)} recorded`,
    };

    sale.amountPaid = newAmountPaid;
    sale.amountDue = newAmountDue;
    sale.paymentStatus = status;
    sale.payments.unshift(newPayment);

    // Client balance
    const client = inMemoryDb.clients.find(c => c.id === sale.clientId);
    if (client) {
      client.outstandingBalance = Math.max(0, Math.round((client.outstandingBalance - effectivePayment) * 100) / 100);
    }

    saveDatabase(inMemoryDb);
    return { sale, payment: newPayment };
  },

  deleteSale: (saleId: string) => {
    const sale = inMemoryDb.sales.find(s => s.id === saleId);
    if (!sale) return false;

    // Restore stock
    sale.items.forEach(item => {
      const prod = inMemoryDb.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity += item.quantity;
        prod.updatedAt = new Date().toISOString();
      }
    });

    // Revert client spent and balance
    const client = inMemoryDb.clients.find(c => c.id === sale.clientId);
    if (client) {
      client.totalSpent = Math.max(0, Math.round((client.totalSpent - sale.grandTotal) * 100) / 100);
      client.outstandingBalance = Math.max(0, Math.round((client.outstandingBalance - sale.amountDue) * 100) / 100);
    }

    inMemoryDb.sales = inMemoryDb.sales.filter(s => s.id !== saleId);
    saveDatabase(inMemoryDb);
    return true;
  },

  // Expenses
  addExpense: (data: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
    };
    inMemoryDb.expenses.unshift(newExpense);
    saveDatabase(inMemoryDb);
    return newExpense;
  },

  deleteExpense: (id: string) => {
    inMemoryDb.expenses = inMemoryDb.expenses.filter(e => e.id !== id);
    saveDatabase(inMemoryDb);
    return true;
  },

  // Suppliers
  addSupplier: (data: Omit<Supplier, 'id' | 'totalPurchased' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
      createdAt: new Date().toISOString(),
    };
    inMemoryDb.suppliers.unshift(newSupplier);
    saveDatabase(inMemoryDb);
    return newSupplier;
  },

  updateSupplier: (id: string, updates: Partial<Supplier>) => {
    const idx = inMemoryDb.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    inMemoryDb.suppliers[idx] = {
      ...inMemoryDb.suppliers[idx],
      ...updates,
    };
    saveDatabase(inMemoryDb);
    return inMemoryDb.suppliers[idx];
  },

  deleteSupplier: (id: string) => {
    inMemoryDb.suppliers = inMemoryDb.suppliers.filter(s => s.id !== id);
    saveDatabase(inMemoryDb);
    return true;
  },

  // Purchase Orders
  createPurchaseOrder: (input: {
    supplierId: string;
    items: Array<{ productId: string; quantity: number; unitCost: number }>;
    expectedDeliveryDate?: string;
    notes?: string;
  }) => {
    const supplier = inMemoryDb.suppliers.find(s => s.id === input.supplierId);
    if (!supplier || !input.items || input.items.length === 0) return null;

    const poItems: PurchaseOrderItem[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = inMemoryDb.products.find(p => p.id === item.productId);
      if (!product) continue;
      const lineTotal = item.quantity * item.unitCost;
      subtotal += lineTotal;
      poItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total: Math.round(lineTotal * 100) / 100,
      });
    }

    if (poItems.length === 0) return null;

    const count = inMemoryDb.purchaseOrders.length + 1;
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: poItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: 0,
      grandTotal: Math.round(subtotal * 100) / 100,
      status: 'ORDERED',
      date: new Date().toISOString(),
      expectedDeliveryDate: input.expectedDeliveryDate,
      notes: input.notes,
    };

    inMemoryDb.purchaseOrders.unshift(newPO);
    supplier.totalPurchased = Math.round((supplier.totalPurchased + newPO.grandTotal) * 100) / 100;
    saveDatabase(inMemoryDb);
    return newPO;
  },

  updatePurchaseOrderStatus: (id: string, status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED') => {
    const po = inMemoryDb.purchaseOrders.find(p => p.id === id);
    if (!po) return null;
    po.status = status;
    saveDatabase(inMemoryDb);
    return po;
  },

  receivePurchaseOrder: (id: string) => {
    const po = inMemoryDb.purchaseOrders.find(p => p.id === id);
    if (!po || po.status === 'RECEIVED') return null;

    const nowIso = new Date().toISOString();
    po.status = 'RECEIVED';
    po.receivedDate = nowIso;

    // Increment stock for each item in the PO
    po.items.forEach(item => {
      const prod = inMemoryDb.products.find(p => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stockQuantity;
        prod.stockQuantity += item.quantity;
        prod.purchasePrice = item.unitCost;
        prod.updatedAt = nowIso;

        inMemoryDb.stockMovements.unshift({
          id: `mov-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'PURCHASE_RESTOCK',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          unitCost: item.unitCost,
          referenceId: po.orderNumber,
          note: `Received from supplier ${po.supplierName}`,
          date: nowIso,
        });
      }
    });

    saveDatabase(inMemoryDb);
    return po;
  },

  deletePurchaseOrder: (id: string) => {
    inMemoryDb.purchaseOrders = inMemoryDb.purchaseOrders.filter(p => p.id !== id);
    saveDatabase(inMemoryDb);
    return true;
  },

  // Quotations
  createQuotation: (input: {
    clientId: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; discountPercentage?: number }>;
    taxRate?: number;
    validUntil?: string;
    notes?: string;
  }) => {
    const client = inMemoryDb.clients.find(c => c.id === input.clientId);
    if (!client || !input.items || input.items.length === 0) return null;

    let subtotal = 0;
    let totalDiscount = 0;
    const quoteItems: QuotationItem[] = [];

    for (const item of input.items) {
      const product = inMemoryDb.products.find(p => p.id === item.productId);
      if (!product) continue;

      const qty = Math.max(1, item.quantity);
      const price = item.unitPrice ?? product.sellingPrice;
      const disc = item.discountPercentage ?? 0;
      const discounted = price * (1 - disc / 100);
      const total = discounted * qty;

      subtotal += price * qty;
      totalDiscount += (price * (disc / 100)) * qty;

      quoteItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitPrice: price,
        discountPercentage: disc,
        total: Math.round(total * 100) / 100,
      });
    }

    if (quoteItems.length === 0) return null;

    const taxRate = input.taxRate ?? 0;
    const taxable = subtotal - totalDiscount;
    const taxAmount = (taxable * taxRate) / 100;
    const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

    const count = inMemoryDb.quotations.length + 1;
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const defaultValidity = new Date();
    defaultValidity.setDate(defaultValidity.getDate() + 30);

    const quotation: Quotation = {
      id: `quot-${Date.now()}`,
      quotationNumber,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      items: quoteItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      grandTotal,
      status: 'SENT',
      date: new Date().toISOString(),
      validUntil: input.validUntil || defaultValidity.toISOString(),
      notes: input.notes,
    };

    inMemoryDb.quotations.unshift(quotation);
    saveDatabase(inMemoryDb);
    return quotation;
  },

  updateQuotationStatus: (id: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED') => {
    const quote = inMemoryDb.quotations.find(q => q.id === id);
    if (!quote) return null;
    quote.status = status;
    saveDatabase(inMemoryDb);
    return quote;
  },

  convertQuotationToInvoice: (id: string) => {
    const quote = inMemoryDb.quotations.find(q => q.id === id);
    if (!quote || quote.status === 'CONVERTED') return null;

    // Create sale invoice from quote
    const invoice = db.createSale({
      clientId: quote.clientId,
      items: quote.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitSellingPrice: i.unitPrice,
        discountPercentage: i.discountPercentage,
      })),
      taxRate: quote.taxRate,
      paymentMethod: 'CREDIT',
      notes: `Converted from Quotation ${quote.quotationNumber}. ${quote.notes || ''}`,
    });

    if (invoice) {
      quote.status = 'CONVERTED';
      quote.convertedInvoiceId = invoice.id;
      saveDatabase(inMemoryDb);
    }

    return { quotation: quote, invoice };
  },

  deleteQuotation: (id: string) => {
    inMemoryDb.quotations = inMemoryDb.quotations.filter(q => q.id !== id);
    saveDatabase(inMemoryDb);
    return true;
  },

  // Returns & Refunds
  processReturn: (returnData: {
    invoiceId: string;
    items: {
      productId: string;
      quantity: number;
      reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE_OF_MIND' | 'DAMAGED' | 'OTHER';
      restockItem: boolean;
    }[];
    restockingFee?: number;
    refundMethod: 'CASH' | 'CARD' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    notes?: string;
  }) => {
    const invoice = inMemoryDb.sales.find(s => s.id === returnData.invoiceId);
    if (!invoice) return null;

    const returnNumber = `RET-2026-${String(inMemoryDb.returns.length + 1).padStart(3, '0')}`;
    let totalRefund = 0;
    const processedItems = [];

    for (const retItem of returnData.items) {
      const saleItem = invoice.items.find(i => i.productId === retItem.productId);
      const product = inMemoryDb.products.find(p => p.id === retItem.productId);
      if (!saleItem || !product) continue;

      const unitPriceAfterDiscount = saleItem.unitSellingPrice * (1 - saleItem.discountPercentage / 100);
      const itemRefund = Math.round(unitPriceAfterDiscount * retItem.quantity * 100) / 100;
      totalRefund += itemRefund;

      processedItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: retItem.quantity,
        unitPrice: unitPriceAfterDiscount,
        totalRefund: itemRefund,
        total: itemRefund,
        reason: retItem.reason,
        restockItem: retItem.restockItem,
      });

      // If restocking is enabled, increase product stock and log movement
      if (retItem.restockItem) {
        const prevStock = product.stockQuantity;
        product.stockQuantity += retItem.quantity;
        product.updatedAt = new Date().toISOString();

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'RETURN',
          quantity: retItem.quantity,
          previousStock: prevStock,
          newStock: product.stockQuantity,
          unitCost: product.purchasePrice,
          referenceId: returnNumber,
          note: `Customer return from ${invoice.invoiceNumber} (${retItem.reason})`,
          date: new Date().toISOString(),
        };
        inMemoryDb.stockMovements.unshift(movement);
      }
    }

    const restockingFee = returnData.restockingFee || 0;
    const netRefundAmount = Math.max(0, Math.round((totalRefund - restockingFee) * 100) / 100);

    const newReturn: SaleReturn = {
      id: `ret-${Date.now()}`,
      returnNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      items: processedItems,
      totalRefundAmount: totalRefund,
      restockingFee,
      netRefundAmount,
      itemsTotal: totalRefund,
      refundMethod: returnData.refundMethod,
      notes: returnData.notes,
      date: new Date().toISOString(),
    };

    inMemoryDb.returns.unshift(newReturn);

    // Adjust client balance if store credit or debt was affected
    const client = inMemoryDb.clients.find(c => c.id === invoice.clientId);
    if (client) {
      if (returnData.refundMethod === 'STORE_CREDIT') {
        client.outstandingBalance = Math.max(0, client.outstandingBalance - netRefundAmount);
      }
    }

    saveDatabase(inMemoryDb);
    return { saleReturn: newReturn, invoice, client };
  },

  getReturns: () => inMemoryDb.returns,

  // Settings
  getSettings: () => inMemoryDb.settings,

  updateSettings: (newSettings: Partial<CompanySettings>) => {
    inMemoryDb.settings = {
      ...inMemoryDb.settings,
      ...newSettings,
    };
    saveDatabase(inMemoryDb);
    return inMemoryDb.settings;
  },

  // Computed metrics helper
  getMetrics: () => {
    const sales = inMemoryDb.sales;
    const products = inMemoryDb.products;
    const expenses = inMemoryDb.expenses;

    const totalRevenue = Math.round(sales.reduce((acc, s) => acc + s.grandTotal, 0) * 100) / 100;
    const totalCollected = Math.round(sales.reduce((acc, s) => acc + s.amountPaid, 0) * 100) / 100;
    const totalCostOfGoodsSold = Math.round(sales.reduce((acc, s) => acc + s.totalCost, 0) * 100) / 100;
    const grossProfit = Math.round((totalRevenue - totalCostOfGoodsSold) * 100) / 100;
    const totalExpenses = Math.round(expenses.reduce((acc, e) => acc + e.amount, 0) * 100) / 100;
    const netProfit = Math.round((grossProfit - totalExpenses) * 100) / 100;
    const totalPendingReceivables = Math.round(sales.reduce((acc, s) => acc + s.amountDue, 0) * 100) / 100;
    const inventoryCostValue = Math.round(products.reduce((acc, p) => acc + p.purchasePrice * p.stockQuantity, 0) * 100) / 100;
    const inventoryRetailValue = Math.round(products.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0) * 100) / 100;
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockThreshold);

    return {
      totalRevenue,
      totalCollected,
      totalCostOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      totalPendingReceivables,
      inventoryCostValue,
      inventoryRetailValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    };
  },
};
