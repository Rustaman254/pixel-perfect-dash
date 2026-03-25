import express from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, getMe, sendOTP, verifyOTP, getMyApiKeys, updateProfile, createMyApiKey, deleteMyApiKey, forgotPassword, resetPassword } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { getEnabledFeatures } from "../controllers/adminController.js";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { message: "Too many requests, please try again later." }
});

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/me", protect, getMe);
router.get("/api-keys", protect, getMyApiKeys);
router.post("/api-keys", protect, createMyApiKey);
router.delete("/api-keys/:id", protect, deleteMyApiKey);
router.put("/profile", protect, updateProfile);
router.post("/send-otp", authLimiter, sendOTP);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/features", protect, getEnabledFeatures);

export default router;
