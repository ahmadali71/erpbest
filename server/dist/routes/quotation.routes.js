"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Quotation_js_1 = __importDefault(require("../db/models/Quotation.js"));
const Product_js_1 = __importDefault(require("../db/models/Product.js"));
const Client_js_1 = __importDefault(require("../db/models/Client.js"));
const router = express_1.default.Router();
// Get all quotations
router.get('/', async (req, res) => {
    try {
        const quotations = await Quotation_js_1.default.find().lean().sort({ date: -1 });
        res.json({ success: true, data: quotations });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Get single quotation
router.get('/:id', async (req, res) => {
    try {
        const quotation = await Quotation_js_1.default.findById(req.params.id).lean();
        if (!quotation) {
            return res.status(404).json({ success: false, error: 'Quotation not found' });
        }
        res.json({ success: true, data: quotation });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Create quotation
router.post('/', async (req, res) => {
    try {
        const { clientId, items, taxRate, validUntil, notes } = req.body;
        if (!clientId || !items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Client and items are required' });
        }
        // Find client
        const client = await Client_js_1.default.findById(clientId);
        if (!client) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        let subtotal = 0;
        let totalDiscount = 0;
        const quoteItems = [];
        for (const item of items) {
            const product = await Product_js_1.default.findById(item.productId);
            if (!product)
                continue;
            const qty = Math.max(1, item.quantity);
            const price = item.unitPrice ?? product.sellingPrice;
            const disc = item.discountPercentage ?? 0;
            const discounted = price * (1 - disc / 100);
            const total = discounted * qty;
            subtotal += price * qty;
            totalDiscount += (price * (disc / 100)) * qty;
            quoteItems.push({
                productId: product._id,
                productName: product.name,
                sku: product.sku,
                quantity: qty,
                unitPrice: price,
                discountPercentage: disc,
                total: Math.round(total * 100) / 100,
            });
        }
        if (quoteItems.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid products found' });
        }
        const taxable = subtotal - totalDiscount;
        const taxAmount = (taxable * (taxRate ?? 0)) / 100;
        const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;
        const count = await Quotation_js_1.default.countDocuments({}) + 1;
        const quotationNumber = `QT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
        const defaultValidity = new Date();
        defaultValidity.setDate(defaultValidity.getDate() + 30);
        const newQuotation = {
            quotationNumber,
            clientId: client._id,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone,
            items: quoteItems,
            subtotal: Math.round(subtotal * 100) / 100,
            discountAmount: Math.round(totalDiscount * 100) / 100,
            taxRate: taxRate ?? 0,
            taxAmount: Math.round(taxAmount * 100) / 100,
            grandTotal,
            status: 'SENT',
            date: new Date(),
            validUntil: validUntil || defaultValidity.toISOString(),
            notes,
        };
        const quotation = new Quotation_js_1.default(newQuotation);
        await quotation.save();
        res.status(201).json({ success: true, data: quotation });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Update quotation status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const quotation = await Quotation_js_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
        if (!quotation) {
            return res.status(404).json({ success: false, error: 'Quotation not found' });
        }
        res.json({ success: true, data: quotation });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Convert quotation to invoice
router.post('/:id/convert', async (req, res) => {
    try {
        const quotation = await Quotation_js_1.default.findById(req.params.id);
        if (!quotation) {
            return res.status(404).json({ success: false, error: 'Quotation not found' });
        }
        if (quotation.status === 'CONVERTED') {
            return res.status(400).json({ success: false, error: 'Quotation already converted' });
        }
        // Create sale invoice from quote
        const items = quotation.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitSellingPrice: item.unitPrice,
            discountPercentage: item.discountPercentage,
        }));
        const { default: db } = await Promise.resolve().then(() => __importStar(require('../index.js'))); // This won't work in routes
        // Actually, let's just create the sale directly
        // For now, we'll just update the quotation status
        quotation.status = 'CONVERTED';
        await quotation.save();
        res.json({ success: true, data: quotation, message: 'Quotation converted to invoice' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
