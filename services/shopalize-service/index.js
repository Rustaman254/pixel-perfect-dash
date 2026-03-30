import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from './migrate.js';

import projectRoutes from './projectRoutes.js';
import pageRoutes from './pageRoutes.js';
import templateRoutes from './templateRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import publicRoutes from './publicRoutes.js';
import internalRoutes from './internalRoutes.js';
import discountRoutes from './discountRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import internalAdminRoutes from './internalAdminRoutes.js';
import activityRoutes from './activityRoutes.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

await migrate();

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
    'https://shopalize.sokostack.xyz',
    'https://ripplify.sokostack.xyz',
    'https://admin.sokostack.xyz',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:5173',
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

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.use(express.json());

// Routes
app.use('/api/shopalize/projects', projectRoutes);
app.use('/api/shopalize/pages', pageRoutes);
app.use('/api/shopalize/templates', templateRoutes);
app.use('/api/shopalize/products', productRoutes);
app.use('/api/shopalize/orders', orderRoutes);
app.use('/api/shopalize/discounts', discountRoutes);
app.use('/api/shopalize/analytics', analyticsRoutes);
app.use('/api/shopalize/campaigns', campaignRoutes);
app.use('/api/shopalize/activities', activityRoutes);
app.use('/api/shopalize', publicRoutes);
app.use('/api/shopalize', internalRoutes);
app.use('/api/shopalize', internalAdminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'shopalize' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
});

const PORT = process.env.SHOPALIZE_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Shopalize service running on port ${PORT}`);
});
