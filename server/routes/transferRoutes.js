import express from 'express';
import { sendTransfer, sendBatchTransfer, getTransfers, searchUsers, checkTransferStatus } from '../controllers/transferController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireFeature, enforceUserStatus } from '../middlewares/featureMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireFeature('transfers'));

router.get('/', getTransfers);
router.get('/search', searchUsers);
router.get('/status/:id', checkTransferStatus);
router.post('/send', enforceUserStatus, sendTransfer);
router.post('/batch', enforceUserStatus, sendBatchTransfer);

export default router;
