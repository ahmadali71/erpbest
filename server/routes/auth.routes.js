import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../db/models/User.js';
import { JWT_SECRET, getEffectivePermissions } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Contact your administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        customPermissions: user.customPermissions || [],
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          customPermissions: user.customPermissions || [],
          permissions: getEffectivePermissions(user.role, user.customPermissions),
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me — validate token & return current user
// ─────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, error: 'Invalid token' });
      }

      const user = await User.findOne({ id: decoded.id });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ success: false, error: 'Account is deactivated' });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          customPermissions: user.customPermissions || [],
          permissions: getEffectivePermissions(user.role, user.customPermissions),
        },
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
