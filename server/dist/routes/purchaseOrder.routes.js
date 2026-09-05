"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PurchaseOrder_js_1 = __importDefault(require("../db/models/PurchaseOrder.js"));
const Product_js_1 = __importDefault(require("../db/models/Product.js"));
const StockMovement_js_1 = __importDefault(require("../db/models/StockMovement.js"));
const Supplier_js_1 = __importDefault(require("../db/models/Supplier.js"));
const router = express_1.default.Router();
// Get all purchase orders
router.get('/', async (req, res) => {
    try {
        const pos = await PurchaseOrder_js_1.default.find().lean().sort({ date: -1 });
        res.json({ success: true, data: pos });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Get single purchase order
router.get('/:id', async (req, res) => {
    try {
        const po = await PurchaseOrder_js_1.default.findById(req.params.id).lean();
        if (!po) {
            return res.status(404).json({ success: false, error: 'Purchase order not found' });
        }
        res.json({ success: true, data: po });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Create purchase order
router.post('/', async (req, res) => {
    try {
        const { supplierId, items, expectedDeliveryDate, notes } = req.body;
        if (!supplierId || !items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Supplier and items are required' });
        }
        // Find supplier
        const supplier = await Supplier_js_1.default.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        const poItems = [];
        let subtotal = 0;
        const newMovements = [];
        for (const item of items) {
            const product = await Product_js_1.default.findById(item.productId);
            if (!product)
                continue;
            const lineTotal = item.quantity * item.unitCost;
            subtotal += lineTotal;
            poItems.push({
                productId: product._id,
                productName: product.name,
                sku: product.sku,
                quantity: item.quantity,
                unitCost: item.unitCost,
                total: Math.round(lineTotal * 100) / 100,
            });
            newMovements.push({
                productId: product._id,
                productName: product.name,
                sku: product.sku,
                type: 'PURCHASE_RESTOCK',
                quantity: item.quantity,
                previousStock: product.stockQuantity,
                newStock: 0, // will be set after
                unitCost: item.unitCost,
                referenceId: '', // will be set after
                note: '',
                date: new Date(),
            });
        }
        if (poItems.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid products found' });
        }
        const count = await PurchaseOrder_js_1.default.countDocuments({}) + 1;
        const orderNumber = `PO-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
        // Create purchase order
        const newPO = {
            orderNumber,
            supplierId: supplier._id,
            supplierName: supplier.name,
            items: poItems,
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: 0,
            grandTotal: Math.round(subtotal * 100) / 100,
            status: 'ORDERED',
            date: new Date(),
            expectedDeliveryDate,
            notes,
        };
        const po = new PurchaseOrder_js_1.default(newPO);
        await po.save();
        // Update supplier total purchased
        supplier.totalPurchased = Math.round((supplier.totalPurchased + newPO.grandTotal) * 100) / 100;
        await supplier.save();
        // Update stock and save movements
        for (let i = 0; i < newMovements.length; i++) {
            const movement = newMovements[i];
            const product = await Product_js_1.default.findById(movement.productId);
            if (product) {
                const prevStock = product.stockQuantity;
                product.stockQuantity += movement.quantity;
                product.purchasePrice = movement.unitCost;
                product.updatedAt = new Date();
                movement.previousStock = prevStock;
                movement.newStock = product.stockQuantity;
                movement.referenceId = po.orderNumber;
                movement.note = `Received from supplier ${po.supplierName}`;
                await product.save();
                await new StockMovement_js_1.default(movement).save();
            }
        }
        res.status(201).json({ success: true, data: po });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Update PO status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const po = await PurchaseOrder_js_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
        if (!po) {
            return res.status(404).json({ success: false, error: 'Purchase order not found' });
        }
        res.json({ success: true, data: po });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
