import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

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
import userRoutes from './routes/user.routes.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Direct replica set URI for reliable connectivity (does not require DNS SRV lookup)
const DEFAULT_FALLBACK_URI = 'mongodb://ahmadmohid3358_db_user:Ibwfoki2BtRWFgBZ@ac-9vttyk0-shard-00-00.hx2qhng.mongodb.net:27017,ac-9vttyk0-shard-00-01.hx2qhng.mongodb.net:27017,ac-9vttyk0-shard-00-02.hx2qhng.mongodb.net:27017/nexus_erp?ssl=true&replicaSet=atlas-5i50we-shard-0&authSource=admin&retryWrites=true&w=majority';
const MONGODB_URI = process.env.MONGO_URI || DEFAULT_FALLBACK_URI;

mongoose.set('strictQuery', false);

let cachedPromise = null;
let lastConnectionError = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    try {
      await cachedPromise;
      return mongoose.connection;
    } catch {
      cachedPromise = null;
    }
  }

  const mongoOptions = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    retryReads: true,
  };

  try {
    cachedPromise = mongoose.connect(MONGODB_URI, mongoOptions);
    await cachedPromise;
    lastConnectionError = null;
    console.log('✅ MongoDB connected successfully');
    return mongoose.connection;
  } catch (err) {
    cachedPromise = null;
    lastConnectionError = err.message;
    console.error('❌ MongoDB connection error:', err.message);

    // If SRV lookup failed, automatically fall back to standard replica set URI
    if (MONGODB_URI !== DEFAULT_FALLBACK_URI) {
      console.log('🔄 Retrying with direct replica set URI...');
      try {
        cachedPromise = mongoose.connect(DEFAULT_FALLBACK_URI, mongoOptions);
        await cachedPromise;
        lastConnectionError = null;
        console.log('✅ MongoDB connected via fallback URI');
        return mongoose.connection;
      } catch (fallbackErr) {
        cachedPromise = null;
        lastConnectionError = fallbackErr.message;
        throw fallbackErr;
      }
    }

    throw err;
  }
}

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
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Connect to MongoDB before processing any request
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // Continue so /api/health or error handlers can report status
  }
  next();
});

// ========================================
// PUBLIC ROUTES (no auth required)
// ========================================
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Nexus ERP API Backend! 🚀',
    status: 'Running'
  });
});

app.get('/api/health', async (_req, res) => {
  try {
    await connectDB();
  } catch {}

  const dbState = mongoose.connection.readyState;
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.json({
    status: 'ok',
    service: 'Nexus ERP Backend',
    database: dbStateMap[dbState] || 'unknown',
    dbDetails: {
      readyState: dbState,
      hasEnvUri: !!process.env.MONGO_URI,
      error: lastConnectionError || null,
    },
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

// SSE Events — public route (EventSource API cannot send auth headers)
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
app.use('/api/users', userRoutes);

// API 404 fallback
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Resilient event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

export default app;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
