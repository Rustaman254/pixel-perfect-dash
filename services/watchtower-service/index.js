import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from './migrate.js';
import watchtowerRoutes from './watchtowerRoutes.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await migrate();

const app = express();
app.set('trust proxy', 1);

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
    cb(null, true); // Allow all origins for the tracking script
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

app.use(express.json({ limit: '5mb' }));

// Serve tracking script
app.use('/watchtower.js', express.static(path.join(__dirname, 'public', 'watchtower.js')));

// Routes
app.use('/api/watchtower', watchtowerRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'watchtower' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
});

const PORT = process.env.WATCHTOWER_PORT || 3004;
app.listen(PORT, () => {
  console.log(`Watchtower service running on port ${PORT}`);
});
