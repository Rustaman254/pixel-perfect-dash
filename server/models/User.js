import { getDb } from '../config/db.js';

const ALLOWED_COLUMNS = [
    'id', 'email', 'password', 'role', 'fullName', 'phone', 'businessName',
    'idType', 'idNumber', 'location', 'payoutMethod', 'payoutDetails',
    'isVerified', 'isDisabled', 'isSuspended', 'accountStatus', 'suspendReason',
    'kycStatus', 'kybStatus', 'transactionLimit', 'referralPoints', 'createdAt', 'updatedAt'
];

const User = {
    create: async (userData) => {
        const db = getDb();
        const [result] = await db('users').insert({
            email: userData.email,
            password: userData.password,
            role: userData.role,
            fullName: userData.fullName,
            phone: userData.phone,
            businessName: userData.businessName,
            idType: userData.idType,
            idNumber: userData.idNumber,
            location: userData.location,
            payoutMethod: userData.payoutMethod,
            payoutDetails: userData.payoutDetails,
            kycStatus: userData.kycStatus || 'none',
            kybStatus: userData.kybStatus || 'none',
            transactionLimit: userData.transactionLimit || 5000,
            isVerified: userData.isVerified || false
        }).returning('*');

        return result;
    },

    findOne: async (query) => {
        const db = getDb();
        const keys = Object.keys(query);
        const values = Object.values(query);

        if (keys.length === 0) return null;

        const invalidKeys = keys.filter(k => !ALLOWED_COLUMNS.includes(k));
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid column(s) in query: ${invalidKeys.join(', ')}`);
        }

        let queryBuilder = db('users');
        keys.forEach((key, idx) => {
            queryBuilder = queryBuilder.where(key, values[idx]);
        });

        return await queryBuilder.first();
    },

    findById: async (id) => {
        const db = getDb();
        const user = await db('users').where({ id }).first();
        if (!user) return null;

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    update: async (id, userData) => {
        const db = getDb();
        const keys = Object.keys(userData);

        if (keys.length === 0) return null;

        const invalidKeys = keys.filter(k => !ALLOWED_COLUMNS.includes(k));
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid column(s) in update: ${invalidKeys.join(', ')}`);
        }

        await db('users').where({ id }).update(userData);
        return await User.findById(id);
    }
};

export default User;
