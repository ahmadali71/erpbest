"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Expense_js_1 = __importDefault(require("../db/models/Expense.js"));
const router = express_1.default.Router();
// Get all expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense_js_1.default.find().lean().sort({ date: -1 });
        res.json({ success: true, data: expenses });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Get single expense
router.get('/:id', async (req, res) => {
    try {
        const expense = await Expense_js_1.default.findById(req.params.id).lean();
        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }
        res.json({ success: true, data: expense });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Create expense
router.post('/', async (req, res) => {
    try {
        const { title, category, amount, paymentMethod, date, reference, notes } = req.body;
        if (!title || !amount) {
            return res.status(400).json({ success: false, error: 'Title and amount are required' });
        }
        const expense = new Expense_js_1.default({
            title,
            category: category || 'Other',
            amount: Number(amount),
            paymentMethod: paymentMethod || 'CASH',
            date: date || new Date(),
            reference,
            notes,
        });
        await expense.save();
        res.status(201).json({ success: true, data: expense });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense_js_1.default.findByIdAndDelete(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }
        res.json({ success: true, data: {} });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
