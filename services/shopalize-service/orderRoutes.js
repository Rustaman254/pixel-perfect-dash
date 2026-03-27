import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './orderController.js';

const router = Router();

router.get('/', protectJwt, ctrl.getOrders);
router.get('/stats', protectJwt, ctrl.getOrderStats);

// Internal: called by Ripplify when payment is confirmed
router.post('/internal/orders', internalAuth, ctrl.createOrder);

export default router;
