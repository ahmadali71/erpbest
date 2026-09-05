"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Product_js_1 = __importDefault(require("../db/models/Product.js"));
const StockMovement_js_1 = __importDefault(require("../db/models/StockMovement.js"));
const router = express_1.default.Router();
// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product_js_1.default.find().lean();
        res.json({ success: true, data: products });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product_js_1.default.findById(req.params.id).lean();
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: product });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Create product
router.post('/', async (req, res) => {
    try {
        const product = new Product_js_1.default(req.body);
        await product.save();
        res.status(201).json({ success: true, data: product });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Update product
router.put('/:id', async (req, res) => {
    try {
        const product = await Product_js_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: product });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product_js_1.default.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: {} });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Restock product
router.post('/:id/restock', async (req, res) => {
    try {
        const { quantity, unitCost, notes, supplierName } = req.body;
        const product = await Product_js_1.default.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        const previousStock = product.stockQuantity;
        const newStock = previousStock + quantity;
        product.stockQuantity = newStock;
        if (unitCost)
            product.purchasePrice = unitCost;
        product.updatedAt = new Date();
        await product.save();
        // Create stock movement
        await new StockMovement_js_1.default({
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
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Adjust stock
router.post('/:id/adjust', async (req, res) => {
    try {
        const { newStock, reason } = req.body;
        const product = await Product_js_1.default.findById(req.params.id);
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
        await new StockMovement_js_1.default({
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
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
