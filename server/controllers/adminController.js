import { getDb } from '../config/db.js';
import ApiKey from '../models/ApiKey.js';
import Transaction from '../models/Transaction.js';
import SupportedCurrency from '../models/SupportedCurrency.js';
import ReferralCode from '../models/ReferralCode.js';

export const getPlatformStats = async (req, res) => {
    try {
        const db = getDb();

        const totalVolume = await db.get(`SELECT SUM(amount) as total FROM transactions WHERE status = 'Completed'`);
        const totalRevenue = await db.get(`SELECT SUM(fee) as total FROM transactions WHERE status = 'Completed'`);
        const activeSellers = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'seller'`);
        const totalLinks = await db.get(`SELECT COUNT(*) as count FROM payment_links`);
        const totalTransactions = await db.get(`SELECT COUNT(*) as count FROM transactions`);

        const companyStats = await Transaction.findAdminStats();

        res.json({
            volume: totalVolume?.total || 0,
            revenue: totalRevenue?.total || 0,
            sellers: activeSellers?.count || 0,
            links: totalLinks?.count || 0,
            transactions: totalTransactions?.count || 0,
            companyStats
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
        const { id } = req.params;

        // Simple safety check: don't delete yourself
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ message: "You cannot delete your own admin account." });
        }

        // Cleanup related data
        await db.run(`DELETE FROM api_keys WHERE userId = ?`, id);
        await db.run(`DELETE FROM payment_links WHERE userId = ?`, id);
        await db.run(`DELETE FROM transactions WHERE userId = ?`, id);
        await db.run(`DELETE FROM users WHERE id = ?`, id);

        res.json({ message: "User and all related data deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePlatformStatus = async (req, res) => {
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

export const updateApiKeyStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Active', 'Suspended'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        await ApiKey.updateStatus(req.params.id, status);
        res.json({ message: `API Key status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// System Settings
export const getSystemSettings = async (req, res) => {
    try {
        const db = getDb();
        const settings = await db.all("SELECT * FROM system_settings");
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSystemSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        const db = getDb();
        await db.run("UPDATE system_settings SET value = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?", [value, key], function(err) {
            if (err) throw err;
        });
        res.json({ message: "Setting updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Supported Currencies Management
export const getSupportedCurrencies = async (req, res) => {
    try {
        const currencies = await SupportedCurrency.findAll();
        res.json(currencies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createSupportedCurrency = async (req, res) => {
    try {
        const newCurrency = await SupportedCurrency.create(req.body);
        res.status(201).json(newCurrency);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSupportedCurrency = async (req, res) => {
    try {
        const updated = await SupportedCurrency.update(req.params.code, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteSupportedCurrency = async (req, res) => {
    try {
        await SupportedCurrency.delete(req.params.code);
        res.json({ message: "Currency deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Referral Codes Management
export const getReferralCodes = async (req, res) => {
    try {
        const codes = await ReferralCode.findAll();
        res.json(codes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createReferralCode = async (req, res) => {
    try {
        const { code, userId, discount, maxUses } = req.body;
        const newCode = await ReferralCode.create({ code, userId, discount, maxUses });
        res.status(201).json(newCode);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteReferralCode = async (req, res) => {
    try {
        await ReferralCode.delete(req.params.id);
        res.json({ message: "Referral code deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleReferralCodeStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        await ReferralCode.toggleActive(req.params.id, isActive);
        res.json({ message: `Referral code ${isActive ? 'activated' : 'deactivated'}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

