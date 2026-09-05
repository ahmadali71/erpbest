import express from 'express';
import Supplier from '../db/models/Supplier.js';

const router = express.Router();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().lean().sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ id: req.params.id }).lean();
    if (!supplier) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Create supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, paymentTerms, taxNumber } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error});
    }
    const supplier = new Supplier({
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
    if (!supplier) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ id: req.params.id });
    if (!supplier) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


