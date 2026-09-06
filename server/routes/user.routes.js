import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User from '../db/models/User.js';
import { authenticateToken, requireAdmin, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// All user-management routes require auth
router.use(authenticateToken);

// ─────────────────────────────────────────────────────────────
// GET /api/users — list all users (requires users.view)
// ─────────────────────────────────────────────────────────────
router.get('/', requirePermission('users.view'), async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/users — create a new user (admin only)
// ─────────────────────────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, role, name, email, customPermissions } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'username, password and role are required',
      });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      id: uuidv4(),
      username,
      password: hashedPassword,
      role,
      name: name || '',
      email: email || '',
      customPermissions: customPermissions || [],
      isActive: true,
    });

    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:id — update a user (admin only)
// ─────────────────────────────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, name, email, customPermissions, isActive } = req.body;

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Prevent the last admin from being demoted
    if (user.role === 'admin' && role && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot demote the only remaining admin account',
        });
      }
    }

    if (username) user.username = username;
    if (role) user.role = role;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (customPermissions !== undefined) user.customPermissions = customPermissions;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/users/:id — soft-delete a user (admin only)
// ─────────────────────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user.id === id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the only remaining admin account',
        });
      }
    }

    await User.deleteOne({ id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/:id/password — change own password (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.patch('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;

    // Non-admins can only change their own password
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Cannot change another user\'s password' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Non-admins must verify their current password
    if (req.user.role !== 'admin') {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
