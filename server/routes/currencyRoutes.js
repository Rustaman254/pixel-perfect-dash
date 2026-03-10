import express from 'express';
import { getUserCurrencies, upsertUserCurrency, getSupportedCurrenciesForUser } from '../controllers/currencyController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/supported', getSupportedCurrenciesForUser);
router.get('/', getUserCurrencies);
router.put('/:code', upsertUserCurrency);

export default router;
