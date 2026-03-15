import express from 'express';
import { createTransaction, getMyTransactions, handlePesapalIPN, getStats, getTransactionByTrackingToken, handleJengaIPN } from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Private routes
router.get('/my', protect, getMyTransactions);
router.get('/stats', protect, getStats);

// Public tracking route BEFORE the wildcard slug route
router.get('/public/track/:token', getTransactionByTrackingToken);

// Public route for creating a transaction from a payment link
router.post('/public/:slug', createTransaction);

// PesaPal Webhook (IPN)
router.get('/ipn/pesapal', handlePesapalIPN);
router.post('/ipn/jenga', handleJengaIPN);

export default router;
