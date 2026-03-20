import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getWallets, depositFunds, withdrawFunds, internalTransfer } from '../controllers/walletController.js';

const router = express.Router();

router.route('/')
    .get(protect, getWallets);

router.post('/deposit', protect, depositFunds);
router.post('/withdraw', protect, withdrawFunds);
router.post('/transfer', protect, internalTransfer);

export default router;
