import { getDb } from '../config/db.js';

// User Model Methods for SQLite
const User = {
    create: async (userData) => {
        const db = getDb();
        const result = await db.run(`
      INSERT INTO users (email, password, role, fullName, phone, businessName, idType, idNumber, location, payoutMethod, payoutDetails, isVerified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            userData.isVerified ? 1 : 0
        ]);

        return await db.get(`SELECT * FROM users WHERE id = ?`, result.lastID);
    },

    findOne: async (query) => {
        const db = getDb();
        const keys = Object.keys(query);
        const values = Object.values(query);

        if (keys.length === 0) return null;

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
    }
};

export default User;
