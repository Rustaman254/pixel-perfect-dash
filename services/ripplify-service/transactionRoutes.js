import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './transactionController.js';

const router = Router();

// Protected routes
router.get('/my', protectJwt, ctrl.getMyTransactions);
router.get('/stats', protectJwt, ctrl.getTransactionStats);
router.post('/', protectJwt, ctrl.createTransaction);
router.put('/:id/status', protectJwt, ctrl.updateTransactionStatus);

// Public routes
router.get('/token/:token', ctrl.getTransactionByToken);

// Internal routes
router.get('/internal/transactions', internalAuth, ctrl.internalGetTransactions);
router.get('/internal/transactions/stats', internalAuth, ctrl.internalGetTransactionStats);

export default router;
