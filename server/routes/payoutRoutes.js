import express from 'express';
import { requestPayout, getPayouts } from '../controllers/payoutController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', requestPayout);
router.get('/', getPayouts);

export default router;
