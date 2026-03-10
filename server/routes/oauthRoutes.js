import express from "express";
import { 
    getMyClients, 
    createClient, 
    deleteClient, 
    authorize, 
    handleConsent, 
    issueToken, 
    getUserInfo 
} from "../controllers/oauthController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Client Management (for developers)
router.get("/clients", protect, getMyClients);
router.post("/clients", protect, createClient);
router.delete("/clients/:id", protect, deleteClient);

// OAuth Flow
router.get("/authorize", protect, authorize);
router.post("/consent", protect, handleConsent);
router.post("/token", issueToken);
router.get("/userinfo", getUserInfo);

export default router;
