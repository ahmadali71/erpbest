import express from 'express';
import Expense from '../db/models/Expense.js';

const router = express.Router();

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().lean().sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single expense
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ id: req.params.id }).lean();
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create expense
router.post('/', async (req, res) => {
  try {
    const { title, category, amount, paymentMethod, date, reference, notes } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ success: false, error: 'Title and amount are required' });
    }
    const expense = new Expense({
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ id: req.params.id });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
