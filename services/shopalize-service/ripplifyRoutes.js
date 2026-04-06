import express from 'express';
import * as ripplifyCtrl from './ripplifyController.js';
import { protectJwt } from '../shared/auth.js';

const router = express.Router();

// Create a Ripplify payment link for a product
// POST /api/shopalize/ripplify/create-link
router.post('/ripplify/create-link', protectJwt, ripplifyCtrl.createRipplifyPaymentLink);

// Get payment link status
// GET /api/shopalize/ripplify/link/:linkId/status
router.get('/ripplify/link/:linkId/status', protectJwt, ripplifyCtrl.getRipplifyPaymentLinkStatus);

// List all payment links
// GET /api/shopalize/ripplify/links
router.get('/ripplify/links', protectJwt, ripplifyCtrl.listRipplifyPaymentLinks);

export default router;
