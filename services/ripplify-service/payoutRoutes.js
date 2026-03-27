import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './payoutController.js';

const router = Router();

// Protected routes
router.post('/', protectJwt, ctrl.requestPayout);
router.get('/my', protectJwt, ctrl.getMyPayouts);

// Internal routes
router.get('/internal/payouts', internalAuth, ctrl.internalGetPayouts);

export default router;
