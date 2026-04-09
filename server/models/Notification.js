import { getAdminDb } from "../config/db.js";

const Notification = {
    create: async ({ userId, title, message, type = 'info', actionUrl = null, actionLabel = null, targetRole = null, appName = 'ripplify' }) => {
        const db = getAdminDb();
        const [result] = await db('notifications').insert({
            userId, title, message, type, actionUrl, actionLabel, targetRole, appName
        }).returning('*');
        return result;
    },

    findByUserId: async (userId, role = null, userCreatedAt = null, appName = 'ripplify') => {
        const db = getAdminDb();
        let query = db('notifications').where('appName', appName);
        
        if (role === 'admin') {
            query = query.where(q => q.where({ userId }).orWhereNull('userId').where('targetRole', 'admin'));
        } else {
            query = query.where(q => q.where({ userId }).orWhereNull('userId').where('targetRole', 'seller').orWhereNull('userId').whereNull('targetRole'));
        }

        if (userCreatedAt) {
            query = query.where('createdAt', '>=', userCreatedAt);
        }

        return await query.orderBy('createdAt', 'desc');
    },

    markAsRead: async (id, userId) => {
        const db = getAdminDb();
        await db('notifications').where({ id }).andWhere(q => q.where({ userId }).orWhereNull('userId')).update({ isRead: true });
        return true;
    },

    markAllAsRead: async (userId, appName = 'ripplify') => {
        const db = getAdminDb();
        await db('notifications').where(q => q.where({ userId }).orWhereNull('userId')).where({ appName }).update({ isRead: true });
        return true;
    },

    delete: async (id, userId) => {
        const db = getAdminDb();
        await db('notifications').where({ id }).andWhere(q => q.where({ userId }).orWhereNull('userId')).del();
        return true;
    },

    findAll: async (appName = null) => {
        const db = getAdminDb();
        let query = db('notifications').leftJoin('users', 'notifications.userId', 'users.id')
            .select('notifications.*', 'users.email');
        
        if (appName) {
            query = query.where(q => q.whereNotNull('notifications.userId').orWhere('notifications.targetRole', 'admin'))
                .where('notifications.appName', appName);
        } else {
            query = query.where(q => q.whereNotNull('notifications.userId').orWhere('notifications.targetRole', 'admin'));
        }

        return await query.orderBy('notifications.createdAt', 'desc');
    }
};

export default Notification;
