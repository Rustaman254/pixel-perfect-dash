import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import connectDB from "./config/db.js";
import emailService from "./services/emailService.js";
import smsService from "./services/smsService.js";
import authRoutes from "./routes/authRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import payoutRoutes from "./routes/payoutRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";
import currencyRoutes from "./routes/currencyRoutes.js";
import watchtowerRoutes from "./routes/watchtowerRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import rbacRoutes from "./routes/rbacRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import payoutMethodRoutes from "./routes/payoutMethodRoutes.js";
import formsRoutes from "./routes/formsRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";

dotenv.config();

// Connect to MongoDB
await connectDB();


// Initialize email service
emailService.initialize().catch(err => {
    console.error('Failed to initialize email service:', err.message);
});

// Initialize SMS service
smsService.initialize().catch(err => {
    console.error('Failed to initialize SMS service:', err.message);
});

const app = express();
app.set('trust proxy', 1);

// Request Logger at the very top
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
    'https://sokostack.ddns.net',
    'http://sokostack.ddns.net',
    'https://pixel-perfect-dash.vercel.app',
    'https://ripplify-hazel.vercel.app',
    'https://ripplify.vercel.app',
    'https://ripplify.sokostack.xyz',
    'https://shopalize.sokostack.xyz',
    'https://admin.sokostack.xyz',
    'https://auth.sokostack.xyz',
    'https://watchtower.sokostack.xyz',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    'http://127.0.0.1:8083'
];

// CORS middleware - must be before all routes
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Return false instead of throwing error to avoid 500 on preflight
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-app-name', 'X-API-Key', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'self'", "*"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.static("public"));
app.use(express.json({ type: ['application/json', 'text/plain'] }));


const server = http.createServer(app);

// WebSocket Server for Agent
const wss = new WebSocketServer({ server, path: "/ws/agent" });

const agentSessions = new Map();

wss.on("connection", async (ws, req) => {
  // Get user from auth token
  const token = req.url?.split("token=")[1]?.split("&")[0];
  
  if (!token) {
    ws.close(1008, "Authentication required");
    return;
  }

  // Verify token and get user
  try {
    const jwt = await import("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.default.verify(token, secret);
    const userId = decoded.id;

    agentSessions.set(ws, { userId });
    console.log(`Agent WebSocket connected: user ${userId}`);

    ws.send(JSON.stringify({
      type: "connected",
      message: "Connected to Forms AI Agent. How can I help you create a form today?"
    }));

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === "chat") {
          const { processAgentRequest } = await import("./services/agentService.js");
          const session = agentSessions.get(ws);
          
          ws.send(JSON.stringify({ type: "thinking" }));
          
          const result = await processAgentRequest(session.userId, data.message);
          
          const lastMessage = result.messages[result.messages.length - 1];
          
          ws.send(JSON.stringify({
            type: "response",
            message: lastMessage?.text || "No response",
            messages: result.messages
          }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: error.message
        }));
      }
    });

    ws.on("close", () => {
      agentSessions.delete(ws);
      console.log(`Agent WebSocket disconnected: user ${userId}`);
    });

  } catch (error) {
    console.error("WebSocket auth error:", error);
    ws.close(1008, "Invalid token");
  }
});

// Mount Routes
app.use("/api/watchtower", watchtowerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", rbacRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/user-payout-methods", payoutMethodRoutes);
app.use("/api/apps", appRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/agent", agentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.url} - ${err.stack}`);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Realtime Server API is running on port ${PORT}`);
});
