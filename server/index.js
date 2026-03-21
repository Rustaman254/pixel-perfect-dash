import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
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

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
    'https://sokostack.ddns.net',
    'http://sokostack.ddns.net',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.static("public"));
app.use(express.json({ type: ['application/json', 'text/plain'] }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const server = http.createServer(app);

// Mount Routes
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
app.use("/api/watchtower", watchtowerRoutes);
app.use("/api/apps", appRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Realtime Server API is running on port ${PORT}`);
});
