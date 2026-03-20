import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { createCheckout, handleWebhook } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/checkout', protect, createCheckout);
router.post('/webhook/:provider', handleWebhook);

export default router;
