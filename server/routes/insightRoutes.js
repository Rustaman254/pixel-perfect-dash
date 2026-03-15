import express from 'express';
import { 
    getOverview, 
    getEntityAnalytics, 
    getSessions, 
    getSessionDetail,
    ingestData,
    getFeatureInsights,
    getProductAnalytics
} from '../controllers/insightController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected routes (Seller only)
router.get('/overview', protect, getOverview);
router.get('/features', protect, getFeatureInsights);
router.get('/products', protect, getProductAnalytics);
router.get('/entity/:id', protect, getEntityAnalytics);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:id', protect, getSessionDetail);

// Public route for data ingestion
router.post('/ingest', ingestData);

export default router;
