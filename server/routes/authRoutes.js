import express from "express";
import { registerUser, loginUser, getMe, sendOTP, verifyOTP, getMyApiKeys } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.get("/api-keys", protect, getMyApiKeys);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

export default router;
