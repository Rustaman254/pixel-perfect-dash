import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './paymentMethodController.js';

const router = Router();

// Protected routes
router.get('/', protectJwt, ctrl.getMethods);
router.put('/:methodId', protectJwt, ctrl.upsertMethod);

export default router;
