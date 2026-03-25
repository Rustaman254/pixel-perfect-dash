import express from 'express';
import { getUserPaymentMethods, upsertUserPaymentMethod } from '../controllers/paymentMethodController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireFeature, enforceUserStatus } from '../middlewares/featureMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireFeature('payment_methods'));

router.get('/', getUserPaymentMethods);
router.put('/:methodId', enforceUserStatus, upsertUserPaymentMethod);

export default router;
