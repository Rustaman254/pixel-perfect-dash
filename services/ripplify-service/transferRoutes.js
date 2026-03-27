import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './transferController.js';

const router = Router();

// Protected routes
router.post('/', protectJwt, ctrl.sendTransfer);
router.get('/my', protectJwt, ctrl.getMyTransfers);

export default router;
