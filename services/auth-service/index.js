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
import { processUnifiedAgentRequest } from './unifiedAgent.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run migrations
await migrate();

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'https://ripplify.sokostack.xyz',
      'https://shopalize.sokostack.xyz',
      'https://admin.sokostack.xyz',
      'https://watchtower.sokostack.xyz',
      'https://sokostack.ddns.net',
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

app.use(express.json({ limit: '1mb' }));

// Health check (FIRST - before anything else)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Agent routes
import { createConnection } from '../shared/db.js';
import { adminService } from '../shared/serviceClient.js';
const authDb = () => createConnection('auth_db');

// Check if feature flag is enabled
const isFeatureEnabled = async (key) => {
  try {
    const flags = await adminService.getFeatureFlags();
    const flag = flags.find(f => f.key === key);
    return flag?.isEnabled ?? true;
  } catch (e) {
    console.error('Feature flag check failed:', e.message);
    return true;
  }
};

// Unified agent chat (supports all Sokostack products)
app.post('/api/agent/unified', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    // Check feature flag
    const isEnabled = await isFeatureEnabled('unified_agent');
    if (!isEnabled) {
      return res.status(403).json({ message: 'Unified AI Agent is currently disabled' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { message, formId, currentForm } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    
    const context = { formId, currentForm };
    const result = await processUnifiedAgentRequest(decoded.id, message, context);
    const lastMsg = result.messages[result.messages.length - 1];
    
    // Extract progress information from messages (for form creation)
    const progress = {};
    const progressMessages = [];
    
    for (const msg of result.messages) {
      if (msg.text?.includes('Setting title:')) {
        const match = msg.text.match(/Setting title: "([^"]+)"/);
        if (match) progress.title = match[1];
        progressMessages.push({ type: 'title', value: match[1] });
      }
      if (msg.text?.includes('Adding description:')) {
        const match = msg.text.match(/Adding description: "([^"]+)"/);
        if (match) progress.description = match[1];
        progressMessages.push({ type: 'description', value: match[1] });
      }
      if (msg.text?.includes('Adding question')) {
        const match = msg.text.match(/Adding question \d+: "([^"]+)" \(([^)]+)\)/);
        if (match) {
          if (!progress.questions) progress.questions = [];
          progress.questions.push({ question: match[1], type: match[2] });
          progressMessages.push({ type: 'question', value: match[1], qtype: match[2] });
        }
      }
      if (msg.text?.includes('Form created') || msg.text?.includes('Form updated')) {
        progressMessages.push({ type: 'complete', value: msg.text });
      }
    }
    
    // If form was created/updated, include the form data
    if (result.toolResults?.create_form || result.toolResults?.update_form) {
      const formResult = result.toolResults?.update_form || result.toolResults?.create_form;
      if (formResult?.data) {
        progress.form = formResult.data;
      }
    }
    
    res.json({ 
      message: lastMsg?.text || 'No response', 
      messages: result.messages,
      toolResults: result.toolResults,
      progress: Object.keys(progress).length > 0 ? progress : null
    });
  } catch (error) {
    console.error('Unified Agent error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Original form-focused agent chat
app.post('/api/agent/chat', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { message, formId, currentForm } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    
    const result = await processAgentRequest(decoded.id, message, { formId, currentForm });
    const lastMsg = result.messages[result.messages.length - 1];
    
    // Extract progress information from messages
    const progress = {};
    const progressMessages = [];
    
    for (const msg of result.messages) {
      if (msg.text?.includes('Setting title:')) {
        const match = msg.text.match(/Setting title: "([^"]+)"/);
        if (match) progress.title = match[1];
        progressMessages.push({ type: 'title', value: match[1] });
      }
      if (msg.text?.includes('Adding description:')) {
        const match = msg.text.match(/Adding description: "([^"]+)"/);
        if (match) progress.description = match[1];
        progressMessages.push({ type: 'description', value: match[1] });
      }
      if (msg.text?.includes('Adding question')) {
        const match = msg.text.match(/Adding question \d+: "([^"]+)" \(([^)]+)\)/);
        if (match) {
          if (!progress.questions) progress.questions = [];
          progress.questions.push({ question: match[1], type: match[2] });
          progressMessages.push({ type: 'question', value: match[1], qtype: match[2] });
        }
      }
      if (msg.text?.includes('Form created') || msg.text?.includes('Form updated')) {
        progressMessages.push({ type: 'complete', value: msg.text });
      }
    }
    
    // If form was created/updated, include the form data
    if (result.toolResults?.create_form || result.toolResults?.update_form) {
      const formResult = result.toolResults?.update_form || result.toolResults?.create_form;
      if (formResult?.data) {
        progress.form = formResult.data;
      }
    }
    
    res.json({ 
      message: lastMsg?.text || 'No response', 
      messages: result.messages,
      progress: Object.keys(progress).length > 0 ? progress : null
    });
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
          
          // Extract form context if provided
          const context = {
            formId: data.formId,
            currentForm: data.currentForm
          };
          
          const result = await processAgentRequest(userId, data.message, context);
          const lastMsg = result.messages[result.messages.length - 1];
          
          // Also extract progress info for WS
const progress = {};
          for (const msg of result.messages) {
            if (msg.text?.includes('Setting title:')) {
              const match = msg.text.match(/Setting title: "([^"]+)"/);
              if (match) progress.title = match[1];
            }
            if (msg.text?.includes('Adding description:')) {
              const match = msg.text.match(/Adding description: "([^"]+)"/);
              if (match) progress.description = match[1];
            }
            if (msg.text?.includes('Adding question')) {
              const match = msg.text.match(/Adding question \d+: "([^"]+)" \(([^)]+)\)/);
              if (match) {
                if (!progress.questions) progress.questions = [];
                progress.questions.push({ question: match[1], type: match[2] });
              }
            }
          }
          
          ws.send(JSON.stringify({ 
            type: 'response', 
            message: lastMsg?.text, 
            messages: result.messages,
            progress: Object.keys(progress).length > 0 ? progress : null
          }));
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
  console.error(`[AUTH ERROR] ${err.message}`);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.AUTH_PORT || process.env.PORT || 3006;
server.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`[Auth] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Auth] HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Auth] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
