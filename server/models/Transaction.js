import { getRipplifyDb, getAuthDb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const Transaction = {
    create: async (transactionData) => {
        const db = getRipplifyDb();
        const trackingToken = uuidv4();
        const [result] = await db('transactions').insert({
            userId: transactionData.userId,
            linkId: transactionData.linkId,
            buyerName: transactionData.buyerName,
            buyerEmail: transactionData.buyerEmail,
            buyerPhone: transactionData.buyerPhone,
            amount: transactionData.amount,
            fee: transactionData.fee || 0,
            currency: transactionData.currency,
            status: transactionData.status || 'Pending',
            transactionId: transactionData.transactionId,
            trackingToken,
            type: transactionData.type || 'Payment'
        }).returning('*');

        return result;
    },

    findAllByUserId: async (userId) => {
        const db = getRipplifyDb();
        return await db('transactions').leftJoin('payment_links', 'transactions.linkId', 'payment_links.id')
            .select('transactions.*', 'payment_links.name as linkName', 'payment_links.slug as linkSlug')
            .where('transactions.userId', userId)
            .orderBy('transactions.createdAt', 'desc');
    },

    findById: async (id) => {
        const db = getRipplifyDb();
        return await db('transactions').where({ id }).first();
    },

    findByTransactionId: async (transactionId) => {
        const db = getRipplifyDb();
        return await db('transactions').where({ transactionId }).first();
    },

    findByTrackingToken: async (token) => {
        const db = getRipplifyDb();
        const transaction = await db('transactions').where('trackingToken', token).first();
        if (!transaction) return null;
        
        // Get payment link data
        const link = transaction.linkId ? await db('payment_links').where('id', transaction.linkId).first() : null;
        
        // Get user data from auth_db
        const user = link ? await getAuthDb()('users').where('id', link.userId).first() : null;
        
        return {
            ...transaction,
            linkName: link?.name || null,
            linkSlug: link?.slug || null,
            linkStatus: link?.status || null,
            currency: link?.currency || transaction.currency,
            price: link?.price || null,
            deliveryDays: link?.deliveryDays || null,
            linkUpdatedAt: link?.updatedAt || null,
            businessName: user?.businessName || ''
        };
    },

    findStats: async (userId) => {
        const db = getRipplifyDb();
        return await db('transactions')
            .select(db.raw(`DATE("createdAt") as date`))
            .select(db.raw(`SUM(CASE WHEN "status" IN ('Completed', 'Funds locked', 'Shipped') THEN "amount" ELSE 0 END) as revenue`))
            .select(db.raw(`COUNT(*) as count`))
            .select(db.raw(`SUM(CASE WHEN "status" = 'Completed' THEN 1 ELSE 0 END) as successfulCount`))
            .select(db.raw(`SUM(CASE WHEN "status" = 'Pending' THEN 1 ELSE 0 END) as pendingCount`))
            .where('userId', userId)
            .groupByRaw(`DATE("createdAt")`)
            .orderBy('date', 'asc')
            .limit(30);
    },

    findPaymentMethodStats: async (userId) => {
        const db = getRipplifyDb();
        return await db('transactions')
            .select('currency as name')
            .select(db.raw(`COUNT(*) as count`))
            .select(db.raw(`SUM("amount") as totalAmount`))
            .where('userId', userId)
            .groupBy('currency');
    },

    findAdminStats: async () => {
        const db = getRipplifyDb();
        const authDb = getAuthDb();
        
        // Get users with transactions
        const transactions = await db('transactions').select('userId');
        const userIds = [...new Set(transactions.map(t => t.userId))];
        
        const result = await Promise.all(userIds.map(async (userId) => {
            const user = await authDb('users').where('id', userId).first();
            const txCount = transactions.filter(t => t.userId === userId).length;
            const completedTxs = await db('transactions').where('userId', userId).where('status', 'Completed').select(db.raw('SUM(amount) as totalVolume, SUM(fee) as totalFees')).first();
            
            return {
                id: userId,
                email: user?.email || '',
                businessName: user?.businessName || '',
                txCount,
                totalVolume: completedTxs?.totalVolume || 0,
                totalFees: completedTxs?.totalFees || 0
            };
        }));
        
        return result.sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
    },

    updateStatus: async (id, status) => {
        const db = getRipplifyDb();
        return await db('transactions').where({ id }).update({ status });
    },

    updateTransactionId: async (id, transactionId) => {
        const db = getRipplifyDb();
        return await db('transactions').where({ id }).update({ transactionId });
    }
};

export default Transaction;
