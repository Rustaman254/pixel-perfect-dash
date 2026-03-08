import { getDb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const ApiKey = {
    create: async (userId, name) => {
        const db = getDb();
        const key = `rf_${uuidv4().replace(/-/g, '')}`; // Ripplify prefix
        const result = await db.run(`
            INSERT INTO api_keys (userId, key, name, status)
            VALUES (?, ?, ?, ?)
        `, [userId, key, name, 'Active']);

        return await db.get(`SELECT * FROM api_keys WHERE id = ?`, result.lastID);
    },

    findByKey: async (key) => {
        const db = getDb();
        return await db.get(`
            SELECT ak.*, u.businessName, u.email as userEmail
            FROM api_keys ak
            JOIN users u ON ak.userId = u.id
            WHERE ak.key = ? AND ak.status = 'Active'
        `, key);
    },

    findAll: async () => {
        const db = getDb();
        return await db.all(`
            SELECT ak.*, u.email as userEmail, u.businessName
            FROM api_keys ak
            JOIN users u ON ak.userId = u.id
            ORDER BY ak.createdAt DESC
        `);
    },

    findByUserId: async (userId) => {
        const db = getDb();
        return await db.all(`
            SELECT * FROM api_keys 
            WHERE userId = ? 
            ORDER BY createdAt DESC
        `, userId);
    },

    delete: async (id) => {
        const db = getDb();
        return await db.run(`DELETE FROM api_keys WHERE id = ?`, id);
    },

    updateStatus: async (id, status) => {
        const db = getDb();
        return await db.run(`UPDATE api_keys SET status = ? WHERE id = ?`, [status, id]);
    }
};

export default ApiKey;
