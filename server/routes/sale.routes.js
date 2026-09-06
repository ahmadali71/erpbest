import express from 'express';
import Sale from '../db/models/Sale.js';
import Product from '../db/models/Product.js';
import Client from '../db/models/Client.js';
import StockMovement from '../db/models/StockMovement.js';

const router = express.Router();

// Helper to check permissions from req.user
const hasAnyPermission = (req, ...required) => {
  if (req.user?.role === 'admin') return true;
  const perms = req.user?.effectivePermissions || [];
  return required.some(p => perms.includes(p));
};

// Get all sales
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { isDeleted: { $ne: true } };
    const sales = await Sale.find(filter).lean().sort({ date: -1 });
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single sale
router.get('/:id', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? { id: req.params.id } : { id: req.params.id, isDeleted: { $ne: true } };
    const sale = await Sale.findOne(filter).lean();
    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'sales.create')) {
      return res.status(403).json({ success: false, error: 'Access denied. Create sale permission required.' });
    }

    const { clientId, items, taxRate, paymentMethod, initialAmountPaid, notes, dueDate } = req.body;

    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Client ID and at least one item are required' });
    }

    // Find client
    const client = await Client.findOne({ id: clientId, isDeleted: { $ne: true } });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found or is inactive' });
    }

    // Calculate sale
    let subtotal = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    const saleItems = [];
    const newMovements = [];
    const productsToUpdate = [];

    for (const item of items) {
      const product = await Product.findOne({ id: item.productId, isDeleted: { $ne: true } });
      if (!product) continue;

      const qty = Math.max(1, item.quantity);
      const unitPrice = item.unitSellingPrice ?? product.sellingPrice;
      const discountPct = item.discountPercentage ?? 0;
      const discountedUnit = unitPrice * (1 - discountPct / 100);
      const lineTotal = discountedUnit * qty;
      const lineCost = product.purchasePrice * qty;
      const lineProfit = lineTotal - lineCost;

      subtotal += unitPrice * qty;
      totalDiscount += (unitPrice * (discountPct / 100)) * qty;
      totalCost += lineCost;

      saleItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitPurchasePrice: product.purchasePrice,
        unitSellingPrice: unitPrice,
        discountPercentage: discountPct,
        total: Math.round(lineTotal * 100) / 100,
        profit: Math.round(lineProfit * 100) / 100,
      });

      // Deduct stock
      const previousStock = product.stockQuantity;
      const newStock = Math.max(0, previousStock - qty);
      product.stockQuantity = newStock;
      product.updatedAt = new Date();
      productsToUpdate.push(product);

      newMovements.push({
        id: `mov-${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: 'SALE',
        quantity: -qty,
        previousStock,
        newStock,
        referenceId: `inv-${Date.now()}`,
        note: `Sold to ${client.name}`,
        date: new Date(),
      });
    }

    if (saleItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid products found in sale items' });
    }

    // Save all products with updated stock
    await Promise.all(productsToUpdate.map(p => p.save()));

    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = (taxableAmount * (taxRate ?? 0)) / 100;
    const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
    const netProfit = Math.round((taxableAmount - totalCost) * 100) / 100;

    let initialPayment = initialAmountPaid ?? 0;
    if (paymentMethod === 'CASH' && initialPayment === 0) {
      initialPayment = grandTotal;
    }
    initialPayment = Math.min(grandTotal, Math.max(0, initialPayment));

    const amountDue = Math.round((grandTotal - initialPayment) * 100) / 100;

    let paymentStatus = 'PENDING';
    if (amountDue <= 0.001) {
      paymentStatus = 'PAID';
    } else if (initialPayment > 0) {
      paymentStatus = 'PARTIAL';
    }

    const saleId = `inv-${Date.now()}`;
    const paymentsList = [];

    if (initialPayment > 0) {
      paymentsList.push({
        id: `pay-${Date.now()}`,
        saleId,
        amount: initialPayment,
        method: paymentMethod,
        date: new Date(),
        recordedBy: req.user?.username || req.user?.name || 'cashier',
        note: `Initial payment via ${paymentMethod.replace('_', ' ')}`,
      });
    }

    const newSale = {
      id: saleId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      clientId,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      items: saleItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate: taxRate ?? 0,
      grandTotal,
      totalCost: Math.round(totalCost * 100) / 100,
      profit: netProfit,
      amountPaid: initialPayment,
      amountDue,
      paymentStatus,
      paymentMethod,
      notes,
      dueDate,
      date: new Date(),
      payments: paymentsList,
      isDeleted: false,
    };

    // Save stock movements
    await StockMovement.insertMany(newMovements);

    // Save sale
    const sale = new Sale(newSale);
    await sale.save();

    // Update client balances
    client.totalSpent = Math.round((client.totalSpent + grandTotal) * 100) / 100;
    client.outstandingBalance = Math.round((client.outstandingBalance + amountDue) * 100) / 100;
    await client.save();

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete sale (Soft delete by administration/others, visible to admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'sales.delete')) {
      return res.status(403).json({ success: false, error: 'Access denied. Delete sale permission required.' });
    }

    const sale = await Sale.findOne({ id: req.params.id });
    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }

    const isAdmin = req.user?.role === 'admin';
    const isPermanent = req.query.permanent === 'true';

    // If already deleted and admin deletes again or specifies permanent=true
    if (isAdmin && (isPermanent || sale.isDeleted)) {
      await Sale.findOneAndDelete({ id: req.params.id });
      return res.json({ success: true, data: {}, message: 'Sale permanently deleted' });
    }

    // Soft delete: revert stock and client balance for cancellation
    if (!sale.isDeleted) {
      // Restore stock
      for (const item of sale.items) {
        const product = await Product.findOne({ id: item.productId });
        if (product) {
          product.stockQuantity += item.quantity;
          product.updatedAt = new Date();
          await product.save();
        }
      }

      // Revert client balances
      const client = await Client.findOne({ id: sale.clientId });
      if (client) {
        client.totalSpent = Math.max(0, Math.round((client.totalSpent - sale.grandTotal) * 100) / 100);
        client.outstandingBalance = Math.max(0, Math.round((client.outstandingBalance - sale.amountDue) * 100) / 100);
        await client.save();
      }
    }

    sale.isDeleted = true;
    sale.deletedAt = new Date();
    sale.deletedBy = req.user?.username || req.user?.name || req.user?.id || 'administration';
    sale.deletedByRole = req.user?.role || 'administration';
    await sale.save();

    res.json({
      success: true,
      data: sale,
      message: `Sale deleted by ${sale.deletedByRole} (visible to admin only)`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore sale (admin only)
router.post('/:id/restore', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required to restore sales' });
    }

    const sale = await Sale.findOne({ id: req.params.id });
    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }

    if (!sale.isDeleted) {
      return res.json({ success: true, data: sale, message: 'Sale is already active' });
    }

    // Re-deduct stock
    for (const item of sale.items) {
      const product = await Product.findOne({ id: item.productId });
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        product.updatedAt = new Date();
        await product.save();
      }
    }

    // Re-apply client balances
    const client = await Client.findOne({ id: sale.clientId });
    if (client) {
      client.totalSpent = Math.round((client.totalSpent + sale.grandTotal) * 100) / 100;
      client.outstandingBalance = Math.round((client.outstandingBalance + sale.amountDue) * 100) / 100;
      await client.save();
    }

    sale.isDeleted = false;
    sale.deletedAt = null;
    sale.deletedBy = null;
    sale.deletedByRole = null;
    await sale.save();

    res.json({ success: true, data: sale, message: 'Sale restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Record payment
router.post('/:id/payments', async (req, res) => {
  try {
    const { amount, method, note } = req.body;
    const sale = await Sale.findOne({ id: req.params.id, isDeleted: { $ne: true } });
    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found or is deleted' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
    }

    const effectivePayment = Math.min(amount, sale.amountDue);
    const newAmountPaid = Math.round((sale.amountPaid + effectivePayment) * 100) / 100;
    const newAmountDue = Math.max(0, Math.round((sale.grandTotal - newAmountPaid) * 100) / 100);

    let status = 'PARTIAL';
    if (newAmountDue <= 0.01) {
      status = 'PAID';
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      saleId: sale.id,
      amount: effectivePayment,
      method,
      date: new Date(),
      recordedBy: req.user?.username || req.user?.name || 'cashier',
      note: note || `Payment of $${effectivePayment.toFixed(2)} recorded`,
    };

    sale.amountPaid = newAmountPaid;
    sale.amountDue = newAmountDue;
    sale.paymentStatus = status;
    sale.payments.unshift(newPayment);

    // Update client balance
    const client = await Client.findOne({ id: sale.clientId });
    if (client) {
      client.outstandingBalance = Math.max(0, Math.round((client.outstandingBalance - effectivePayment) * 100) / 100);
      await client.save();
    }

    await sale.save();

    res.json({ success: true, data: { sale, payment: newPayment } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
