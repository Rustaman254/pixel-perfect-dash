import { getDb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const Transaction = {
    create: async (transactionData) => {
        const db = getDb();
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
        const db = getDb();
        return await db('transactions').leftJoin('payment_links', 'transactions.linkId', 'payment_links.id')
            .select('transactions.*', 'payment_links.name as linkName', 'payment_links.slug as linkSlug')
            .where('transactions.userId', userId)
            .orderBy('transactions.createdAt', 'desc');
    },

    findById: async (id) => {
        const db = getDb();
        return await db('transactions').where({ id }).first();
    },

    findByTransactionId: async (transactionId) => {
        const db = getDb();
        return await db('transactions').where({ transactionId }).first();
    },

    findByTrackingToken: async (token) => {
        const db = getDb();
        return await db('transactions')
            .leftJoin('payment_links', 'transactions.linkId', 'payment_links.id')
            .leftJoin('users', 'payment_links.userId', 'users.id')
            .select('transactions.*', 'payment_links.name as linkName', 'payment_links.slug as linkSlug', 
                'payment_links.status as linkStatus', 'payment_links.currency', 'payment_links.price', 
                'payment_links.deliveryDays', 'payment_links.updatedAt as linkUpdatedAt', 'users.businessName')
            .where('transactions.trackingToken', token).first();
    },

    findStats: async (userId) => {
        const db = getDb();
        return await db('transactions')
            .select(db.raw(`DATE(createdAt) as date`))
            .select(db.raw(`SUM(CASE WHEN status IN ('Completed', 'Funds locked', 'Shipped') THEN amount ELSE 0 END) as revenue`))
            .select(db.raw(`COUNT(*) as count`))
            .select(db.raw(`SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as successfulCount`))
            .select(db.raw(`SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingCount`))
            .where({ userId })
            .groupByRaw(`DATE(createdAt)`)
            .orderBy('date', 'asc')
            .limit(30);
    },

    findPaymentMethodStats: async (userId) => {
        const db = getDb();
        return await db('transactions')
            .select('currency as name')
            .select(db.raw(`COUNT(*) as count`))
            .select(db.raw(`SUM(amount) as totalAmount`))
            .where({ userId })
            .groupBy('currency');
    },

    findAdminStats: async () => {
        const db = getDb();
        return await db('users')
            .leftJoin('transactions', 'users.id', 'transactions.userId')
            .select('users.id', 'users.businessName', 'users.email')
            .select(db.raw(`COUNT(transactions.id) as txCount`))
            .select(db.raw(`SUM(CASE WHEN transactions.status = 'Completed' THEN transactions.amount ELSE 0 END) as totalVolume`))
            .select(db.raw(`SUM(transactions.fee) as totalFees`))
            .where('users.role', 'seller')
            .groupBy('users.id')
            .orderByRaw('totalVolume DESC');
    },

    updateStatus: async (id, status) => {
        const db = getDb();
        return await db('transactions').where({ id }).update({ status });
    },

    updateTransactionId: async (id, transactionId) => {
        const db = getDb();
        return await db('transactions').where({ id }).update({ transactionId });
    }
};

export default Transaction;
