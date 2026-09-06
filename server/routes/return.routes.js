import express from 'express';
import Return from '../db/models/Return.js';
import Sale from '../db/models/Sale.js';
import Product from '../db/models/Product.js';

const router = express.Router();

// Get all returns
router.get('/', async (req, res) => {
  try {
    const returns = await Return.find().lean().sort({ date: -1 });
    res.json({ success: true, data: returns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Process return
router.post('/', async (req, res) => {
  try {
    const { invoiceId, items, restockingFee, refundMethod, notes } = req.body;
    if (!invoiceId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Invoice ID and items are required' });
    }

    // Find invoice
    const invoice = await Sale.findOne({ id: invoiceId });
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    let totalRefund = 0;
    const processedItems = [];

    for (const retItem of items) {
      const saleItem = invoice.items.find((i) => i.productId === retItem.productId);
      const product = await Product.findOne({ id: retItem.productId });
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

      // If restocking is enabled, increase product stock
      if (retItem.restockItem) {
        product.stockQuantity += retItem.quantity;
        product.updatedAt = new Date();
        await product.save();
      }
    }

    const restockingFeeVal = restockingFee || 0;
    const netRefundAmount = Math.max(0, Math.round((totalRefund - restockingFeeVal) * 100) / 100);

    const count = (await Return.countDocuments({})) + 1;
    const returnNumber = `RET-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const newReturn = {
      returnNumber,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      items: processedItems,
      totalRefundAmount: totalRefund,
      restockingFee: restockingFeeVal,
      netRefundAmount,
      itemsTotal: totalRefund,
      refundMethod: refundMethod || 'CASH',
      notes,
      date: new Date(),
    };

    const ret = new Return(newReturn);
    await ret.save();

    res.status(201).json({ success: true, data: ret });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
