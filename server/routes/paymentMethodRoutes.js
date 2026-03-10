import express from 'express';
import { getUserPaymentMethods, upsertUserPaymentMethod } from '../controllers/paymentMethodController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserPaymentMethods);
router.put('/:methodId', upsertUserPaymentMethod);

export default router;
