import express from 'express';
import { 
    createTransaction, 
    getMyTransactions, 
    getStats, 
    getTransactionByTrackingToken, 
    handleIntaSendWebhook,
    checkIntaSendPaymentStatus,
    updateTransactionStatus
} from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireFeature } from '../middlewares/featureMiddleware.js';

const router = express.Router();

// Private routes
router.get('/my', protect, requireFeature('transactions'), getMyTransactions);
router.get('/stats', protect, requireFeature('analytics'), getStats);
router.put('/:id/status', protect, requireFeature('transactions'), updateTransactionStatus);

// Public tracking route BEFORE the wildcard slug route
router.get('/public/track/:token', getTransactionByTrackingToken);

// Public route for creating a transaction from a payment link
router.post('/public/:slug', createTransaction);

// IntaSend payment status check
router.get('/intasend/status/:invoiceId', checkIntaSendPaymentStatus);

// Webhook (IPN) handler for IntaSend
router.post('/ipn/intasend', handleIntaSendWebhook);

export default router;
