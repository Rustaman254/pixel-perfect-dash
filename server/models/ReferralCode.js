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
        const codes = await db('referral_codes').orderBy('createdAt', 'desc');
        
        const result = await Promise.all(codes.map(async (code) => {
            const user = await db('users').where('id', code.userId).first();
            return {
                ...code,
                userEmail: user?.email || '',
                userFullName: user?.fullName || '',
                userBusiness: user?.businessName || ''
            };
        }));
        
        return result;
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
        const usage = await db('referral_usage').where({ referralCodeId: codeId }).orderBy('createdAt', 'desc');
        
        const result = await Promise.all(usage.map(async (u) => {
            const user = await db('users').where('id', u.referredUserId).first();
            return {
                ...u,
                referredName: user?.fullName || '',
                referredEmail: user?.email || '',
                referredBusiness: user?.businessName || ''
            };
        }));
        
        return result;
    },

    getReferralsByUserId: async (userId) => {
        const db = getAuthDb();
        const usage = await db('referral_usage').where({ referrerId: userId }).orderBy('createdAt', 'desc');
        
        const result = await Promise.all(usage.map(async (u) => {
            const user = await db('users').where('id', u.referredUserId).first();
            const code = await db('referral_codes').where('id', u.referralCodeId).first();
            return {
                ...u,
                code: code?.code || '',
                referredName: user?.fullName || '',
                referredEmail: user?.email || ''
            };
        }));
        
        return result;
    },

    validateForRegistration: async (code) => {
        const db = getAuthDb();
        const referral = await db('referral_codes').where('code', code).where('isActive', true).first();
        
        if (!referral) return { valid: false, message: "Invalid referral code" };
        
        const user = await db('users').where('id', referral.userId).first();
        const referralWithUser = {
            ...referral,
            referrerName: user?.fullName || '',
            referrerEmail: user?.email || ''
        };
        
        if (referral.maxUses > 0 && referral.currentUses >= referral.maxUses) {
            return { valid: false, message: "This referral code has reached its usage limit" };
        }
        if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
            return { valid: false, message: "This referral code has expired" };
        }
        return { valid: true, referral: referralWithUser };
    }
};

export default ReferralCode;
