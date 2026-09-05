import express from 'express';
import Sale from '../db/models/Sale.js';
import Product from '../db/models/Product.js';
import Client from '../db/models/Client.js';
import StockMovement from '../db/models/StockMovement.js';

const router = express.Router();

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().lean().sort({ date: -1 });
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Get single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findOne({ id: req.params.id }).lean();
    if (!sale) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    const { clientId, items, taxRate, paymentMethod, initialAmountPaid, notes, dueDate } = req.body;

    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error});
    }

    // Find client
    const client = await Client.findOne({ id: clientId });
    if (!client) {
      return res.status(404).json({ success: false, error});
    }

    // Calculate sale
    let subtotal = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    const saleItems = [];
    const newMovements = [];
    const productsToUpdate = [];

    for (const item of items) {
      const product = await Product.findOne({ id: item.productId });
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
        type,
        quantity: -qty,
        previousStock,
        newStock,
        referenceId: `inv-${Date.now()}`,
        note: `Sold to ${client.name}`,
        date: new Date(),
      });
    }

    if (saleItems.length === 0) {
      return res.status(400).json({ success: false, error});
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
        recordedBy,
        note: `Initial payment via ${paymentMethod.replace('_', ' ')}`,
      });
    }

    const newSale = {
      id: saleId,
      invoiceNumber: `INV-${new Date().getFullYear()}-001`,
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

// Delete sale
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findOneAndDelete({ id: req.params.id });
    if (!sale) {
      return res.status(404).json({ success: false, error});
    }

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

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Record payment
router.post('/:id/payments', async (req, res) => {
  try {
    const { amount, method, note } = req.body;
    const sale = await Sale.findOne({ id: req.params.id });
    if (!sale) {
      return res.status(404).json({ success: false, error});
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error});
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
      recordedBy,
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


