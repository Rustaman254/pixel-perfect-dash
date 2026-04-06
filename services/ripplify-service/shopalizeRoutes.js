import express from 'express';
import * as shopalizeCtrl from './shopalizeController.js';
import { protectJwt } from '../shared/auth.js';

const router = express.Router();

router.post('/checkout/shopalize', protectJwt, shopalizeCtrl.createShopalizeCheckout);
router.get('/checkout/shopalize/:checkoutSlug', shopalizeCtrl.getShopalizeCheckoutStatus);
router.post('/checkout/shopalize/:checkoutSlug/webhook', shopalizeCtrl.handleShopalizeWebhook);
router.get('/checkouts/store/:storeId', protectJwt, shopalizeCtrl.getStoreCheckouts);

export default router;