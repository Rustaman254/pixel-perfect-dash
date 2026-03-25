import { getDb } from '../config/db.js';

// Allowed columns for user table
const ALLOWED_COLUMNS = [
    'id', 'email', 'password', 'role', 'fullName', 'phone', 'businessName',
    'idType', 'idNumber', 'location', 'payoutMethod', 'payoutDetails',
    'isVerified', 'isDisabled', 'kycStatus', 'kybStatus', 'transactionLimit', 'createdAt', 'updatedAt'
];

// User Model Methods for SQLite
const User = {
    create: async (userData) => {
        const db = getDb();
        const result = await db.run(`
      INSERT INTO users (email, password, role, fullName, phone, businessName, idType, idNumber, location, payoutMethod, payoutDetails, kycStatus, kybStatus, transactionLimit, isVerified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            userData.email,
            userData.password,
            userData.role,
            userData.fullName,
            userData.phone,
            userData.businessName,
            userData.idType,
            userData.idNumber,
            userData.location,
            userData.payoutMethod,
            userData.payoutDetails,
            userData.kycStatus || 'none',
            userData.kybStatus || 'none',
            userData.transactionLimit || 5000,
            userData.isVerified ? 1 : 0
        ]);

        return await db.get(`SELECT * FROM users WHERE id = ?`, result.lastID);
    },

    findOne: async (query) => {
        const db = getDb();
        const keys = Object.keys(query);
        const values = Object.values(query);

        if (keys.length === 0) return null;

        // Validate keys against allowed columns
        const invalidKeys = keys.filter(k => !ALLOWED_COLUMNS.includes(k));
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid column(s) in query: ${invalidKeys.join(', ')}`);
        }

        const conditions = keys.map(k => `${k} = ?`).join(' AND ');
        return await db.get(`SELECT * FROM users WHERE ${conditions}`, values);
    },

    findById: async (id) => {
        const db = getDb();
        const user = await db.get(`SELECT * FROM users WHERE id = ?`, id);
        if (!user) return null;

        // Simulate mongoose select('-password') feature manually
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    update: async (id, userData) => {
        const db = getDb();
        const keys = Object.keys(userData);
        const values = Object.values(userData);

        if (keys.length === 0) return null;

        // Validate keys against allowed columns (excluding id)
        const invalidKeys = keys.filter(k => !ALLOWED_COLUMNS.includes(k));
        if (invalidKeys.length > 0) {
            throw new Error(`Invalid column(s) in update: ${invalidKeys.join(', ')}`);
        }

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        await db.run(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);

        return await User.findById(id);
    }
};

export default User;
