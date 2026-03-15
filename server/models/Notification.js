import { getDb } from "../config/db.js";

const Notification = {
    create: async ({ userId, title, message, type = 'info', actionUrl = null, actionLabel = null, targetRole = null, appName = 'ripplify' }) => {
        const db = getDb();
        const result = await db.run(
            `INSERT INTO notifications (userId, title, message, type, actionUrl, actionLabel, targetRole, appName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, message, type, actionUrl, actionLabel, targetRole, appName]
        );
        return { id: result.lastID, userId, title, message, type, actionUrl, actionLabel, targetRole, appName, isRead: 0, createdAt: new Date() };
    },

    findByUserId: async (userId, role = null, userCreatedAt = null, appName = 'ripplify') => {
        const db = getDb();
        let query;
        let params = [userId, appName];

        if (role) {
            query = `SELECT * FROM notifications 
                     WHERE (userId = ? AND appName = ?) 
                     OR (userId IS NULL AND (targetRole = ? OR targetRole IS NULL) AND appName = ?)`;
            params.push(role, appName);
        } else {
            query = `SELECT * FROM notifications WHERE (userId = ? AND appName = ?) OR (userId IS NULL AND appName = ?)`;
            params.push(appName);
        }

        // If userCreatedAt is provided, filter broadcast notifications (userId IS NULL)
        // to only show those created after the user joined.
        if (userCreatedAt) {
            query = `SELECT * FROM (${query}) AS base
                     WHERE userId IS NOT NULL 
                     OR createdAt >= ?`;
            params.push(userCreatedAt);
        }

        return await db.all(`${query} ORDER BY createdAt DESC`, params);
    },

    markAsRead: async (id, userId) => {
        const db = getDb();
        await db.run(
            `UPDATE notifications SET isRead = 1 WHERE id = ? AND (userId = ? OR userId IS NULL)`,
            [id, userId]
        );
        return true;
    },

    markAllAsRead: async (userId, appName = 'ripplify') => {
        const db = getDb();
        await db.run(
            `UPDATE notifications SET isRead = 1 WHERE (userId = ? OR userId IS NULL) AND appName = ?`,
            [userId, appName]
        );
        return true;
    },

    delete: async (id, userId) => {
        const db = getDb();
        await db.run(
            `DELETE FROM notifications WHERE id = ? AND (userId = ? OR userId IS NULL)`,
            [id, userId]
        );
        return true;
    },

    // Admin specific: get all notifications
    findAll: async (appName = null) => {
        const db = getDb();
        if (appName) {
            return await db.all(`SELECT n.*, u.email FROM notifications n LEFT JOIN users u ON n.userId = u.id WHERE n.appName = ? ORDER BY n.createdAt DESC`, [appName]);
        }
        return await db.all(`SELECT n.*, u.email FROM notifications n LEFT JOIN users u ON n.userId = u.id ORDER BY n.createdAt DESC`);
    }
};

export default Notification;
