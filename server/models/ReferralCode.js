import { getAuthDb } from "../config/db.js";

const ReferralCode = {
    create: async ({ code, userId, discount = 0, maxUses = -1, pointsPerReferral = 10, expiresAt = null }) => {
        const db = getAuthDb();
        const [result] = await db('referral_codes').insert({
            code, userId, discount, maxUses, pointsPerReferral, expiresAt
        }).returning('*');
        return result;
    },

    findAll: async () => {
        const db = getAuthDb();
        return await db('referral_codes')
            .leftJoin('users', 'referral_codes.userId', 'users.id')
            .select('referral_codes.*', 'users.email as userEmail', 'users.fullName as userFullName', 'users.businessName as userBusiness')
            .orderBy('referral_codes.createdAt', 'desc');
    },

    findByCode: async (code) => {
        const db = getAuthDb();
        return await db('referral_codes').where({ code, isActive: true }).first();
    },

    findById: async (id) => {
        const db = getAuthDb();
        return await db('referral_codes').where({ id }).first();
    },

    delete: async (id) => {
        const db = getAuthDb();
        await db('referral_usage').where({ referralCodeId: id }).del();
        await db('referral_codes').where({ id }).del();
        return true;
    },

    toggleActive: async (id, isActive) => {
        const db = getAuthDb();
        await db('referral_codes').where({ id }).update({ isActive });
        return true;
    },

    incrementUses: async (code) => {
        const db = getAuthDb();
        await db('referral_codes').where({ code }).increment('currentUses', 1);
        return true;
    },

    recordUsage: async (referralCodeId, code, referrerId, referredUserId, pointsAwarded) => {
        const db = getAuthDb();
        await db('referral_usage').insert({
            referralCodeId, code, referrerId, referredUserId, pointsAwarded
        });
        await db('referral_codes').where({ id: referralCodeId }).increment('currentUses', 1);
        if (referrerId && pointsAwarded > 0) {
            await db('users').where({ id: referrerId }).increment('referralPoints', pointsAwarded);
        }
        return true;
    },

    getUsageByCodeId: async (codeId) => {
        const db = getAuthDb();
        return await db('referral_usage')
            .leftJoin('users', 'referral_usage.referredUserId', 'users.id')
            .select('referral_usage.*', 'users.fullName as referredName', 'users.email as referredEmail', 'users.businessName as referredBusiness')
            .where({ referralCodeId: codeId })
            .orderBy('referral_usage.createdAt', 'desc');
    },

    getReferralsByUserId: async (userId) => {
        const db = getAuthDb();
        return await db('referral_usage')
            .leftJoin('referral_codes', 'referral_usage.referralCodeId', 'referral_codes.id')
            .leftJoin('users', 'referral_usage.referredUserId', 'users.id')
            .select('referral_usage.*', 'referral_codes.code', 'users.fullName as referredName', 'users.email as referredEmail')
            .where({ referrerId: userId })
            .orderBy('referral_usage.createdAt', 'desc');
    },

    validateForRegistration: async (code) => {
        const db = getAuthDb();
        const referral = await db('referral_codes')
            .leftJoin('users', 'referral_codes.userId', 'users.id')
            .select('referral_codes.*', 'users.fullName as referrerName', 'users.email as referrerEmail')
            .where('referral_codes.code', code)
            .where('referral_codes.isActive', true).first();
        
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
