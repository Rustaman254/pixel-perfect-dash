import { getDb } from "../config/db.js";

const ReferralCode = {
    create: async ({ code, userId, discount = 0, maxUses = -1, pointsPerReferral = 10, expiresAt = null }) => {
        const db = getDb();
        const result = await db.run(
            `INSERT INTO referral_codes (code, userId, discount, maxUses, pointsPerReferral, expiresAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [code, userId || null, discount, maxUses, pointsPerReferral, expiresAt || null]
        );
        return { id: result.lastID, code, userId, discount, maxUses, pointsPerReferral, expiresAt, currentUses: 0, isActive: 1, createdAt: new Date() };
    },

    findAll: async () => {
        const db = getDb();
        return await db.all(`
            SELECT rc.*, u.email as userEmail, u.fullName as userFullName, u.businessName as userBusiness
            FROM referral_codes rc 
            LEFT JOIN users u ON rc.userId = u.id 
            ORDER BY rc.createdAt DESC
        `);
    },

    findByCode: async (code) => {
        const db = getDb();
        return await db.get(`SELECT * FROM referral_codes WHERE code = ? AND isActive = 1`, [code]);
    },

    findById: async (id) => {
        const db = getDb();
        return await db.get(`SELECT * FROM referral_codes WHERE id = ?`, [id]);
    },

    delete: async (id) => {
        const db = getDb();
        await db.run(`DELETE FROM referral_usage WHERE referralCodeId = ?`, id);
        await db.run(`DELETE FROM referral_codes WHERE id = ?`, id);
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
    },

    // Record that a user used a referral code
    recordUsage: async (referralCodeId, code, referrerId, referredUserId, pointsAwarded) => {
        const db = getDb();
        await db.run(
            `INSERT INTO referral_usage (referralCodeId, code, referrerId, referredUserId, pointsAwarded) VALUES (?, ?, ?, ?, ?)`,
            [referralCodeId, code, referrerId, referredUserId, pointsAwarded]
        );
        // Increment uses on the code
        await db.run(`UPDATE referral_codes SET currentUses = currentUses + 1 WHERE id = ?`, referralCodeId);
        // Award points to referrer
        if (referrerId && pointsAwarded > 0) {
            await db.run(`UPDATE users SET referralPoints = referralPoints + ? WHERE id = ?`, [pointsAwarded, referrerId]);
        }
        return true;
    },

    // Get usage history for a specific referral code
    getUsageByCodeId: async (codeId) => {
        const db = getDb();
        return await db.all(`
            SELECT ru.*, u.fullName as referredName, u.email as referredEmail, u.businessName as referredBusiness
            FROM referral_usage ru
            LEFT JOIN users u ON ru.referredUserId = u.id
            WHERE ru.referralCodeId = ?
            ORDER BY ru.createdAt DESC
        `, codeId);
    },

    // Get all referrals made by a user
    getReferralsByUserId: async (userId) => {
        const db = getDb();
        return await db.all(`
            SELECT ru.*, rc.code, u.fullName as referredName, u.email as referredEmail
            FROM referral_usage ru
            LEFT JOIN referral_codes rc ON ru.referralCodeId = rc.id
            LEFT JOIN users u ON ru.referredUserId = u.id
            WHERE ru.referrerId = ?
            ORDER BY ru.createdAt DESC
        `, userId);
    },

    // Validate a referral code for registration
    validateForRegistration: async (code) => {
        const db = getDb();
        const referral = await db.get(
            `SELECT rc.*, u.fullName as referrerName, u.email as referrerEmail
             FROM referral_codes rc
             LEFT JOIN users u ON rc.userId = u.id
             WHERE rc.code = ? AND rc.isActive = 1`,
            code
        );
        if (!referral) return { valid: false, message: "Invalid referral code" };
        if (referral.maxUses > 0 && referral.currentUses >= referral.maxUses) {
            return { valid: false, message: "This referral code has reached its usage limit" };
        }
        if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
            return { valid: false, message: "This referral code has expired" };
        }
        return { valid: true, referral };
    }
};

export default ReferralCode;
