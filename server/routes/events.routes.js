import express from 'express';
import Settings from '../db/models/Settings.js';

const router = express.Router();

router.get('/events', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

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
      // ignore
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;


