import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './transactionController.js';
import * as publicCtrl from './publicTransactionController.js';
import IntaSendProvider from './utils/IntaSendProvider.js';

const provider = new IntaSendProvider();

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

// IntaSend payment status check
router.get('/intasend/status/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const result = await provider.checkPaymentStatus(invoiceId);
        res.json(result);
    } catch (error) {
        console.error('IntaSend status check error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;