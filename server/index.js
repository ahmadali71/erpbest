import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);


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

// Increase JSON body limit for large restore payloads
app.use(express.json({ limit: '10mb' }));

// CORS: Allow frontend origin (Vercel) in production, localhost in dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://erpbest.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow exact match or Vercel preview URLs
    if (
      allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    // In development, allow all
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(null, true); // Allow all origins as fallback
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ========================================
// PUBLIC ROUTES (no auth required)
// ========================================
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Nexus ERP API Backend! 🚀',
    status: 'Running'
  });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    service: 'Nexus ERP Backend',
    database: dbStateMap[dbState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// SSE Events — public route (EventSource API cannot send auth headers)
// Auth is handled via query parameter token
app.use('/api', eventsRoutes);

// ========================================
// PROTECTED ROUTES (auth required)
// ========================================
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

// API 404 fallback — frontend is hosted separately on Vercel
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

mongoose.set('strictQuery', false);

// Connect to MongoDB with robust options for serverless environments
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  retryReads: true,
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus_erp', mongoOptions)
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// Handle MongoDB connection events for resilience
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Export the app for Vercel Serverless Functions
export default app;

// Only start the server if not running on Vercel (local dev or Render)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
