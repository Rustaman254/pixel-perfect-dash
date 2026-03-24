import express from 'express';
import { getUserCurrencies, upsertUserCurrency, getSupportedCurrenciesForUser } from '../controllers/currencyController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireFeature, enforceUserStatus } from '../middlewares/featureMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireFeature('currencies'));

router.get('/supported', getSupportedCurrenciesForUser);
router.get('/', getUserCurrencies);
router.put('/:code', enforceUserStatus, upsertUserCurrency);

export default router;
