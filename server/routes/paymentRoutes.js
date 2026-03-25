import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { enforceUserStatus, requireFeature } from '../middlewares/featureMiddleware.js';
import { createCheckout, handleWebhook } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/checkout', protect, enforceUserStatus, requireFeature('payment_links'), createCheckout);
router.post('/webhook/:provider', handleWebhook);

export default router;
