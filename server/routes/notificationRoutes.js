import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import {
    getMyNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    adminSendNotification,
    adminGetAllNotifications,
    adminMarkRead,
    adminMarkAllRead,
    adminDeleteNotification
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
router.put('/admin/read-all', protect, admin, adminMarkAllRead);
router.put('/admin/:id/read', protect, admin, adminMarkRead);
router.delete('/admin/:id', protect, admin, adminDeleteNotification);

export default router;
