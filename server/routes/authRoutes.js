import express from "express";
import { registerUser, loginUser, getMe, sendOTP, verifyOTP, getMyApiKeys, updateProfile, createMyApiKey, deleteMyApiKey } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.get("/api-keys", protect, getMyApiKeys);
router.post("/api-keys", protect, createMyApiKey);
router.delete("/api-keys/:id", protect, deleteMyApiKey);
router.put("/profile", protect, updateProfile);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

export default router;
