import express from 'express';
import Product from '../db/models/Product.js';
import StockMovement from '../db/models/StockMovement.js';

const router = express.Router();

// Helper to check permissions from req.user
const hasAnyPermission = (req, ...required) => {
  if (req.user?.role === 'admin') return true;
  const perms = req.user?.effectivePermissions || [];
  return required.some(p => perms.includes(p));
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { isDeleted: { $ne: true } };
    const products = await Product.find(filter).lean();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? { id: req.params.id } : { id: req.params.id, isDeleted: { $ne: true } };
    const product = await Product.findOne(filter).lean();
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'inventory.create', 'inventory.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Create product permission required.' });
    }

    const product = new Product({
      ...req.body,
      isDeleted: false,
    });
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'inventory.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Edit permission required.' });
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id, isDeleted: { $ne: true } },
      req.body,
      { new: true }
    ).lean();

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete product (Soft delete by administration/others, visible to admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'inventory.delete', 'inventory.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Delete permission required.' });
    }

    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const isAdmin = req.user?.role === 'admin';
    const isPermanent = req.query.permanent === 'true';

    // If admin requests permanent deletion or item is already soft-deleted and admin deletes again
    if (isAdmin && (isPermanent || product.isDeleted)) {
      await Product.findOneAndDelete({ id: req.params.id });
      return res.json({ success: true, data: {}, message: 'Product permanently deleted' });
    }

    // Soft delete
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.deletedBy = req.user?.username || req.user?.name || req.user?.id || 'administration';
    product.deletedByRole = req.user?.role || 'administration';
    await product.save();

    res.json({
      success: true,
      data: product,
      message: `Product deleted by ${product.deletedByRole} (visible to admin only)`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore product (admin only)
router.post('/:id/restore', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required to restore products' });
    }

    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    product.isDeleted = false;
    product.deletedAt = null;
    product.deletedBy = null;
    product.deletedByRole = null;
    await product.save();

    res.json({ success: true, data: product, message: 'Product restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restock product
router.post('/:id/restock', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'inventory.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Restock permission required.' });
    }

    const { quantity, unitCost, notes, supplierName } = req.body;
    const product = await Product.findOne({ id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
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
      type: 'PURCHASE_RESTOCK',
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
    if (!hasAnyPermission(req, 'inventory.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Adjust stock permission required.' });
    }

    const { newStock, reason } = req.body;
    const product = await Product.findOne({ id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    if (newStock < 0) {
      return res.status(400).json({ success: false, error: 'Stock quantity cannot be negative' });
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
      type: 'ADJUSTMENT',
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
