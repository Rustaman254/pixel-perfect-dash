import { getRipplifyDb } from '../config/db.js';

const UserPaymentMethod = {
    findAllByUserId: async (userId) => {
        const db = getRipplifyDb();
        return await db('user_payment_methods').where({ userId });
    },

    upsert: async (userId, methodId, enabled, fee) => {
        const db = getRipplifyDb();
        const existing = await db('user_payment_methods').where({ userId, methodId }).first();

        if (existing) {
            await db('user_payment_methods').where({ id: existing.id }).update({ enabled, fee });
        } else {
            await db('user_payment_methods').insert({ userId, methodId, enabled, fee });
        }
        
        return await db('user_payment_methods').where({ userId, methodId }).first();
    }
};

export default UserPaymentMethod;
