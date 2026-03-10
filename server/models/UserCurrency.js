import { getDb } from '../config/db.js';

const UserCurrency = {
    findAllByUserId: async (userId) => {
        const db = getDb();
        return await db.all(`
            SELECT * FROM user_currencies
            WHERE userId = ?
        `, userId);
    },

    upsert: async (userId, code, enabled) => {
        const db = getDb();
        
        // Check if exists
        const existing = await db.get(`
            SELECT id FROM user_currencies WHERE userId = ? AND code = ?
        `, [userId, code]);

        if (existing) {
            await db.run(`
                UPDATE user_currencies 
                SET enabled = ?
                WHERE id = ?
            `, [enabled ? 1 : 0, existing.id]);
        } else {
            await db.run(`
                INSERT INTO user_currencies (userId, code, enabled)
                VALUES (?, ?, ?)
            `, [userId, code, enabled ? 1 : 0]);
        }
        
        return await db.get(`
            SELECT * FROM user_currencies WHERE userId = ? AND code = ?
        `, [userId, code]);
    }
};

export default UserCurrency;
