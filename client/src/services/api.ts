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

// Dynamic API base URL:
// - Development: empty string (Vite dev proxy handles /api/* → localhost:4000)
// - Production: reads from VITE_API_URL or defaults to the deployed backend https://erpbestapi.vercel.app
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://erpbestapi.vercel.app')
).replace(/\/+$/, '');

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

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

const checkAuthError = (res: Response) => {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('erp_token');
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
};

export const api = {
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const json = await res.json();
    return json.data;
  },

  async getCurrentUser(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      checkAuthError(res);
      throw new Error('Failed to fetch user');
    }
    const json = await res.json();
    return json.data;
  },

  async getBootstrapData(): Promise<BootstrapResponse> {
    const res = await fetch(`${API_BASE_URL}/api/bootstrap`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      checkAuthError(res);
      throw new Error('Failed to fetch bootstrap data');
    }
    const json = await res.json();
    return json.data;
  },

  async resetDatabase(): Promise<BootstrapResponse> {
    const res = await fetch(`${API_BASE_URL}/api/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset database');
    const json = await res.json();
    return json.data;
  },

  async resetToEmptyDatabase(): Promise<BootstrapResponse> {
    const res = await fetch(`${API_BASE_URL}/api/reset-empty`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear database');
    const json = await res.json();
    return json.data;
  },

  async restoreDatabase(backupData: any): Promise<BootstrapResponse> {
    const res = await fetch(`${API_BASE_URL}/api/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(backupData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to restore database');
    }
    const json = await res.json();
    return json.data;
  },

  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return json.data;
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch product');
    const json = await res.json();
    return json.data;
  },

  async addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add product');
    const json = await res.json();
    return json.data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update product');
    const json = await res.json();
    return json.data;
  },

  async deleteProduct(id: string, permanent: boolean = false): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async restoreProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to restore product');
    const json = await res.json();
    return json.data;
  },

  async restockProduct(
    productId: string,
    quantity: number,
    unitCost?: number,
    notes?: string,
    supplierName?: string
  ): Promise<{ product: Product; movement: StockMovement }> {
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
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
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ newStock, reason }),
    });
    if (!res.ok) throw new Error('Failed to adjust stock');
    const json = await res.json();
    return json.data;
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    const json = await res.json();
    return json.data;
  },

  async addCategory(data: Omit<Category, 'id'>): Promise<Category> {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add category');
    const json = await res.json();
    return json.data;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async getClients(): Promise<Client[]> {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch clients');
    const json = await res.json();
    return json.data;
  },

  async getClient(id: string): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch client');
    const json = await res.json();
    return json.data;
  },

  async addClient(
    data: Omit<Client, 'id' | 'totalSpent' | 'outstandingBalance' | 'createdAt'>
  ): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add client');
    const json = await res.json();
    return json.data;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update client');
    const json = await res.json();
    return json.data;
  },

  async deleteClient(id: string, permanent: boolean = false): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async restoreClient(id: string): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/api/clients/${id}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to restore client');
    const json = await res.json();
    return json.data;
  },

  async getSales(): Promise<SaleInvoice[]> {
    const res = await fetch(`${API_BASE_URL}/api/sales`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch sales');
    const json = await res.json();
    return json.data;
  },

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
    const res = await fetch(`${API_BASE_URL}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
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
    const res = await fetch(`${API_BASE_URL}/api/sales/${saleId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ amount, method, note }),
    });
    if (!res.ok) throw new Error('Failed to record payment');
    const json = await res.json();
    return json.data;
  },

  async deleteSale(saleId: string, permanent: boolean = false): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/sales/${saleId}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async restoreSale(saleId: string): Promise<SaleInvoice> {
    const res = await fetch(`${API_BASE_URL}/api/sales/${saleId}/restore`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to restore sale');
    const json = await res.json();
    return json.data;
  },

  async getExpenses(): Promise<Expense[]> {
    const res = await fetch(`${API_BASE_URL}/api/expenses`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    const json = await res.json();
    return json.data;
  },

  async addExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
    const res = await fetch(`${API_BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add expense');
    const json = await res.json();
    return json.data;
  },

  async deleteExpense(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    const json = await res.json();
    return json.data;
  },

  async addSupplier(data: Omit<Supplier, 'id' | 'totalPurchased' | 'createdAt'>): Promise<Supplier> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add supplier');
    const json = await res.json();
    return json.data;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update supplier');
    const json = await res.json();
    return json.data;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const res = await fetch(`${API_BASE_URL}/api/purchase-orders`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch purchase orders');
    const json = await res.json();
    return json.data;
  },

  async createPurchaseOrder(data: {
    supplierId: string;
    items: Array<{ productId: string; quantity: number; unitCost: number }>;
    expectedDeliveryDate?: string;
    notes?: string;
  }): Promise<PurchaseOrder> {
    const res = await fetch(`${API_BASE_URL}/api/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create purchase order');
    }
    const json = await res.json();
    return json.data;
  },

  async updatePurchaseOrderStatus(
    id: string,
    status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'
  ): Promise<PurchaseOrder> {
    const res = await fetch(`${API_BASE_URL}/api/purchase-orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update PO status');
    const json = await res.json();
    return json.data;
  },

  async receivePurchaseOrder(id: string): Promise<{ data: PurchaseOrder; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/purchase-orders/${id}/receive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to receive purchase order');
    }
    return await res.json();
  },

  async deletePurchaseOrder(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/purchase-orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async getQuotations(): Promise<Quotation[]> {
    const res = await fetch(`${API_BASE_URL}/api/quotations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch quotations');
    const json = await res.json();
    return json.data;
  },

  async createQuotation(data: {
    clientId: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; discountPercentage?: number }>;
    taxRate?: number;
    validUntil?: string;
    notes?: string;
  }): Promise<Quotation> {
    const res = await fetch(`${API_BASE_URL}/api/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create quotation');
    }
    const json = await res.json();
    return json.data;
  },

  async updateQuotationStatus(
    id: string,
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED'
  ): Promise<Quotation> {
    const res = await fetch(`${API_BASE_URL}/api/quotations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update quotation status');
    const json = await res.json();
    return json.data;
  },

  async convertQuotationToInvoice(id: string): Promise<{ data: { quotation: Quotation; invoice: SaleInvoice }; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/quotations/${id}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to convert quotation');
    }
    return await res.json();
  },

  async deleteQuotation(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/quotations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async getReturns(): Promise<SaleReturn[]> {
    const res = await fetch(`${API_BASE_URL}/api/returns`, {
      headers: getAuthHeaders(),
    });
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
    const res = await fetch(`${API_BASE_URL}/api/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process return');
    }
    const json = await res.json();
    return json.data;
  },

  async getSettings(): Promise<CompanySettings> {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update settings');
    }
    const json = await res.json();
    return json.data;
  },

  // ─── User Management ─────────────────────────────────────
  async getUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      checkAuthError(res);
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch users');
    }
    const json = await res.json();
    return json.data;
  },

  async createUser(data: {
    username: string;
    password: string;
    role: string;
    name?: string;
    email?: string;
    customPermissions?: string[];
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create user');
    }
    return (await res.json()).data;
  },

  async updateUser(id: string, data: Partial<{
    username: string;
    password: string;
    role: string;
    name: string;
    email: string;
    customPermissions: string[];
    isActive: boolean;
  }>): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update user');
    }
    return (await res.json()).data;
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete user');
    }
  },

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change password');
    }
  },
};

