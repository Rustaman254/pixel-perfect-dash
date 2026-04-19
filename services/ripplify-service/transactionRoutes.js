import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './transactionController.js';
import * as publicCtrl from './publicTransactionController.js';

const router = Router();

// Protected routes
router.get('/my', protectJwt, ctrl.getMyTransactions);
router.get('/stats', protectJwt, ctrl.getTransactionStats);
router.get('/daily-stats', protectJwt, ctrl.getTransactionDailyStats);
router.post('/', protectJwt, ctrl.createTransaction);
router.put('/:id/status', protectJwt, ctrl.updateTransactionStatus);

// Public routes
router.get('/token/:token', ctrl.getTransactionByToken);
router.post('/public/:slug', publicCtrl.createPublicTransaction);

// Internal routes
router.get('/internal/transactions', internalAuth, ctrl.internalGetTransactions);
router.get('/internal/transactions/stats', internalAuth, ctrl.internalGetTransactionStats);

export default router;
