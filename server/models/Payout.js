import { getRipplifyDb } from '../config/db.js';

const Payout = {
    create: async (payoutData) => {
        const db = getRipplifyDb();
        const [result] = await db('payouts').insert({
            userId: payoutData.userId,
            amount: payoutData.amount,
            fee: payoutData.fee || 0,
            currency: payoutData.currency,
            method: payoutData.method,
            details: payoutData.details,
            status: payoutData.status || 'Processing'
        }).returning('*');
        return result;
    },

    findAll: async () => {
        const db = getRipplifyDb();
        return await db('payouts')
            .leftJoin('users', 'payouts.userId', 'users.id')
            .select('payouts.*', 'users.fullName', 'users.email', 'users.businessName')
            .orderBy('payouts.createdAt', 'desc');
    },

    findAllByUserId: async (userId) => {
        const db = getRipplifyDb();
        return await db('payouts').where({ userId }).orderBy('createdAt', 'desc');
    },

    updateStatus: async (id, status) => {
        const db = getRipplifyDb();
        await db('payouts').where({ id }).update({ status });
        return await db('payouts').where({ id }).first();
    }
};

export default Payout;
