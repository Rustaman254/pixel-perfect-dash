import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getDb } from "../config/db.js";
import smsService from "../services/smsService.js";

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
    try {
        const appName = req.headers['x-app-name'] || 'ripplify';
        const notifications = await Notification.findByUserId(req.user.id, req.user.role, req.user.createdAt, appName);
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
        const appName = req.headers['x-app-name'] || 'ripplify';
        await Notification.markAllAsRead(req.user.id, appName);
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
        const {
            userId, title, message, type, actionUrl, actionLabel,
            targetRole, appName = 'ripplify', deliveryChannel = 'app'
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required" });
        }

        // deliveryChannel: 'app', 'sms', 'both'
        const sendApp = deliveryChannel === 'app' || deliveryChannel === 'both';
        const sendSMS = deliveryChannel === 'sms' || deliveryChannel === 'both';

        // Create in-app notification (if applicable)
        let notification = null;
        if (sendApp) {
            notification = await Notification.create({
                userId: userId || null,
                title,
                message,
                type: type || 'info',
                actionUrl: actionUrl || null,
                actionLabel: actionLabel || null,
                targetRole: targetRole || null,
                appName,
                deliveryChannel
            });
        }

        // Send SMS notifications
        if (sendSMS) {
            let recipients = [];

            if (userId) {
                // Send to specific user
                const user = await User.findById(userId);
                if (user?.phone) {
                    recipients.push(user);
                }
            } else if (targetRole) {
                // Send to all users with that role
                const db = getDb();
                recipients = await db.all(
                    `SELECT id, phone, fullName FROM users WHERE role = ? AND phone != '' AND (isDisabled = 0 OR isDisabled IS NULL)`,
                    [targetRole]
                );
            } else {
                // Broadcast to all users
                const db = getDb();
                recipients = await db.all(
                    `SELECT id, phone, fullName FROM users WHERE phone != '' AND role != 'admin' AND (isDisabled = 0 OR isDisabled IS NULL)`
                );
            }

            // Send SMS to each recipient
            for (const user of recipients) {
                try {
                    const smsMessage = `${title}: ${message}`;
                    await smsService.sendSMS(user.phone, smsMessage);
                } catch (e) {
                    console.error(`SMS failed for user ${user.id}:`, e.message);
                }
            }
        }

        res.status(201).json({
            notification,
            deliveryChannel,
            message: `Notification sent via ${deliveryChannel === 'both' ? 'app + SMS' : deliveryChannel}`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin mark notification as read
// @route   PUT /api/notifications/admin/:id/read
// @access  Admin
export const adminMarkRead = async (req, res) => {
    try {
        const db = getDb();
        await db.run(`UPDATE notifications SET isRead = 1 WHERE id = ?`, req.params.id);
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin mark all notifications as read
// @route   PUT /api/notifications/admin/read-all
// @access  Admin
export const adminMarkAllRead = async (req, res) => {
    try {
        const db = getDb();
        await db.run(`UPDATE notifications SET isRead = 1`);
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin delete notification
// @route   DELETE /api/notifications/admin/:id
// @access  Admin
export const adminDeleteNotification = async (req, res) => {
    try {
        const db = getDb();
        await db.run(`DELETE FROM notifications WHERE id = ?`, req.params.id);
        res.json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all notifications (Admin only)
// @route   GET /api/notifications/admin/all
// @access  Admin
export const adminGetAllNotifications = async (req, res) => {
    try {
        const appName = req.headers['x-app-name'] || null;
        const notifications = await Notification.findAll(appName);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
