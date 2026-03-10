import express from 'express';
import { createCheckoutSession } from '../controllers/checkoutController.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// Public checkout endpoint
router.post('/create', apiKeyAuth, createCheckoutSession);

export default router;
