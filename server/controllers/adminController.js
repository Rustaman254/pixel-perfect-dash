import { getDb } from '../config/db.js';
import ApiKey from '../models/ApiKey.js';

export const getPlatformStats = async (req, res) => {
    try {
        const db = getDb();

        const totalRevenue = await db.get(`SELECT SUM(amount) as total FROM transactions WHERE status = 'Completed'`);
        const activeSellers = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'seller'`);
        const totalLinks = await db.get(`SELECT COUNT(*) as count FROM payment_links`);
        const totalTransactions = await db.get(`SELECT COUNT(*) as count FROM transactions`);

        res.json({
            revenue: totalRevenue?.total || 0,
            sellers: activeSellers?.count || 0,
            links: totalLinks?.count || 0,
            transactions: totalTransactions?.count || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const db = getDb();
        const users = await db.all(`SELECT id, email, fullName, role, businessName, isVerified, createdAt FROM users ORDER BY createdAt DESC`);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const db = getDb();
        // Simple safety check: don't delete yourself
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ message: "You cannot delete your own admin account." });
        }
        await db.run(`DELETE FROM users WHERE id = ?`, req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePlatformStatus = async (req, res) => {
    // For handling verification toggles etc
    try {
        const { isVerified } = req.body;
        const db = getDb();
        await db.run(`UPDATE users SET isVerified = ? WHERE id = ?`, [isVerified ? 1 : 0, req.params.id]);
        res.json({ message: "User status updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API Key Management
export const getApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.findAll();
        res.json(keys);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createApiKey = async (req, res) => {
    try {
        const { userId, name } = req.body;
        const newKey = await ApiKey.create(userId, name);
        res.status(201).json(newKey);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteApiKey = async (req, res) => {
    try {
        await ApiKey.delete(req.params.id);
        res.json({ message: "API Key deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
