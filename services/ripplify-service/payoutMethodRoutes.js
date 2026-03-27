import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './payoutMethodController.js';

const router = Router();

// Protected routes
router.get('/', protectJwt, ctrl.getMethods);
router.post('/', protectJwt, ctrl.addMethod);
router.put('/:id', protectJwt, ctrl.updateMethod);
router.delete('/:id', protectJwt, ctrl.deleteMethod);

export default router;
