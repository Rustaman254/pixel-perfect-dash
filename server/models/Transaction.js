import { getDb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const Transaction = {
    create: async (transactionData) => {
        const db = getDb();
        const trackingToken = uuidv4();
        const result = await db.run(`
      INSERT INTO transactions (
        userId, linkId, buyerName, buyerEmail, buyerPhone, amount, currency, status, transactionId, trackingToken, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            transactionData.userId,
            transactionData.linkId,
            transactionData.buyerName,
            transactionData.buyerEmail,
            transactionData.buyerPhone,
            transactionData.amount,
            transactionData.currency,
            transactionData.status || 'Pending',
            transactionData.transactionId,
            trackingToken,
            transactionData.type || 'Payment'
        ]);

        return await db.get(`SELECT * FROM transactions WHERE id = ?`, result.lastID);
    },

    findAllByUserId: async (userId) => {
        const db = getDb();
        return await db.all(`
            SELECT t.*, p.name as linkName, p.slug as linkSlug
            FROM transactions t
            LEFT JOIN payment_links p ON t.linkId = p.id
            WHERE t.userId = ? 
            ORDER BY t.createdAt DESC
        `, userId);
    },

    findById: async (id) => {
        const db = getDb();
        return await db.get(`SELECT * FROM transactions WHERE id = ?`, id);
    },

    findByTransactionId: async (transactionId) => {
        const db = getDb();
        return await db.get(`SELECT * FROM transactions WHERE transactionId = ?`, transactionId);
    },

    findByTrackingToken: async (token) => {
        const db = getDb();
        return await db.get(`
            SELECT t.*, p.name as linkName, p.slug as linkSlug, p.status as linkStatus,
                   p.currency, p.price, p.deliveryDays, p.updatedAt as linkUpdatedAt,
                   u.businessName
            FROM transactions t
            LEFT JOIN payment_links p ON t.linkId = p.id
            LEFT JOIN users u ON p.userId = u.id
            WHERE t.trackingToken = ?
        `, token);
    }
};

export default Transaction;
