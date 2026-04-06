import express from 'express';
import * as paymentLinkCtrl from './paymentLinkController.js';
import { protectJwt } from '../shared/auth.js';

const router = express.Router();

// Create a new payment link
// POST /api/payment-links/create
router.post('/create', paymentLinkCtrl.createPaymentLink);

// List payment links
// GET /api/payment-links
router.get('/', protectJwt, paymentLinkCtrl.listPaymentLinks);

// Get payment link by ID or slug
// GET /api/payment-links/:id
router.get('/:id', paymentLinkCtrl.getPaymentLink);

// Get payment link status
// GET /api/payment-links/:id/status
router.get('/:id/status', paymentLinkCtrl.getPaymentLinkStatus);

// Update payment link
// PUT /api/payment-links/:id
router.put('/:id', paymentLinkCtrl.updatePaymentLink);

// Webhook endpoint for payment events
// POST /api/webhooks/ripplify
router.post('/webhooks/ripplify', paymentLinkCtrl.handlePaymentWebhook);

export default router;
