import Notification from "../models/Notification.js";
import User from "../models/User.js";

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findByUserId(req.user.id, req.user.role, req.user.createdAt);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markRead = async (req, res) => {
    try {
        await Notification.markAsRead(req.params.id, req.user.id);
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    try {
        await Notification.delete(req.params.id, req.user.id);
        res.json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin send notification
// @route   POST /api/notifications/admin/send
// @access  Admin
export const adminSendNotification = async (req, res) => {
    try {
        const { userId, title, message, type, actionUrl, actionLabel, targetRole } = req.body;
        
        // If userId is provided, send to specific user. If null, it's a broadcast.
        const notification = await Notification.create({
            userId: userId || null,
            title,
            message,
            type: type || 'info',
            actionUrl: actionUrl || null,
            actionLabel: actionLabel || null,
            targetRole: targetRole || null
        });
        
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all notifications (Admin only)
// @route   GET /api/notifications/admin/all
// @access  Admin
export const adminGetAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll();
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
