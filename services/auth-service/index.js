import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import authRoutes from './authRoutes.js';
import { migrate } from './migrate.js';
import { processAgentRequest, createFormAgent } from './agentService.js';

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

// Agent routes
import { createConnection } from '../shared/db.js';
const authDb = () => createConnection('auth_db');

app.post('/api/agent/chat', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    
    const result = await processAgentRequest(decoded.id, message);
    const lastMsg = result.messages[result.messages.length - 1];
    res.json({ message: lastMsg?.text || 'No response', messages: result.messages });
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({ message: error.message });
  }
});

// WebSocket for agent
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/agent' });

wss.on('connection', async (ws, req) => {
  const token = req.url?.split('token=')[1]?.split('&')[0];
  if (!token) { ws.close(1008, 'Auth required'); return; }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    console.log(`Agent WS: user ${userId} connected`);
    
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Forms AI. Describe a form to create it!' }));
    
    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'chat') {
          ws.send(JSON.stringify({ type: 'thinking' }));
          const result = await processAgentRequest(userId, data.message);
          const lastMsg = result.messages[result.messages.length - 1];
          ws.send(JSON.stringify({ type: 'response', message: lastMsg?.text, messages: result.messages }));
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: e.message }));
      }
    });
  } catch (e) {
    ws.close(1008, 'Invalid token');
  }
});

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

const PORT = process.env.AUTH_PORT || process.env.PORT || 3006;
server.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
