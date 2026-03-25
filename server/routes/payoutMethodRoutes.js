import express from 'express';
import { getPayoutMethods, addPayoutMethod, updatePayoutMethod, deletePayoutMethod } from '../controllers/payoutMethodController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { enforceUserStatus } from '../middlewares/featureMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getPayoutMethods);
router.post('/', enforceUserStatus, addPayoutMethod);
router.put('/:id', enforceUserStatus, updatePayoutMethod);
router.delete('/:id', enforceUserStatus, deletePayoutMethod);

export default router;
