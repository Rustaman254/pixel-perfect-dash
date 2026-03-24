import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';
import User from '../models/User.js';
import rbacService from '../utils/rbacService.js';
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
        const pendingTransactions = await db.get(`SELECT COUNT(*) as count FROM transactions WHERE status = 'Pending'`);
        const disputedTransactions = await db.get(`SELECT COUNT(*) as count FROM transactions WHERE status = 'Disputed'`);

        const companyStats = await Transaction.findAdminStats();

        // Monthly revenue for the past 12 months
        const monthlyRevenue = await db.all(`
            SELECT 
                strftime('%Y-%m', createdAt) as month,
                SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END) as revenue,
                COUNT(*) as transactionCount
            FROM transactions
            WHERE createdAt >= date('now', '-12 months')
            GROUP BY month
            ORDER BY month ASC
        `);

        // Recent transactions (last 10)
        const recentTransactions = await db.all(`
            SELECT t.*, u.businessName, u.fullName
            FROM transactions t
            LEFT JOIN users u ON t.userId = u.id
            ORDER BY t.createdAt DESC
            LIMIT 10
        `);

        // Active sellers with revenue
        const topSellers = await db.all(`
            SELECT u.id, u.businessName, u.fullName, u.email,
                SUM(CASE WHEN t.status = 'Completed' THEN t.amount ELSE 0 END) as totalRevenue,
                COUNT(t.id) as transactionCount
            FROM users u
            LEFT JOIN transactions t ON u.id = t.userId
            WHERE u.role = 'seller'
            GROUP BY u.id
            ORDER BY totalRevenue DESC
            LIMIT 5
        `);

        res.json({
            volume: totalVolume?.total || 0,
            revenue: totalRevenue?.total || 0,
            sellers: activeSellers?.count || 0,
            links: totalLinks?.count || 0,
            transactions: totalTransactions?.count || 0,
            pendingTransactions: pendingTransactions?.count || 0,
            disputedTransactions: disputedTransactions?.count || 0,
            companyStats,
            monthlyRevenue,
            recentTransactions,
            topSellers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCompanyStats = async (req, res) => {
    try {
        const db = getDb();
        const companyStats = await Transaction.findAdminStats();
        // Add percentage of total volume
        const totalVolume = companyStats.reduce((sum, company) => sum + (company.totalVolume || 0), 0);
        const companiesWithPercentage = companyStats.map(company => ({
            ...company,
            volumePercentage: totalVolume > 0 ? ((company.totalVolume || 0) / totalVolume * 100).toFixed(2) : 0
        }));

        // Merge with full user details
        const users = await db.all(`
            SELECT id, email, fullName, businessName, isVerified, isDisabled, kycStatus, kybStatus,
                   transactionLimit, location, phone, payoutMethod, createdAt
            FROM users WHERE businessName IS NOT NULL AND businessName != ''
        `);

        const enriched = users.map(user => {
            const stats = companiesWithPercentage.find(c => c.userId === user.id) || {};
            return {
                ...user,
                totalVolume: stats.totalVolume || 0,
                totalFees: stats.totalFees || 0,
                txCount: stats.txCount || 0,
                volumePercentage: stats.volumePercentage || 0
            };
        });

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const db = getDb();
        const users = await db.all(`
            SELECT u.id, u.email, u.fullName, u.role, u.phone, u.businessName, u.isVerified, u.isDisabled,
                   u.kycStatus, u.kybStatus, u.transactionLimit, u.location, u.payoutMethod, u.createdAt,
            GROUP_CONCAT(r.name) as rbacRoles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
            LEFT JOIN roles r ON ur.role_id = r.id AND r.is_deprecated = 0
            GROUP BY u.id
            ORDER BY u.createdAt DESC
        `);
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

export const createUser = async (req, res) => {
    try {
        const { email, password, fullName, role, businessName, roleId } = req.body;
        const db = getDb();

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            fullName: fullName || "",
            role: role || "seller", // Legacy role
            businessName: businessName || (fullName ? `${fullName}'s Store` : "New Store"),
            isVerified: 1
        });

        // Assign RBAC Role if provided
        if (roleId) {
            await rbacService.assignRoleToUser({
                userId: newUser.id,
                roleId: parseInt(roleId),
                scopeId: 'global',
                scopeType: 'platform',
                assignedBy: req.user.id
            });
        }

        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePlatformStatus = async (req, res) => {
    try {
        const { isVerified, isDisabled } = req.body;
        const db = getDb();
        const updates = [];
        const values = [];
        if (isVerified !== undefined) {
            updates.push('isVerified = ?');
            values.push(isVerified ? 1 : 0);
        }
        if (isDisabled !== undefined) {
            updates.push('isDisabled = ?');
            values.push(isDisabled ? 1 : 0);
        }
        if (updates.length === 0) {
            return res.status(400).json({ message: "No status fields provided" });
        }
        values.push(req.params.id);
        await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ message: "User status updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const db = getDb();
        const user = await db.get(`
            SELECT u.*, GROUP_CONCAT(r.name) as rbacRoles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
            LEFT JOIN roles r ON ur.role_id = r.id AND r.is_deprecated = 0
            WHERE u.id = ?
            GROUP BY u.id
        `, req.params.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        const { password, ...safeUser } = user;

        // Get user's transactions summary
        const txSummary = await db.get(`
            SELECT COUNT(*) as txCount, SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END) as totalVolume,
                   SUM(CASE WHEN status = 'Completed' THEN fee ELSE 0 END) as totalFees
            FROM transactions WHERE userId = ?
        `, req.params.id);

        // Get user's links count
        const linkCount = await db.get(`SELECT COUNT(*) as count FROM payment_links WHERE userId = ?`, req.params.id);

        // Get user's API keys
        const apiKeys = await db.all(`SELECT id, name, status, createdAt FROM api_keys WHERE userId = ?`, req.params.id);

        // Get user's active payouts
        const pendingPayouts = await db.get(`
            SELECT COUNT(*) as count FROM payouts WHERE userId = ? AND status = 'Processing'
        `, req.params.id);

        res.json({
            ...safeUser,
            stats: {
                transactionCount: txSummary?.txCount || 0,
                totalVolume: txSummary?.totalVolume || 0,
                totalFees: txSummary?.totalFees || 0,
                linkCount: linkCount?.count || 0,
                apiKeys,
                pendingPayouts: pendingPayouts?.count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { fullName, phone, businessName, location, payoutMethod, kycStatus, kybStatus, transactionLimit } = req.body;
        const db = getDb();

        const updates = [];
        const values = [];
        if (fullName !== undefined) { updates.push('fullName = ?'); values.push(fullName); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
        if (businessName !== undefined) { updates.push('businessName = ?'); values.push(businessName); }
        if (location !== undefined) { updates.push('location = ?'); values.push(location); }
        if (payoutMethod !== undefined) { updates.push('payoutMethod = ?'); values.push(payoutMethod); }
        if (kycStatus !== undefined) { updates.push('kycStatus = ?'); values.push(kycStatus); }
        if (kybStatus !== undefined) { updates.push('kybStatus = ?'); values.push(kybStatus); }
        if (transactionLimit !== undefined) { updates.push('transactionLimit = ?'); values.push(transactionLimit); }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        values.push(req.params.id);
        await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ message: "User updated successfully" });
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

// Feature Flags Management
export const getFeatureFlags = async (req, res) => {
    try {
        const db = getDb();
        const flags = await db.all(`SELECT * FROM feature_flags ORDER BY category, name`);
        res.json(flags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleFeatureFlag = async (req, res) => {
    try {
        const { isEnabled } = req.body;
        const db = getDb();
        await db.run(`UPDATE feature_flags SET isEnabled = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [isEnabled ? 1 : 0, req.params.id]);
        res.json({ message: `Feature ${isEnabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createFeatureFlag = async (req, res) => {
    try {
        const { key, name, description, category } = req.body;
        const db = getDb();
        const result = await db.run(
            `INSERT INTO feature_flags (key, name, description, category) VALUES (?, ?, ?, ?)`,
            [key, name, description || '', category || 'general']
        );
        const flag = await db.get(`SELECT * FROM feature_flags WHERE id = ?`, result.lastID);
        res.status(201).json(flag);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFeatureFlag = async (req, res) => {
    try {
        const db = getDb();
        await db.run(`DELETE FROM feature_flags WHERE id = ?`, req.params.id);
        res.json({ message: "Feature flag deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFeatureFlag = async (req, res) => {
    try {
        const { name, description, category, isEnabled } = req.body;
        const db = getDb();
        const updates = [];
        const values = [];
        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (isEnabled !== undefined) { updates.push('isEnabled = ?'); values.push(isEnabled ? 1 : 0); }
        if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });
        updates.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(req.params.id);
        await db.run(`UPDATE feature_flags SET ${updates.join(', ')} WHERE id = ?`, values);
        const flag = await db.get(`SELECT * FROM feature_flags WHERE id = ?`, req.params.id);
        res.json(flag);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get feature flags for current user (seller-facing)
export const getEnabledFeatures = async (req, res) => {
    try {
        const db = getDb();
        const flags = await db.all(`SELECT key, isEnabled FROM feature_flags`);
        res.json(flags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

