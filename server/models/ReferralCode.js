import { getDb } from "../config/db.js";

const ReferralCode = {
    create: async ({ code, userId, discount = 0, maxUses = -1 }) => {
        const db = getDb();
        const result = await db.run(
            `INSERT INTO referral_codes (code, userId, discount, maxUses) VALUES (?, ?, ?, ?)`,
            [code, userId, discount, maxUses]
        );
        return { id: result.lastID, code, userId, discount, maxUses, currentUses: 0, isActive: 1, createdAt: new Date() };
    },

    findAll: async () => {
        const db = getDb();
        return await db.all(`
            SELECT rc.*, u.email as userEmail 
            FROM referral_codes rc 
            LEFT JOIN users u ON rc.userId = u.id 
            ORDER BY rc.createdAt DESC
        `);
    },

    findByCode: async (code) => {
        const db = getDb();
        return await db.get(`SELECT * FROM referral_codes WHERE code = ? AND isActive = 1`, [code]);
    },

    delete: async (id) => {
        const db = getDb();
        await db.run(`DELETE FROM referral_codes WHERE id = ?`, [id]);
        return true;
    },

    toggleActive: async (id, isActive) => {
        const db = getDb();
        await db.run(`UPDATE referral_codes SET isActive = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
        return true;
    },

    incrementUses: async (code) => {
        const db = getDb();
        await db.run(`UPDATE referral_codes SET currentUses = currentUses + 1 WHERE code = ?`, [code]);
        return true;
    }
};

export default ReferralCode;
