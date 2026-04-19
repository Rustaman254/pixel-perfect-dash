import express from 'express';
import { requestPayout, getPayouts } from '../controllers/payoutController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireFeature, enforceUserStatus } from '../middlewares/featureMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireFeature('payouts'));

router.post('/', enforceUserStatus, requestPayout);
router.get('/', getPayouts);
router.get('/my', getPayouts); // Alias for frontend compatibility

export default router;
