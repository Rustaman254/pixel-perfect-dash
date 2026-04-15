import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { processAgentRequest } from "../services/agentService.js";

const router = express.Router();

router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const result = await processAgentRequest(userId, message);
    
    const lastMessage = result.messages[result.messages.length - 1];
    res.json({
      message: lastMessage?.text || "No response",
      messages: result.messages,
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    res.status(500).json({ message: "Failed to process request", error: error.message });
  }
});

export default router;