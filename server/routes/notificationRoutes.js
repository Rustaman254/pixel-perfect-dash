import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import {
    getMyNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    adminSendNotification,
    adminGetAllNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// User routes
router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markRead);
router.put('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes
router.post('/admin/send', protect, admin, adminSendNotification);
router.get('/admin/all', protect, admin, adminGetAllNotifications);

export default router;
