import express from 'express';
import { submitTicket, getTicketsForAdmin, updateTicketStatus } from '../controllers/supportController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Allow guests to submit tickets too, or optionally protect it if we only want users
router.post('/', submitTicket);

// Admin only routes
router.get('/admin', protect, getTicketsForAdmin);
router.put('/admin/:id', protect, updateTicketStatus);

export default router;
