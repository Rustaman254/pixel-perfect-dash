import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './walletController.js';

const router = Router();

// Protected routes
router.get('/', protectJwt, ctrl.getWallets);
router.post('/', protectJwt, ctrl.createWallet);
router.post('/deposit', protectJwt, ctrl.deposit);
router.post('/withdraw', protectJwt, ctrl.withdraw);

export default router;
