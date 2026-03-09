import { createTransaction, getMyTransactions, getTransactionByTrackingToken, getStats } from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Private routes
router.get('/my', protect, getMyTransactions);
router.get('/stats', protect, getStats);

// Public tracking route BEFORE the wildcard slug route
router.get('/public/track/:token', getTransactionByTrackingToken);

// Public route for creating a transaction from a payment link
router.post('/public/:slug', createTransaction);

export default router;

