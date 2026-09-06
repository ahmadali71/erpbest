import express from 'express';
import jwt from 'jsonwebtoken';
import Settings from '../db/models/Settings.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-erp-secret-key-change-in-production';

const router = express.Router();

// SSE Events endpoint
// EventSource API cannot send custom headers, so we support token via query param
router.get('/events', async (req, res) => {
  // Optional auth via query param (EventSource limitation)
  const token = req.query.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Invalid token — still allow connection but without user context
      console.warn('SSE: Invalid token provided via query param');
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Vercel/nginx

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('connected', { activeConnections: 1, timestamp: new Date().toISOString() });

  const interval = setInterval(async () => {
    try {
      const settings = await Settings.findOne({}).lean();
      send('ping', {
        activeConnections: 1,
        timestamp: new Date().toISOString(),
        settings,
      });
    } catch {
      // ignore — DB might be temporarily unavailable
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;
