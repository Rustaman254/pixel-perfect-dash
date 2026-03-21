import express from 'express';
import { 
    getOverview, 
    getEntityAnalytics, 
    getSessions, 
    getSessionDetail,
    ingestData,
    getFeatureInsights,
    getProductAnalytics,
    getPlatformOverview
} from '../controllers/watchtowerController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected routes (Seller only)
router.get('/overview', protect, getOverview);
router.get('/features', protect, getFeatureInsights);
router.get('/products', protect, getProductAnalytics);
router.get('/entity/:id', protect, getEntityAnalytics);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:id', protect, getSessionDetail);

// Admin routes
router.get('/platform-overview', protect, admin, getPlatformOverview);

// Public route for data ingestion (allow any origin)
import cors from 'cors';
const ingestCors = cors({ origin: true, credentials: true });
router.post('/ingest', ingestCors, ingestData);

export default router;
