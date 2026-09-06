import express from 'express';
import Quotation from '../db/models/Quotation.js';
import Product from '../db/models/Product.js';
import Client from '../db/models/Client.js';

const router = express.Router();

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const quotations = await Quotation.find().lean().sort({ date: -1 });
    res.json({ success: true, data: quotations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single quotation
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ id: req.params.id }).lean();
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create quotation
router.post('/', async (req, res) => {
  try {
    const { clientId, items, taxRate, validUntil, notes, status } = req.body;
    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Client ID and items are required' });
    }

    // Find client
    const client = await Client.findOne({ id: clientId });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const quoteItems = [];

    for (const item of items) {
      const product = await Product.findOne({ id: item.productId });
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

    if (quoteItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid products in items list' });
    }

    const taxable = subtotal - totalDiscount;
    const taxAmount = (taxable * (taxRate ?? 0)) / 100;
    const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

    const count = (await Quotation.countDocuments({})) + 1;
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const defaultValidity = new Date();
    defaultValidity.setDate(defaultValidity.getDate() + 30);

    const newQuotation = {
      quotationNumber,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      items: quoteItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      taxRate: taxRate ?? 0,
      taxAmount: Math.round(taxAmount * 100) / 100,
      grandTotal,
      status: status || 'SENT',
      date: new Date(),
      validUntil: validUntil || defaultValidity.toISOString(),
      notes,
    };

    const quotation = new Quotation(newQuotation);
    await quotation.save();

    res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update quotation status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findOneAndUpdate({ id: req.params.id }, { status }, { new: true }).lean();
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Convert quotation to invoice
router.post('/:id/convert', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ id: req.params.id });
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    if (quotation.status === 'CONVERTED') {
      return res.status(400).json({ success: false, error: 'Quotation is already converted' });
    }

    quotation.status = 'CONVERTED';
    await quotation.save();

    res.json({ success: true, data: quotation, message: 'Quotation converted to invoice successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
