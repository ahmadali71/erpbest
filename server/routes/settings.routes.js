import express from 'express';
import Settings from '../db/models/Settings.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


