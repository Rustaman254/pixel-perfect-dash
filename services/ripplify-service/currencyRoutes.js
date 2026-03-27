import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './currencyController.js';

const router = Router();

// Protected routes
router.get('/supported', protectJwt, ctrl.getSupportedCurrencies);
router.get('/my', protectJwt, ctrl.getMyCurrencies);
router.put('/:code', protectJwt, ctrl.upsertCurrency);

export default router;
