import { getDb } from '../config/db.js';

const UserPaymentMethod = {
    findAllByUserId: async (userId) => {
        const db = getDb();
        return await db.all(`
            SELECT * FROM user_payment_methods
            WHERE userId = ?
        `, userId);
    },

    upsert: async (userId, methodId, enabled, fee) => {
        const db = getDb();
        
        // Check if exists
        const existing = await db.get(`
            SELECT id FROM user_payment_methods WHERE userId = ? AND methodId = ?
        `, [userId, methodId]);

        if (existing) {
            await db.run(`
                UPDATE user_payment_methods 
                SET enabled = ?, fee = ?
                WHERE id = ?
            `, [enabled ? 1 : 0, fee, existing.id]);
        } else {
            await db.run(`
                INSERT INTO user_payment_methods (userId, methodId, enabled, fee)
                VALUES (?, ?, ?, ?)
            `, [userId, methodId, enabled ? 1 : 0, fee]);
        }
        
        return await db.get(`
            SELECT * FROM user_payment_methods WHERE userId = ? AND methodId = ?
        `, [userId, methodId]);
    }
};

export default UserPaymentMethod;
