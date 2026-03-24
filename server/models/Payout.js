import { getDb } from '../config/db.js';

const Payout = {
    create: async (payoutData) => {
        const db = getDb();
        const result = await db.run(`
      INSERT INTO payouts (
        userId, amount, fee, currency, method, details, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            payoutData.userId,
            payoutData.amount,
            payoutData.fee || 0,
            payoutData.currency,
            payoutData.method,
            payoutData.details,
            payoutData.status || 'Processing'
        ]);

        return await db.get(`SELECT * FROM payouts WHERE id = ?`, result.lastID);
    },

    findAll: async () => {
        const db = getDb();
        return await db.all(`
            SELECT p.*, u.fullName, u.email, u.businessName 
            FROM payouts p
            LEFT JOIN users u ON p.userId = u.id
            ORDER BY p.createdAt DESC
        `);
    },

    findAllByUserId: async (userId) => {
        const db = getDb();
        return await db.all(`SELECT * FROM payouts WHERE userId = ? ORDER BY createdAt DESC`, userId);
    },

    updateStatus: async (id, status) => {
        const db = getDb();
        await db.run(`UPDATE payouts SET status = ? WHERE id = ?`, [status, id]);
        return await db.get(`SELECT * FROM payouts WHERE id = ?`, id);
    }
};

export default Payout;
