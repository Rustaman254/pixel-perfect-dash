import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from './migrate.js';
import dnsRoutes from './dnsRoutes.js';
import domainRoutes from './domainRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

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
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5173',
    ];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'frame-ancestors': ["'self'", '*'],
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

// DNS Management Routes
app.use('/api/dns', dnsRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/dns/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'dns-service', timestamp: new Date().toISOString() }));

// DNS endpoint for external queries (like dig)
app.get('/resolve/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const type = req.query.type || 'A';
    
    const db = (await import('./db.js')).default;
    
    // Check if domain exists in our system
    let record = await db('custom_domains')
      .where({ domain, status: 'active' })
      .orWhere({ domain: `%${domain}`, status: 'active' })
      .first();
    
    if (!record) {
      // Check subdomains
      record = await db('subdomains')
        .where({ subdomain: domain.split('.')[0], status: 'active' })
        .first();
    }
    
    if (record) {
      return res.json({
        domain,
        type,
        answer: record.target || record.ip_address || process.env.DEFAULT_APP_IP || '127.0.0.1',
        ttl: 300,
        fromCache: false
      });
    }
    
    res.status(404).json({ error: 'Domain not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
});

const PORT = process.env.DNS_PORT || 3004;
app.listen(PORT, () => {
  console.log(`DNS Service running on port ${PORT}`);
  console.log(`Default domain: ${process.env.DEFAULT_DOMAIN || 'shopalize.com'}`);
});

export default app;
