import express from "express";
import http from "http";
import cors from "cors";
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
import insightRoutes from "./routes/insightRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/insights", insightRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Realtime Server API is running on port ${PORT}`);
});
