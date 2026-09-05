"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Supplier_js_1 = __importDefault(require("../db/models/Supplier.js"));
const router = express_1.default.Router();
// Get all suppliers
router.get('/', async (req, res) => {
    try {
        const suppliers = await Supplier_js_1.default.find().lean().sort({ createdAt: -1 });
        res.json({ success: true, data: suppliers });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Get single supplier
router.get('/:id', async (req, res) => {
    try {
        const supplier = await Supplier_js_1.default.findById(req.params.id).lean();
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        res.json({ success: true, data: supplier });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Create supplier
router.post('/', async (req, res) => {
    try {
        const { name, contactPerson, email, phone, address, paymentTerms, taxNumber } = req.body;
        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, error: 'Supplier name, email, and phone are required' });
        }
        const supplier = new Supplier_js_1.default({
            name,
            contactPerson: contactPerson || name,
            email,
            phone,
            address,
            paymentTerms: paymentTerms || 'NET_30',
            taxNumber,
        });
        await supplier.save();
        res.status(201).json({ success: true, data: supplier });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Update supplier
router.put('/:id', async (req, res) => {
    try {
        const supplier = await Supplier_js_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        res.json({ success: true, data: supplier });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Delete supplier
router.delete('/:id', async (req, res) => {
    try {
        const supplier = await Supplier_js_1.default.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }
        res.json({ success: true, data: {} });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
