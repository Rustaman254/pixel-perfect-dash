import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { requireFeature, enforceUserStatus } from '../middlewares/featureMiddleware.js';
import { getWallets, depositFunds, withdrawFunds, internalTransfer } from '../controllers/walletController.js';

const router = express.Router();

router.route('/')
    .get(protect, requireFeature('wallets'), getWallets);

router.post('/deposit', protect, enforceUserStatus, requireFeature('wallets'), depositFunds);
router.post('/withdraw', protect, enforceUserStatus, requireFeature('wallets'), withdrawFunds);
router.post('/transfer', protect, enforceUserStatus, requireFeature('wallets'), internalTransfer);

export default router;
