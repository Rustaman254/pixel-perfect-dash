import { getAuthDb } from '../config/db.js';

const UserCurrency = {
    findAllByUserId: async (userId) => {
        const db = getAuthDb();
        return await db('user_currencies').where({ userId });
    },

    upsert: async (userId, code, enabled) => {
        const db = getAuthDb();
        const existing = await db('user_currencies').where({ userId, code }).first();

        if (existing) {
            await db('user_currencies').where({ id: existing.id }).update({ enabled });
        } else {
            await db('user_currencies').insert({ userId, code, enabled });
        }
        
        return await db('user_currencies').where({ userId, code }).first();
    }
};

export default UserCurrency;
