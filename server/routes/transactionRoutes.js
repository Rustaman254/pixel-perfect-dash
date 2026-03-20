import express from 'express';
import { 
    createTransaction, 
    getMyTransactions, 
    getStats, 
    getTransactionByTrackingToken, 
    handlePaystackIPN,
    submitPaystackOTP,
    submitPaystackPIN,
    submitPaystackBirthday,
    submitPaystackAddress,
    verifyPaystackPayment
} from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Private routes
router.get('/my', protect, getMyTransactions);
router.get('/stats', protect, getStats);

// Public tracking route BEFORE the wildcard slug route
router.get('/public/track/:token', getTransactionByTrackingToken);

// Public route for creating a transaction from a payment link
router.post('/public/:slug', createTransaction);

// Paystack specific collection routes
router.post('/paystack/submit-otp', submitPaystackOTP);
router.post('/paystack/submit-pin', submitPaystackPIN);
router.post('/paystack/submit-birthday', submitPaystackBirthday);
router.post('/paystack/submit-address', submitPaystackAddress);
router.get('/paystack/public-key', (req, res) => res.json({ publicKey: process.env.PAYSTACK_PUBLIC_KEY }));
router.get('/paystack/verify/:reference', verifyPaystackPayment);

// Webhook (IPN) handlers
router.post('/ipn/paystack', handlePaystackIPN);

export default router;
