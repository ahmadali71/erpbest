import express from 'express';
import Product from '../db/models/Product.js';
import StockMovement from '../db/models/StockMovement.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
    if (!product) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Restock product
router.post('/:id/restock', async (req, res) => {
  try {
    const { quantity, unitCost, notes, supplierName } = req.body;
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, error});
    }
    
    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;
    
    product.stockQuantity = newStock;
    if (unitCost) product.purchasePrice = unitCost;
    product.updatedAt = new Date();
    await product.save();
    
    // Create stock movement
    await new StockMovement({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity,
      previousStock,
      newStock,
      unitCost: unitCost || product.purchasePrice,
      referenceId: supplierName ? `Supplier: ${supplierName}` : undefined,
      note: notes || `Restocked +${quantity} units`,
      date: new Date(),
    }).save();
    
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Adjust stock
router.post('/:id/adjust', async (req, res) => {
  try {
    const { newStock, reason } = req.body;
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, error});
    }
    
    if (newStock < 0) {
      return res.status(400).json({ success: false, error});
    }
    
    const previousStock = product.stockQuantity;
    const diff = newStock - previousStock;
    
    product.stockQuantity = newStock;
    product.updatedAt = new Date();
    await product.save();
    
    // Create stock movement
    await new StockMovement({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity: diff,
      previousStock,
      newStock,
      note: reason || 'Inventory manual adjustment',
      date: new Date(),
    }).save();
    
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


