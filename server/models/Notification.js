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

        if (role === 'admin') {
            // Admin sees:
            // - Notifications directly addressed to them (userId = admin.id)
            // - Broadcasts targeted at admins (userId IS NULL AND targetRole = 'admin')
            // Does NOT see: user-specific notifications or general seller broadcasts
            return await db.all(`
                SELECT * FROM notifications
                WHERE (
                    (userId = ? AND appName = ?)
                    OR (userId IS NULL AND targetRole = 'admin' AND appName = ?)
                )
                ORDER BY createdAt DESC
            `, [userId, appName, appName]);
        }

        // Seller sees:
        // - Notifications directly addressed to them (userId = seller.id)
        // - Broadcasts targeted at sellers (userId IS NULL AND targetRole = 'seller')
        // - General broadcasts with no target (userId IS NULL AND targetRole IS NULL)
        // Does NOT see: admin-targeted broadcasts
        let query = `
            SELECT * FROM notifications
            WHERE appName = ? AND (
                (userId = ?)
                OR (userId IS NULL AND targetRole = 'seller')
                OR (userId IS NULL AND targetRole IS NULL)
            )
        `;
        let params = [appName, userId];

        // Filter broadcast notifications to only show those created after user joined
        if (userCreatedAt) {
            query = `
                SELECT * FROM notifications
                WHERE appName = ? AND (
                    userId = ?
                    OR (userId IS NULL AND targetRole = 'seller' AND createdAt >= ?)
                    OR (userId IS NULL AND targetRole IS NULL AND createdAt >= ?)
                )
            `;
            params = [appName, userId, userCreatedAt, userCreatedAt];
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

    // Admin specific: get only admin-relevant notifications
    findAll: async (appName = null) => {
        const db = getDb();
        // Admin sees: direct-to-admin notifications + admin-targeted broadcasts
        // Does NOT see: user-specific notifications or seller broadcasts
        if (appName) {
            return await db.all(`
                SELECT n.*, u.email
                FROM notifications n
                LEFT JOIN users u ON n.userId = u.id
                WHERE (n.userId IS NOT NULL OR n.targetRole = 'admin')
                AND n.appName = ?
                ORDER BY n.createdAt DESC
            `, [appName]);
        }
        return await db.all(`
            SELECT n.*, u.email
            FROM notifications n
            LEFT JOIN users u ON n.userId = u.id
            WHERE n.userId IS NOT NULL OR n.targetRole = 'admin'
            ORDER BY n.createdAt DESC
        `);
    }
};

export default Notification;
