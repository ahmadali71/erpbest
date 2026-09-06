import express from 'express';
import Client from '../db/models/Client.js';

const router = express.Router();

// Helper to check permissions from req.user
const hasAnyPermission = (req, ...required) => {
  if (req.user?.role === 'admin') return true;
  const perms = req.user?.effectivePermissions || [];
  return required.some(p => perms.includes(p));
};

// Get all clients
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? {} : { isDeleted: { $ne: true } };
    const clients = await Client.find(filter).lean();
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single client
router.get('/:id', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const filter = isAdmin ? { id: req.params.id } : { id: req.params.id, isDeleted: { $ne: true } };
    const client = await Client.findOne(filter).lean();
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create client
router.post('/', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'clients.create', 'clients.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Create client permission required.' });
    }

    const client = new Client({
      ...req.body,
      isDeleted: false,
    });
    await client.save();
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'clients.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Edit client permission required.' });
    }

    const client = await Client.findOneAndUpdate(
      { id: req.params.id, isDeleted: { $ne: true } },
      req.body,
      { new: true }
    ).lean();

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete client (Soft delete by administration/others, visible to admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (!hasAnyPermission(req, 'clients.delete', 'clients.edit')) {
      return res.status(403).json({ success: false, error: 'Access denied. Delete client permission required.' });
    }

    const client = await Client.findOne({ id: req.params.id });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const isAdmin = req.user?.role === 'admin';
    const isPermanent = req.query.permanent === 'true';

    // If admin requests permanent deletion or item is already soft-deleted and admin deletes again
    if (isAdmin && (isPermanent || client.isDeleted)) {
      await Client.findOneAndDelete({ id: req.params.id });
      return res.json({ success: true, data: {}, message: 'Client permanently deleted' });
    }

    // Soft delete
    client.isDeleted = true;
    client.deletedAt = new Date();
    client.deletedBy = req.user?.username || req.user?.name || req.user?.id || 'administration';
    client.deletedByRole = req.user?.role || 'administration';
    await client.save();

    res.json({
      success: true,
      data: client,
      message: `Client deleted by ${client.deletedByRole} (visible to admin only)`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore client (admin only)
router.post('/:id/restore', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required to restore clients' });
    }

    const client = await Client.findOne({ id: req.params.id });
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    client.isDeleted = false;
    client.deletedAt = null;
    client.deletedBy = null;
    client.deletedByRole = null;
    await client.save();

    res.json({ success: true, data: client, message: 'Client restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
