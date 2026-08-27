import {
  Category,
  Client,
  CompanySettings,
  Expense,
  PaymentMethod,
  Product,
  PurchaseOrder,
  Quotation,
  SaleInvoice,
  SaleReturn,
  StockMovement,
  Supplier,
} from '../types/erp';

export interface BootstrapResponse {
  products: Product[];
  categories: Category[];
  clients: Client[];
  sales: SaleInvoice[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  quotations: Quotation[];
  returns?: SaleReturn[];
  settings?: CompanySettings;
  metrics: any;
  lastUpdated: string;
  activeTerminals?: number;
}

export const api = {
  // Bootstrap
  async getBootstrapData(): Promise<BootstrapResponse> {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) throw new Error('Failed to fetch bootstrap data');
    const json = await res.json();
    return json.data;
  },

  // Reset demo
  async resetDatabase(): Promise<BootstrapResponse> {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
    const json = await res.json();
    return json.data;
  },

  // Restore
  async restoreDatabase(backupData: any): Promise<BootstrapResponse> {
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to restore database');
    }
    const json = await res.json();
    return json.data;
  },

  // Products
  async addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add product');
    const json = await res.json();
    return json.data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update product');
    const json = await res.json();
    return json.data;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async restockProduct(
    productId: string,
    quantity: number,
    unitCost?: number,
    notes?: string,
    supplierName?: string
  ): Promise<{ product: Product; movement: StockMovement }> {
    const res = await fetch(`/api/products/${productId}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, unitCost, notes, supplierName }),
    });
    if (!res.ok) throw new Error('Failed to restock product');
    const json = await res.json();
    return json.data;
  },

  async adjustStock(
    productId: string,
    newStock: number,
    reason: string
  ): Promise<{ product: Product; movement: StockMovement }> {
    const res = await fetch(`/api/products/${productId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStock, reason }),
    });
    if (!res.ok) throw new Error('Failed to adjust stock');
    const json = await res.json();
    return json.data;
  },

  // Categories
  async addCategory(data: Omit<Category, 'id'>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add category');
    const json = await res.json();
    return json.data;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Clients
  async addClient(
    data: Omit<Client, 'id' | 'totalSpent' | 'outstandingBalance' | 'createdAt'>
  ): Promise<Client> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add client');
    const json = await res.json();
    return json.data;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update client');
    const json = await res.json();
    return json.data;
  },

  async deleteClient(id: string): Promise<boolean> {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Sales
  async createSale(data: {
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
  }): Promise<SaleInvoice> {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create sale');
    }
    const json = await res.json();
    return json.data;
  },

  async recordPayment(
    saleId: string,
    amount: number,
    method: PaymentMethod,
    note?: string
  ): Promise<any> {
    const res = await fetch(`/api/sales/${saleId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method, note }),
    });
    if (!res.ok) throw new Error('Failed to record payment');
    const json = await res.json();
    return json.data;
  },

  async deleteSale(saleId: string): Promise<boolean> {
    const res = await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });
    return res.ok;
  },

  // Expenses
  async addExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add expense');
    const json = await res.json();
    return json.data;
  },

  async deleteExpense(id: string): Promise<boolean> {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Suppliers
  async addSupplier(data: Omit<Supplier, 'id' | 'totalPurchased' | 'createdAt'>): Promise<Supplier> {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add supplier');
    const json = await res.json();
    return json.data;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update supplier');
    const json = await res.json();
    return json.data;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Purchase Orders
  async createPurchaseOrder(data: {
    supplierId: string;
    items: Array<{ productId: string; quantity: number; unitCost: number }>;
    expectedDeliveryDate?: string;
    notes?: string;
  }): Promise<PurchaseOrder> {
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create purchase order');
    }
    const json = await res.json();
    return json.data;
  },

  async updatePurchaseOrderStatus(id: string, status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'): Promise<PurchaseOrder> {
    const res = await fetch(`/api/purchase-orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update PO status');
    const json = await res.json();
    return json.data;
  },

  async receivePurchaseOrder(id: string): Promise<{ data: PurchaseOrder; message: string }> {
    const res = await fetch(`/api/purchase-orders/${id}/receive`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to receive purchase order');
    }
    return await res.json();
  },

  async deletePurchaseOrder(id: string): Promise<boolean> {
    const res = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Quotations
  async createQuotation(data: {
    clientId: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; discountPercentage?: number }>;
    taxRate?: number;
    validUntil?: string;
    notes?: string;
  }): Promise<Quotation> {
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create quotation');
    }
    const json = await res.json();
    return json.data;
  },

  async updateQuotationStatus(id: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED'): Promise<Quotation> {
    const res = await fetch(`/api/quotations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update quotation status');
    const json = await res.json();
    return json.data;
  },

  async convertQuotationToInvoice(id: string): Promise<{ data: { quotation: Quotation; invoice: SaleInvoice }; message: string }> {
    const res = await fetch(`/api/quotations/${id}/convert`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to convert quotation');
    }
    return await res.json();
  },

  async deleteQuotation(id: string): Promise<boolean> {
    const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Returns & Refunds
  async getReturns(): Promise<SaleReturn[]> {
    const res = await fetch('/api/returns');
    if (!res.ok) throw new Error('Failed to fetch returns');
    const json = await res.json();
    return json.data;
  },

  async processReturn(data: {
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
  }): Promise<SaleReturn> {
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process return');
    }
    const json = await res.json();
    return json.data;
  },

  // Settings
  async getSettings(): Promise<CompanySettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update settings');
    }
    const json = await res.json();
    return json.data;
  },
};

