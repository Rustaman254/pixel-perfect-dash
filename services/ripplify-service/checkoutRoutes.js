import { Router } from 'express';
import { internalAuth } from '../shared/auth.js';
import * as ctrl from './checkoutController.js';

const router = Router();

// Public (API key auth handled inside controller)
router.post('/', ctrl.createCheckout);

export default router;
