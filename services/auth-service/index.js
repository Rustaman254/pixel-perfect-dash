import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './authRoutes.js';
import { migrate } from './migrate.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run migrations
await migrate();

const app = express();

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-app-name', 'x-internal-api-key', 'Accept', 'Origin'],
}));

// Security headers (relaxed for SSO)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

app.use(express.json());

// Health check (FIRST - before anything else)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// SSO hub - explicit route
app.get('/sso.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sso.html'));
});

// Static files (SSO hub - LAST)
app.use(express.static(path.join(__dirname, 'public')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
