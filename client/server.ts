import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';

// ==========================================
// AUTHENTICATION SYSTEM
// ==========================================
interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
}

interface SessionToken {
  userId: string;
  username: string;
  role: string;
  expiresAt: number;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const users: AuthUser[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Admin User',
    role: 'admin',
    email: 'admin@nexuserp.com',
  },
];

const userPasswords: Record<string, string> = {
  '1': 'admin123',
};

const activeTokens: Map<string, SessionToken> = new Map();

function generateToken(): string {
  return Buffer.from(`${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`).toString('base64');
}

function validateToken(token: string): SessionToken | null {
  const session = activeTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token);
    return null;
  }
  return session;
}

function requireAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Access token required' });
    return;
  }
  const token = authHeader.substring(7);
  const session = validateToken(token);
  if (!session) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }
  (req as any).user = { id: session.userId, username: session.username, role: session.role };
  next();
}

// ==========================================
// REAL-TIME SERVER-SENT EVENTS (SSE) SYSTEM
// ==========================================
interface SSEClient {
  id: string;
  res: Response;
}

let sseClients: SSEClient[] = [];

function broadcastEvent(type: string, payload: any) {
  const eventData = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString(),
  });
  const sseMessage = `event: erp_event\ndata: ${eventData}\n\n`;

  sseClients = sseClients.filter(client => {
    try {
      client.res.write(sseMessage);
      return true;
    } catch {
      return false;
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

   // Middleware for parsing JSON requests
   app.use(express.json());

   // ==========================================
   // REAL-TIME SSE ENDPOINT
   // ==========================================
   app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const clientId = `term_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newClient: SSEClient = { id: clientId, res };
    sseClients.push(newClient);

    // Initial connection handshake
    const welcomeData = JSON.stringify({
      clientId,
      activeConnections: sseClients.length,
      timestamp: new Date().toISOString(),
    });
    res.write(`event: connected\ndata: ${welcomeData}\n\n`);

    // Notify all active terminals about updated presence
    broadcastEvent('PRESENCE_UPDATED', { activeConnections: sseClients.length });

    // Periodic keep-alive ping every 12 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString(), activeConnections: sseClients.length })}\n\n`);
      } catch {
        clearInterval(pingInterval);
      }
    }, 12000);

    req.on('close', () => {
      clearInterval(pingInterval);
      sseClients = sseClients.filter(c => c.id !== clientId);
      broadcastEvent('PRESENCE_UPDATED', { activeConnections: sseClients.length });
    });

    // Vercel serverless timeout: close connection after 50 seconds
    // to avoid cold hangs before the platform drops the function.
    setTimeout(() => {
      try { res.end(); } catch {}
    }, 50000);
   });

  // ==========================================
  // AUTH ENDPOINTS
  // ==========================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required' });
      return;
    }
    const user = users.find(u => u.username === username);
    if (!user || userPasswords[user.id] !== password) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    const token = generateToken();
    const expiresAt = Date.now() + SESSION_DURATION;
    activeTokens.set(token, { userId: user.id, username: user.username, role: user.role, expiresAt });
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email },
      },
    });
  });

  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const user = users.find(u => u.id === (req as any).user.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email },
    });
  });

  // Health check & Server Status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Nexus ERP Enterprise Real-Time Backend',
      timestamp: new Date().toISOString(),
      activeTerminals: sseClients.length,
      version: '1.2.0',
    });
  });

  // Fetch all initial data in one bundle for rapid bootstrap
  app.get('/api/bootstrap', (req: Request, res: Response) => {
    const data = db.get();
    const metrics = db.getMetrics();
    res.json({
      success: true,
      data: {
        products: data.products,
        categories: data.categories,
        clients: data.clients,
        sales: data.sales,
        expenses: data.expenses,
        stockMovements: data.stockMovements,
        suppliers: data.suppliers,
        purchaseOrders: data.purchaseOrders,
        quotations: data.quotations,
        metrics,
        activeTerminals: sseClients.length,
        lastUpdated: data.lastUpdated,
      },
    });
  });

  // Export full database backup
  app.get('/api/backup', (req: Request, res: Response) => {
    const data = db.get();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=nexus_erp_backup_${new Date().toISOString().split('T')[0]}.json`);
    res.json(data);
  });

  // Restore database backup
  app.post('/api/restore', (req: Request, res: Response) => {
    try {
      const backupData = req.body;
      if (!backupData || (!backupData.products && !backupData.sales)) {
        res.status(400).json({ success: false, error: 'Invalid backup file format' });
        return;
      }
      const restored = db.restore(backupData);
      broadcastEvent('DB_RESTORED', { message: 'Database restored from backup', data: restored });
      res.json({ success: true, message: 'Database successfully restored from backup', data: restored });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset demo database to initial seed
  app.post('/api/reset', (req: Request, res: Response) => {
    const data = db.reset();
    broadcastEvent('DB_RESET', { message: 'Database reset to demo state', data });
    res.json({
      success: true,
      message: 'Database reset to initial demo state successfully',
      data,
    });
  });

  // Reset database to empty state
  app.post('/api/reset-empty', (req: Request, res: Response) => {
    const data = db.clear();
    broadcastEvent('DB_RESET', { message: 'Database cleared', data });
    res.json({
      success: true,
      message: 'Database cleared successfully',
      data,
    });
  });

  // Metrics
  app.get('/api/metrics', (req: Request, res: Response) => {
    const metrics = db.getMetrics();
    res.json({ success: true, data: metrics });
  });

  // --- PRODUCTS ---
  app.get('/api/products', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().products });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const { name, sku, category, purchasePrice, sellingPrice, stockQuantity, minStockThreshold, unit, description } = req.body;
      if (!name || !sku || !category) {
        res.status(400).json({ success: false, error: 'Product name, SKU, and category are required' });
        return;
      }
      const product = db.addProduct({
        name,
        sku,
        category,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        stockQuantity: Number(stockQuantity) || 0,
        minStockThreshold: Number(minStockThreshold) || 5,
        unit: unit || 'pcs',
        description,
      });
      broadcastEvent('PRODUCT_CREATED', { product });
      res.status(201).json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const product = db.updateProduct(req.params.id, req.body);
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    broadcastEvent('PRODUCT_UPDATED', { product });
    res.json({ success: true, data: product });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const success = db.deleteProduct(req.params.id);
    if (success) {
      broadcastEvent('PRODUCT_DELETED', { productId: req.params.id });
    }
    res.json({ success });
  });

  app.post('/api/products/:id/restock', (req: Request, res: Response) => {
    const { quantity, unitCost, notes, supplierName } = req.body;
    if (!quantity || Number(quantity) <= 0) {
      res.status(400).json({ success: false, error: 'Valid restock quantity is required' });
      return;
    }
    const result = db.restockProduct(
      req.params.id,
      Number(quantity),
      unitCost !== undefined ? Number(unitCost) : undefined,
      notes,
      supplierName
    );
    if (!result) {
      res.status(404).json({ success: false, error: 'Product not found or invalid quantity' });
      return;
    }
    broadcastEvent('STOCK_RESTOCKED', {
      product: result.product,
      movement: result.movement,
      message: `Restocked ${result.product.name} (+${quantity} ${result.product.unit})`,
    });
    res.json({ success: true, data: result });
  });

  app.post('/api/products/:id/adjust', (req: Request, res: Response) => {
    const { newStock, reason } = req.body;
    if (newStock === undefined || Number(newStock) < 0) {
      res.status(400).json({ success: false, error: 'Valid stock quantity is required' });
      return;
    }
    const result = db.adjustStock(req.params.id, Number(newStock), reason);
    if (!result) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    broadcastEvent('STOCK_ADJUSTED', {
      product: result.product,
      movement: result.movement,
      message: `Stock adjusted for ${result.product.name} to ${newStock} ${result.product.unit}`,
    });
    res.json({ success: true, data: result });
  });

  // --- CATEGORIES ---
  app.get('/api/categories', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().categories });
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const { name, description, color } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Category name is required' });
      return;
    }
    const cat = db.addCategory({ name, description, color });
    broadcastEvent('CATEGORY_CREATED', { category: cat });
    res.status(201).json({ success: true, data: cat });
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    db.deleteCategory(req.params.id);
    broadcastEvent('CATEGORY_DELETED', { categoryId: req.params.id });
    res.json({ success: true });
  });

  // --- CLIENTS ---
  app.get('/api/clients', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().clients });
  });

  app.post('/api/clients', (req: Request, res: Response) => {
    const { name, company, email, phone, address, taxNumber, creditLimit } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Client name is required' });
      return;
    }
    const client = db.addClient({
      name,
      company,
      email: email || '',
      phone: phone || '',
      address,
      taxNumber,
      creditLimit: Number(creditLimit) || 0,
    });
    broadcastEvent('CLIENT_CREATED', { client });
    res.status(201).json({ success: true, data: client });
  });

  app.put('/api/clients/:id', (req: Request, res: Response) => {
    const client = db.updateClient(req.params.id, req.body);
    if (!client) {
      res.status(404).json({ success: false, error: 'Client not found' });
      return;
    }
    broadcastEvent('CLIENT_UPDATED', { client });
    res.json({ success: true, data: client });
  });

  app.delete('/api/clients/:id', (req: Request, res: Response) => {
    db.deleteClient(req.params.id);
    broadcastEvent('CLIENT_DELETED', { clientId: req.params.id });
    res.json({ success: true });
  });

  // --- SALES & INVOICES ---
  app.get('/api/sales', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().sales });
  });

  app.post('/api/sales', (req: Request, res: Response) => {
    try {
      const { clientId, items, taxRate, paymentMethod, initialAmountPaid, notes, dueDate } = req.body;
      if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: 'Client ID and product items are required' });
        return;
      }
      const invoice = db.createSale({
        clientId,
        items,
        taxRate: Number(taxRate) || 0,
        paymentMethod: paymentMethod || 'CASH',
        initialAmountPaid: initialAmountPaid !== undefined ? Number(initialAmountPaid) : undefined,
        notes,
        dueDate,
      });

      if (!invoice) {
        res.status(400).json({ success: false, error: 'Could not create sale invoice with the provided items' });
        return;
      }

      // Broadcast new sale and updated database items (products inventory deducted, movements, client balances)
      broadcastEvent('SALE_CREATED', {
        invoice,
        products: db.get().products,
        clients: db.get().clients,
        stockMovements: db.get().stockMovements,
        message: `New sale #${invoice.invoiceNumber} ($${invoice.grandTotal.toFixed(2)}) for ${invoice.clientName}`,
      });

      res.status(201).json({ success: true, data: invoice });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/sales/:id', (req: Request, res: Response) => {
    const success = db.deleteSale(req.params.id);
    if (success) {
      broadcastEvent('SALE_DELETED', {
        saleId: req.params.id,
        products: db.get().products,
        clients: db.get().clients,
        stockMovements: db.get().stockMovements,
      });
    }
    res.json({ success });
  });

  app.post('/api/sales/:id/payments', (req: Request, res: Response) => {
    const { amount, method, note } = req.body;
    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: 'Valid payment amount is required' });
      return;
    }
    const result = db.recordPayment(req.params.id, Number(amount), method || 'CASH', note);
    if (!result) {
      res.status(404).json({ success: false, error: 'Sale invoice not found' });
      return;
    }
    const client = db.get().clients.find(c => c.id === result.sale.clientId);
    broadcastEvent('PAYMENT_RECORDED', {
      sale: result.sale,
      payment: result.payment,
      client,
      message: `Payment of $${Number(amount).toFixed(2)} recorded for ${result.sale.invoiceNumber}`,
    });
    res.json({ success: true, data: result });
  });

  // --- EXPENSES ---
  app.get('/api/expenses', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().expenses });
  });

  app.post('/api/expenses', (req: Request, res: Response) => {
    const { title, category, amount, paymentMethod, date, reference, notes } = req.body;
    if (!title || !amount) {
      res.status(400).json({ success: false, error: 'Title and amount are required' });
      return;
    }
    const expense = db.addExpense({
      title,
      category: category || 'Other',
      amount: Number(amount) || 0,
      paymentMethod: paymentMethod || 'CASH',
      date: date || new Date().toISOString(),
      reference,
      notes,
    });
    broadcastEvent('EXPENSE_ADDED', {
      expense,
      message: `Expense recorded: ${expense.title} ($${expense.amount.toFixed(2)})`,
    });
    res.status(201).json({ success: true, data: expense });
  });

  app.delete('/api/expenses/:id', (req: Request, res: Response) => {
    db.deleteExpense(req.params.id);
    broadcastEvent('EXPENSE_DELETED', { expenseId: req.params.id });
    res.json({ success: true });
  });

  // --- SUPPLIERS ---
  app.get('/api/suppliers', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().suppliers });
  });

  app.post('/api/suppliers', (req: Request, res: Response) => {
    try {
      const { name, contactPerson, email, phone, address, paymentTerms, taxNumber } = req.body;
      if (!name || !email || !phone) {
        res.status(400).json({ success: false, error: 'Supplier name, email, and phone are required' });
        return;
      }
      const supplier = db.addSupplier({
        name,
        contactPerson: contactPerson || name,
        email,
        phone,
        address,
        paymentTerms: paymentTerms || 'NET_30',
        taxNumber,
      });
      broadcastEvent('SUPPLIER_CREATED', { supplier });
      res.status(201).json({ success: true, data: supplier });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/suppliers/:id', (req: Request, res: Response) => {
    const supplier = db.updateSupplier(req.params.id, req.body);
    if (!supplier) {
      res.status(404).json({ success: false, error: 'Supplier not found' });
      return;
    }
    broadcastEvent('SUPPLIER_UPDATED', { supplier });
    res.json({ success: true, data: supplier });
  });

  app.delete('/api/suppliers/:id', (req: Request, res: Response) => {
    db.deleteSupplier(req.params.id);
    broadcastEvent('SUPPLIER_DELETED', { supplierId: req.params.id });
    res.json({ success: true });
  });

  // --- PURCHASE ORDERS ---
  app.get('/api/purchase-orders', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().purchaseOrders });
  });

  app.post('/api/purchase-orders', (req: Request, res: Response) => {
    try {
      const { supplierId, items, expectedDeliveryDate, notes } = req.body;
      if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: 'Supplier and items are required' });
        return;
      }
      const po = db.createPurchaseOrder({
        supplierId,
        items,
        expectedDeliveryDate,
        notes,
      });
      if (!po) {
        res.status(400).json({ success: false, error: 'Failed to create purchase order' });
        return;
      }
      broadcastEvent('PO_CREATED', {
        purchaseOrder: po,
        message: `PO #${po.orderNumber} created with ${po.supplierName}`,
      });
      res.status(201).json({ success: true, data: po });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/purchase-orders/:id/status', (req: Request, res: Response) => {
    const { status } = req.body;
    const po = db.updatePurchaseOrderStatus(req.params.id, status);
    if (!po) {
      res.status(404).json({ success: false, error: 'Purchase order not found' });
      return;
    }
    broadcastEvent('PO_UPDATED', { purchaseOrder: po });
    res.json({ success: true, data: po });
  });

  app.post('/api/purchase-orders/:id/receive', (req: Request, res: Response) => {
    const po = db.receivePurchaseOrder(req.params.id);
    if (!po) {
      res.status(400).json({ success: false, error: 'Purchase order could not be received or is already received' });
      return;
    }
    broadcastEvent('PO_RECEIVED', {
      purchaseOrder: po,
      products: db.get().products,
      stockMovements: db.get().stockMovements,
      message: `Purchase Order #${po.orderNumber} received into inventory!`,
    });
    res.json({ success: true, data: po, message: 'Stock received and inventory automatically updated.' });
  });

  app.delete('/api/purchase-orders/:id', (req: Request, res: Response) => {
    db.deletePurchaseOrder(req.params.id);
    broadcastEvent('PO_DELETED', { poId: req.params.id });
    res.json({ success: true });
  });

  // --- QUOTATIONS ---
  app.get('/api/quotations', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().quotations });
  });

  app.post('/api/quotations', (req: Request, res: Response) => {
    try {
      const { clientId, items, taxRate, validUntil, notes } = req.body;
      if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: 'Client and items are required' });
        return;
      }
      const quote = db.createQuotation({
        clientId,
        items,
        taxRate: Number(taxRate) || 0,
        validUntil,
        notes,
      });
      if (!quote) {
        res.status(400).json({ success: false, error: 'Failed to create quotation' });
        return;
      }
      broadcastEvent('QUOTATION_CREATED', {
        quotation: quote,
        message: `Quotation #${quote.quotationNumber} generated for ${quote.clientName}`,
      });
      res.status(201).json({ success: true, data: quote });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/quotations/:id/status', (req: Request, res: Response) => {
    const { status } = req.body;
    const quote = db.updateQuotationStatus(req.params.id, status);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Quotation not found' });
      return;
    }
    broadcastEvent('QUOTATION_UPDATED', { quotation: quote });
    res.json({ success: true, data: quote });
  });

  app.post('/api/quotations/:id/convert', (req: Request, res: Response) => {
    const result = db.convertQuotationToInvoice(req.params.id);
    if (!result) {
      res.status(400).json({ success: false, error: 'Quotation could not be converted or already converted' });
      return;
    }
    broadcastEvent('QUOTATION_CONVERTED', {
      quotation: result.quotation,
      invoice: result.invoice,
      products: db.get().products,
      sales: db.get().sales,
      clients: db.get().clients,
      stockMovements: db.get().stockMovements,
      message: `Quotation #${result.quotation.quotationNumber} converted into Invoice #${result.invoice.invoiceNumber}`,
    });
    res.json({ success: true, data: result, message: 'Quotation successfully converted to Sale Invoice.' });
  });

  app.delete('/api/quotations/:id', (req: Request, res: Response) => {
    db.deleteQuotation(req.params.id);
    broadcastEvent('QUOTATION_DELETED', { quotationId: req.params.id });
    res.json({ success: true });
  });

  // --- RETURNS & REFUNDS ---
  app.get('/api/returns', (req: Request, res: Response) => {
    res.json({ success: true, data: db.getReturns() });
  });

  app.post('/api/returns', (req: Request, res: Response) => {
    try {
      const { invoiceId, items, restockingFee, refundMethod, notes } = req.body;
      if (!invoiceId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, error: 'Invoice ID and return items are required' });
        return;
      }
      const result = db.processReturn({
        invoiceId,
        items,
        restockingFee: Number(restockingFee) || 0,
        refundMethod: refundMethod || 'CASH',
        notes,
      });

      if (!result) {
        res.status(400).json({ success: false, error: 'Failed to process return. Check invoice or items.' });
        return;
      }

      broadcastEvent('RETURN_PROCESSED', {
        saleReturn: result.saleReturn,
        products: db.get().products,
        stockMovements: db.get().stockMovements,
        clients: db.get().clients,
        message: `Return #${result.saleReturn.returnNumber} processed ($${result.saleReturn.netRefundAmount.toFixed(2)}) for Invoice #${result.saleReturn.invoiceNumber}`,
      });

      res.status(201).json({ success: true, data: result.saleReturn, message: 'Return processed and inventory updated.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- COMPANY SETTINGS ---
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ success: true, data: db.getSettings() });
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    try {
      const updated = db.updateSettings(req.body);
      broadcastEvent('SETTINGS_UPDATED', {
        settings: updated,
        message: 'Company configuration and theme settings updated across all devices.',
      });
      res.json({ success: true, data: updated, message: 'Settings successfully saved.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- STOCK MOVEMENT LOGS ---
  app.get('/api/stock-movements', (req: Request, res: Response) => {
    res.json({ success: true, data: db.get().stockMovements });
  });

  // ==========================================
  // VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\u{1F680} Nexus ERP Real-Time Server running on http://localhost:${PORT}`);
  });
}

startServer();

