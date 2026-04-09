import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from './migrate.js';

import linkRoutes from './linkRoutes.js';
import paymentLinkRoutes from './paymentLinkRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import walletRoutes from './walletRoutes.js';
import payoutRoutes from './payoutRoutes.js';
import transferRoutes from './transferRoutes.js';
import paymentMethodRoutes from './paymentMethodRoutes.js';
import currencyRoutes from './currencyRoutes.js';
import payoutMethodRoutes from './payoutMethodRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import shopalizeRoutes from './shopalizeRoutes.js';

import { internalAuth } from '../shared/auth.js';
import * as transCtrl from './transactionController.js';
import * as linkCtrl from './linkController.js';
import * as payoutCtrl from './payoutController.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

// Run migrations
await migrate();

const app = express();
app.set('trust proxy', 1);

// CORS
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
    'https://ripplify.sokostack.xyz',
    'https://shopalize.sokostack.xyz',
    'https://watchtower.sokostack.xyz',
    'https://admin.sokostack.xyz',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:5173',
    'http://localhost:5175',
  ];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-name', 'X-Internal-API-Key', 'Accept', 'Origin'],
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'frame-ancestors': ["'self'", '*'],
      'script-src': ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.use(express.json());

// Routes
app.use('/api/ripplify/links', linkRoutes);
app.use('/api/payment-links', paymentLinkRoutes);
app.use('/api/ripplify/payment-links', paymentLinkRoutes);
app.use('/api/ripplify/transactions', transactionRoutes);
app.use('/api/ripplify/wallets', walletRoutes);
app.use('/api/ripplify/payouts', payoutRoutes);
app.use('/api/ripplify/transfers', transferRoutes);
app.use('/api/ripplify/payment-methods', paymentMethodRoutes);
app.use('/api/ripplify/currencies', currencyRoutes);
app.use('/api/ripplify/payout-methods', payoutMethodRoutes);
app.use('/api/ripplify/checkout', checkoutRoutes);
app.use('/api/ripplify/shopalize', shopalizeRoutes);

// Legacy/frontend compatible routes (no /ripplify prefix)
app.use('/api/links', linkRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/notifications', (req, res) => res.json([]));
app.use('/api/apps/active', (req, res) => res.json([]));
app.use('/api/apps/all', (req, res) => res.json([]));

// Internal routes for admin service
app.get('/internal/transactions', internalAuth, transCtrl.internalGetTransactions);
app.get('/internal/transactions/all', internalAuth, transCtrl.internalGetAllTransactions);
app.get('/internal/transactions/stats', internalAuth, transCtrl.internalGetTransactionStats);
app.get('/internal/links', internalAuth, linkCtrl.internalGetLinks);
app.get('/internal/payouts', internalAuth, payoutCtrl.internalGetPayouts);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ripplify' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
});

const PORT = process.env.RIPPLIFY_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Ripplify service running on port ${PORT}`);
});
