import express from 'express';
import Client from '../db/models/Client.js';

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().lean();
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Get single client
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ id: req.params.id }).lean();
    if (!client) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

// Create client
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
    if (!client) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ id: req.params.id });
    if (!client) {
      return res.status(404).json({ success: false, error});
    }
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error});
  }
});

export default router;


