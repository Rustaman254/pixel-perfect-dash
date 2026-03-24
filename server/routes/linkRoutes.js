import express from 'express';
import { createLink, getMyLinks, getPublicLink, deleteLink, updateLinkStatus, confirmDelivery, reportDispute } from '../controllers/linkController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireFeature, enforceUserStatus } from '../middlewares/featureMiddleware.js';

const router = express.Router();

// Private routes (registered first to avoid wildcard conflicts)
router.post('/', protect, enforceUserStatus, requireFeature('payment_links'), createLink);
router.get('/my', protect, requireFeature('payment_links'), getMyLinks);
router.delete('/:id', protect, enforceUserStatus, requireFeature('payment_links'), deleteLink);
router.put('/:id/status', protect, enforceUserStatus, requireFeature('payment_links'), updateLinkStatus);

// Public specific routes FIRST (before the wildcard GET /public/:slug)
router.put('/public/:slug/confirm', confirmDelivery);
router.put('/public/:slug/dispute', reportDispute);

// Public wildcard route LAST
router.get('/public/:slug', getPublicLink);

export default router;


