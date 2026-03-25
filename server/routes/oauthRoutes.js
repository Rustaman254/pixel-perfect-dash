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
import { requireFeature, enforceUserStatus } from "../middlewares/featureMiddleware.js";

const router = express.Router();

// Client Management (for developers)
router.get("/clients", protect, requireFeature('oauth'), getMyClients);
router.post("/clients", protect, enforceUserStatus, requireFeature('oauth'), createClient);
router.delete("/clients/:id", protect, enforceUserStatus, requireFeature('oauth'), deleteClient);

// OAuth Flow
router.get("/authorize", protect, requireFeature('oauth'), authorize);
router.post("/consent", protect, requireFeature('oauth'), handleConsent);
router.post("/token", issueToken);
router.get("/userinfo", getUserInfo);

export default router;
