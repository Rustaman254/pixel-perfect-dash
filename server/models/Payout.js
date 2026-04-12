import { getRipplifyDb, getAuthDb } from '../config/db.js';

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
        const payouts = await db('payouts').orderBy('createdAt', 'desc');
        
        // Add user data from auth_db
        const authDb = getAuthDb();
        const result = await Promise.all(payouts.map(async (payout) => {
            const user = await authDb('users').where('id', payout.userId).first();
            return {
                ...payout,
                fullName: user?.fullName || '',
                email: user?.email || '',
                businessName: user?.businessName || ''
            };
        }));
        
        return result;
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
