import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import productRoutes from './routes/product.routes.js';
import clientRoutes from './routes/client.routes.js';
import saleRoutes from './routes/sale.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import purchaseOrderRoutes from './routes/purchaseOrder.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import returnRoutes from './routes/return.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import bootstrapRoutes from './routes/bootstrap.routes.js';
import eventsRoutes from './routes/events.routes.js';
import authRoutes from './routes/auth.routes.js';
import { authenticateToken } from './middleware/auth.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api', authenticateToken, bootstrapRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/sales', authenticateToken, saleRoutes);
app.use('/api/expenses', authenticateToken, expenseRoutes);
app.use('/api/suppliers', authenticateToken, supplierRoutes);
app.use('/api/purchase-orders', authenticateToken, purchaseOrderRoutes);
app.use('/api/quotations', authenticateToken, quotationRoutes);
app.use('/api/returns', authenticateToken, returnRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api', authenticateToken, eventsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nexus ERP Backend' });
});

// Serve React frontend in production
const clientDistPath = path.join(process.cwd(), '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// SPA fallback: serve index.html for non-API GET requests
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus_erp')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
