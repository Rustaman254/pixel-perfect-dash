import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';
import User from '../models/User.js';
import rbacService from '../utils/rbacService.js';
import ApiKey from '../models/ApiKey.js';
import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import SupportedCurrency from '../models/SupportedCurrency.js';
import ReferralCode from '../models/ReferralCode.js';
import Payout from '../models/Payout.js';

export const getPlatformRevenue = async () => {
    const db = getDb();
    const transactionRevenue = await db.get(`SELECT SUM(fee) as total FROM transactions WHERE status = 'Completed'`);
    const payoutRevenue = await db.get(`SELECT SUM(fee) as total FROM payouts WHERE status IN ('Processing', 'Completed')`);
    return (transactionRevenue?.total || 0) + (payoutRevenue?.total || 0);
};

export const getPlatformStats = async (req, res) => {
    try {
        const db = getDb();

        const totalVolume = await db.get(`SELECT SUM(amount) as total FROM transactions WHERE status = 'Completed'`);
        const totalRevenue = await getPlatformRevenue();
        const transactionRevenue = await db.get(`SELECT SUM(fee) as total FROM transactions WHERE status = 'Completed'`);
        const payoutRevenue = await db.get(`SELECT SUM(fee) as total FROM payouts WHERE status IN ('Processing', 'Completed')`);
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
            revenue: totalRevenue || 0,
            transactionRevenue: transactionRevenue?.total || 0,
            payoutRevenue: payoutRevenue?.total || 0,
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
            SELECT id, email, fullName, businessName, isVerified, isDisabled, isSuspended, accountStatus,
                   suspendReason, kycStatus, kybStatus,
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
                   u.isSuspended, u.accountStatus, u.suspendReason,
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

        // Safety checks
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ message: "You cannot delete your own admin account." });
        }

        // Prevent deleting other admins
        const targetUser = await db.get(`SELECT role FROM users WHERE id = ?`, id);
        if (targetUser?.role === 'admin') {
            return res.status(403).json({ message: "Cannot delete an admin account. Demote to seller first." });
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
        const { isVerified, isDisabled, isSuspended, accountStatus, suspendReason } = req.body;
        const db = getDb();
        const userId = req.params.id;

        // Get current user status to detect changes
        const currentUser = await db.get(`SELECT * FROM users WHERE id = ?`, userId);
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        // Prevent disabling/unverifying/suspending admins
        if (currentUser.role === 'admin') {
            if (isDisabled || accountStatus === 'disabled') {
                return res.status(403).json({ message: "Cannot disable an admin account." });
            }
            if (isSuspended || accountStatus === 'suspended') {
                return res.status(403).json({ message: "Cannot suspend an admin account." });
            }
            if (isVerified === false) {
                return res.status(403).json({ message: "Cannot unverify an admin account." });
            }
        }

        const updates = [];
        const values = [];
        if (isVerified !== undefined) {
            updates.push('isVerified = ?');
            values.push(isVerified ? 1 : 0);
        }
        if (isDisabled !== undefined) {
            updates.push('isDisabled = ?');
            values.push(isDisabled ? 1 : 0);
            if (isDisabled) {
                updates.push('accountStatus = ?');
                values.push('disabled');
            } else {
                updates.push('accountStatus = ?');
                values.push(isSuspended ? 'suspended' : 'active');
            }
        }
        if (isSuspended !== undefined) {
            updates.push('isSuspended = ?');
            values.push(isSuspended ? 1 : 0);
            if (isSuspended) {
                updates.push('accountStatus = ?');
                values.push('suspended');
            } else if (!isDisabled) {
                updates.push('accountStatus = ?');
                values.push('active');
            }
        }
        if (accountStatus !== undefined) {
            updates.push('accountStatus = ?');
            values.push(accountStatus);
            updates.push('isDisabled = ?');
            values.push(accountStatus === 'disabled' ? 1 : 0);
            updates.push('isSuspended = ?');
            values.push(accountStatus === 'suspended' ? 1 : 0);
        }
        if (suspendReason !== undefined) {
            updates.push('suspendReason = ?');
            values.push(suspendReason);
        }
        if (updates.length === 0) {
            return res.status(400).json({ message: "No status fields provided" });
        }
        values.push(userId);
        await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        // Send notifications based on what changed
        try {
            const notifUserId = parseInt(userId);

            if (isDisabled !== undefined) {
                if (isDisabled && !currentUser.isDisabled) {
                    await Notification.create({
                        userId: notifUserId,
                        title: "Account Disabled",
                        message: "Your account has been disabled by the administrator. You cannot perform any actions. Contact support to appeal.",
                        type: 'alert',
                        actionUrl: '/help-center',
                        actionLabel: 'Contact Support'
                    });
                } else if (!isDisabled && currentUser.isDisabled) {
                    await Notification.create({
                        userId: notifUserId,
                        title: "Account Re-enabled",
                        message: "Your account has been re-enabled by the administrator. You now have full access.",
                        type: 'success'
                    });
                }
            }

            if (isSuspended !== undefined) {
                if (isSuspended && !currentUser.isSuspended) {
                    await Notification.create({
                        userId: notifUserId,
                        title: "Account Suspended",
                        message: `Your account has been suspended.${suspendReason ? ` Reason: ${suspendReason}` : ''} Contact support to resolve.`,
                        type: 'warning',
                        actionUrl: '/help-center',
                        actionLabel: 'Contact Support'
                    });
                } else if (!isSuspended && currentUser.isSuspended) {
                    await Notification.create({
                        userId: notifUserId,
                        title: "Suspension Lifted",
                        message: "Your account suspension has been lifted. You can now resume normal activity.",
                        type: 'success'
                    });
                }
            }

            if (isVerified !== undefined) {
                if (!isVerified && currentUser.isVerified) {
                    await Notification.create({
                        userId: notifUserId,
                        title: "Verification Removed",
                        message: `Your account verification has been removed. Transaction limit is now KES ${(currentUser.transactionLimit || 1000).toLocaleString()}. Complete KYC in Settings to restore full access.`,
                        type: 'warning',
                        actionUrl: '/settings',
                        actionLabel: 'Verify Now'
                    });
                } else if (isVerified && !currentUser.isVerified) {
                    await Notification.create({
                        userId: notifUserId,
                        title: "Account Verified",
                        message: "Congratulations! Your account has been verified. You now have full transaction access.",
                        type: 'success'
                    });
                }
            }
        } catch (notifErr) {
            console.error('Failed to send status notification:', notifErr.message);
        }

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
        const { code, userId, discount, maxUses, pointsPerReferral } = req.body;
        if (!code) return res.status(400).json({ message: "Code is required" });

        const newCode = await ReferralCode.create({
            code: code.toUpperCase(),
            userId: userId || null,
            discount: discount || 0,
            maxUses: maxUses ?? -1,
            pointsPerReferral: pointsPerReferral ?? 10
        });
        res.status(201).json(newCode);
    } catch (error) {
        if (error.message?.includes('UNIQUE')) {
            return res.status(400).json({ message: "This referral code already exists" });
        }
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

// Get usage details for a specific referral code
export const getReferralCodeUsage = async (req, res) => {
    try {
        const db = getDb();
        const codeId = req.params.id;
        const code = await ReferralCode.findById(codeId);
        if (!code) return res.status(404).json({ message: "Referral code not found" });

        const usage = await ReferralCode.getUsageByCodeId(codeId);
        const referrer = code.userId ? await db.get(`SELECT id, fullName, email, businessName, referralPoints FROM users WHERE id = ?`, code.userId) : null;

        res.json({ code, usage, referrer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Validate referral code (public endpoint for registration)
export const validateReferralCode = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ message: "Code is required" });

        const result = await ReferralCode.validateForRegistration(code);
        if (!result.valid) return res.status(400).json({ message: result.message });

        res.json({
            valid: true,
            code: result.referral.code,
            discount: result.referral.discount,
            referrerName: result.referral.referrerName || 'Ripplify',
            pointsPerReferral: result.referral.pointsPerReferral
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllPayouts = async (req, res) => {
    try {
        const payouts = await Payout.findAll();
        res.json(payouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePayoutStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const payout = await Payout.updateStatus(req.params.id, status);
        res.json(payout);
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

// Get feature flags for current user (seller-facing) - includes per-user overrides
export const getEnabledFeatures = async (req, res) => {
    try {
        const db = getDb();
        const globalFlags = await db.all(`SELECT key, isEnabled FROM feature_flags`);

        if (req.user?.id && req.user.role !== 'admin') {
            // Check per-user overrides
            const overrides = await db.all(`SELECT featureKey, isEnabled FROM user_feature_overrides WHERE userId = ?`, req.user.id);
            const overrideMap = {};
            overrides.forEach(o => { overrideMap[o.featureKey] = o.isEnabled; });

            // Merge: user override takes priority over global
            const merged = globalFlags.map(f => ({
                key: f.key,
                isEnabled: overrideMap[f.key] !== undefined ? overrideMap[f.key] : f.isEnabled
            }));
            return res.json(merged);
        }

        res.json(globalFlags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== ADMIN TRANSACTIONS ====================

// Get all transactions across the platform, categorized
export const getAllTransactions = async (req, res) => {
    try {
        const db = getDb();
        const { category, status, search, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Payments (from transactions table)
        let paymentsQuery = `
            SELECT t.id, t.transactionId, t.amount, t.fee, t.currency, t.status, t.type,
                   t.buyerName, t.buyerEmail, t.buyerPhone, t.createdAt,
                   'payment' as category, u.fullName as sellerName, u.businessName,
                   p.name as linkName
            FROM transactions t
            LEFT JOIN users u ON t.userId = u.id
            LEFT JOIN payment_links p ON t.linkId = p.id
        `;

        // Payouts
        let payoutsQuery = `
            SELECT p.id, ('PO-' || p.id) as transactionId, p.amount, p.fee, p.currency, p.status,
                   p.method as type, '' as buyerName, u.email as buyerEmail, '' as buyerPhone,
                   p.createdAt, 'payout' as category, u.fullName as sellerName, u.businessName,
                   p.details as linkName
            FROM payouts p
            LEFT JOIN users u ON p.userId = u.id
        `;

        // Transfers
        let transfersQuery = `
            SELECT t.id, ('TR-' || t.id) as transactionId, t.amount, t.fee, t.currency, t.status,
                   t.method as type, t.receiverPhone as buyerName, u.email as buyerEmail,
                   t.receiverEmail as buyerPhone, t.createdAt, 'transfer' as category,
                   u.fullName as sellerName, u.businessName, t.note as linkName
            FROM transfers t
            LEFT JOIN users u ON t.senderId = u.id
        `;

        const conditions = [];
        const params = [];

        if (status) {
            conditions.push(`status = ?`);
            params.push(status);
        }

        if (search) {
            conditions.push(`(buyerName LIKE ? OR buyerEmail LIKE ? OR transactionId LIKE ? OR sellerName LIKE ? OR businessName LIKE ?)`);
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
        }

        const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

        let finalQuery;
        let countQuery;

        if (category === 'payment') {
            finalQuery = paymentsQuery + whereClause + ` ORDER BY t.createdAt DESC LIMIT ? OFFSET ?`;
            countQuery = `SELECT COUNT(*) as total FROM transactions t LEFT JOIN users u ON t.userId = u.id LEFT JOIN payment_links p ON t.linkId = p.id` + whereClause;
        } else if (category === 'payout') {
            finalQuery = payoutsQuery + whereClause + ` ORDER BY p.createdAt DESC LIMIT ? OFFSET ?`;
            countQuery = `SELECT COUNT(*) as total FROM payouts p LEFT JOIN users u ON p.userId = u.id` + whereClause;
        } else if (category === 'transfer') {
            finalQuery = transfersQuery + whereClause + ` ORDER BY t.createdAt DESC LIMIT ? OFFSET ?`;
            countQuery = `SELECT COUNT(*) as total FROM transfers t LEFT JOIN users u ON t.senderId = u.id` + whereClause;
        } else {
            // All - combine all three
            finalQuery = `
                SELECT * FROM (
                    ${paymentsQuery}
                    UNION ALL
                    ${payoutsQuery}
                    UNION ALL
                    ${transfersQuery}
                ) AS combined
                ${whereClause ? whereClause.replace('WHERE', 'WHERE') : ''}
                ORDER BY createdAt DESC
                LIMIT ? OFFSET ?
            `;
            countQuery = `
                SELECT SUM(c) as total FROM (
                    SELECT COUNT(*) as c FROM transactions t LEFT JOIN users u ON t.userId = u.id ${conditions.length > 0 ? 'WHERE ' + conditions.map(c => c.replace('buyerName', 't.buyerName').replace('buyerEmail', 't.buyerEmail').replace('sellerName', 'u.fullName').replace('businessName', 'u.businessName')).join(' AND ') : ''}
                    UNION ALL
                    SELECT COUNT(*) as c FROM payouts p LEFT JOIN users u ON p.userId = u.id ${conditions.length > 0 ? 'WHERE ' + conditions.map(c => c.replace('buyerName', '').replace('buyerEmail', 'u.email').replace('sellerName', 'u.fullName').replace('businessName', 'u.businessName')).filter(c => c).join(' AND ') : ''}
                    UNION ALL
                    SELECT COUNT(*) as c FROM transfers t LEFT JOIN users u ON t.senderId = u.id ${conditions.length > 0 ? 'WHERE ' + conditions.map(c => c.replace('buyerName', 't.receiverPhone').replace('buyerEmail', 'u.email').replace('sellerName', 'u.fullName').replace('businessName', 'u.businessName')).filter(c => c).join(' AND ') : ''}
                )
            `;
        }

        const transactions = await db.all(finalQuery, [...params, parseInt(limit), offset]);

        // Get category counts
        const paymentCount = await db.get(`SELECT COUNT(*) as count FROM transactions`);
        const payoutCount = await db.get(`SELECT COUNT(*) as count FROM payouts`);
        const transferCount = await db.get(`SELECT COUNT(*) as count FROM transfers`);

        // Get status counts
        const completedCount = await db.get(`SELECT COUNT(*) as count FROM transactions WHERE status IN ('Completed', 'Funds locked')`);
        const pendingCount = await db.get(`SELECT COUNT(*) as count FROM transactions WHERE status = 'Pending'`);
        const disputedCount = await db.get(`SELECT COUNT(*) as count FROM transactions WHERE status = 'Disputed'`);

        res.json({
            transactions,
            categories: {
                payments: paymentCount?.count || 0,
                payouts: payoutCount?.count || 0,
                transfers: transferCount?.count || 0,
                total: (paymentCount?.count || 0) + (payoutCount?.count || 0) + (transferCount?.count || 0)
            },
            statuses: {
                completed: completedCount?.count || 0,
                pending: pendingCount?.count || 0,
                disputed: disputedCount?.count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== PER-USER FEATURE OVERRIDES ====================

// Get feature overrides for a specific user
export const getUserFeatureOverrides = async (req, res) => {
    try {
        const db = getDb();
        const { userId } = req.params;

        // Get all global feature flags
        const globalFlags = await db.all(`SELECT * FROM feature_flags ORDER BY category, name`);

        // Get user-specific overrides
        const overrides = await db.all(`SELECT * FROM user_feature_overrides WHERE userId = ?`, userId);
        const overrideMap = {};
        overrides.forEach(o => { overrideMap[o.featureKey] = o; });

        // Merge: global flag + user override
        const merged = globalFlags.map(flag => ({
            ...flag,
            userOverride: overrideMap[flag.key] || null,
            effectiveIsEnabled: overrideMap[flag.key] ? !!overrideMap[flag.key].isEnabled : !!flag.isEnabled,
            overrideReason: overrideMap[flag.key]?.reason || ''
        }));

        res.json(merged);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Set a feature override for a specific user
export const setUserFeatureOverride = async (req, res) => {
    try {
        const db = getDb();
        const { userId } = req.params;
        const { featureKey, isEnabled, reason } = req.body;

        if (!featureKey) return res.status(400).json({ message: "featureKey is required" });

        // Check if override exists
        const existing = await db.get(
            `SELECT * FROM user_feature_overrides WHERE userId = ? AND featureKey = ?`,
            userId, featureKey
        );

        if (existing) {
            await db.run(
                `UPDATE user_feature_overrides SET isEnabled = ?, reason = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND featureKey = ?`,
                isEnabled ? 1 : 0, reason || '', userId, featureKey
            );
        } else {
            await db.run(
                `INSERT INTO user_feature_overrides (userId, featureKey, isEnabled, reason) VALUES (?, ?, ?, ?)`,
                userId, featureKey, isEnabled ? 1 : 0, reason || ''
            );
        }

        // Notify user about the feature change
        const user = await db.get(`SELECT * FROM users WHERE id = ?`, userId);
        const flag = await db.get(`SELECT name FROM feature_flags WHERE key = ?`, featureKey);
        if (user) {
            const flagName = flag?.name || featureKey;
            await Notification.create({
                userId: parseInt(userId),
                title: isEnabled ? "Feature Enabled" : "Feature Disabled",
                message: isEnabled
                    ? `The "${flagName}" feature has been enabled for your account.`
                    : `The "${flagName}" feature has been disabled for your account.${reason ? ` Reason: ${reason}` : ''}`,
                type: isEnabled ? 'success' : 'warning',
                actionUrl: '/help-center',
                actionLabel: 'Contact Support'
            });
        }

        res.json({ message: `Feature ${featureKey} ${isEnabled ? 'enabled' : 'disabled'} for user ${userId}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove a feature override for a user (reverts to global setting)
export const removeUserFeatureOverride = async (req, res) => {
    try {
        const db = getDb();
        const { userId, featureKey } = req.params;
        await db.run(`DELETE FROM user_feature_overrides WHERE userId = ? AND featureKey = ?`, userId, featureKey);
        res.json({ message: `Override removed. User ${userId} now uses global setting for ${featureKey}.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== ANALYTICS ====================

export const getAnalytics = async (req, res) => {
    try {
        const db = getDb();
        const { period = '30d' } = req.query;

        let dateFilter;
        switch (period) {
            case '7d': dateFilter = "date('now', '-7 days')"; break;
            case '30d': dateFilter = "date('now', '-30 days')"; break;
            case '90d': dateFilter = "date('now', '-90 days')"; break;
            case '1y': dateFilter = "date('now', '-1 year')"; break;
            default: dateFilter = "date('now', '-30 days')";
        }

        // Revenue trend
        const revenueTrend = await db.all(`
            SELECT 
                strftime('%Y-%m-%d', createdAt) as date,
                SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END) as revenue,
                SUM(CASE WHEN status = 'Completed' THEN fee ELSE 0 END) as fees,
                COUNT(*) as count
            FROM transactions
            WHERE createdAt >= ${dateFilter}
            GROUP BY date ORDER BY date ASC
        `);

        // Transaction volume
        const volumeTrend = await db.all(`
            SELECT 
                strftime('%Y-%m-%d', createdAt) as date,
                SUM(amount) as volume, COUNT(*) as transactionCount
            FROM transactions
            WHERE createdAt >= ${dateFilter}
            GROUP BY date ORDER BY date ASC
        `);

        // Status breakdown
        const statusBreakdown = await db.all(`
            SELECT status, COUNT(*) as count, SUM(amount) as total
            FROM transactions WHERE createdAt >= ${dateFilter}
            GROUP BY status
        `);

        // User growth
        const userGrowth = await db.all(`
            SELECT 
                strftime('%Y-%m-%d', createdAt) as date,
                COUNT(*) as newUsers,
                SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as newSellers
            FROM users WHERE createdAt >= ${dateFilter} AND role != 'admin'
            GROUP BY date ORDER BY date ASC
        `);

        const totalUsers = await db.get(`SELECT COUNT(*) as count FROM users WHERE role != 'admin'`);
        const verifiedUsers = await db.get(`SELECT COUNT(*) as count FROM users WHERE isVerified = 1 AND role != 'admin'`);
        const disabledUsers = await db.get(`SELECT COUNT(*) as count FROM users WHERE isDisabled = 1`);
        const suspendedUsers = await db.get(`SELECT COUNT(*) as count FROM users WHERE isSuspended = 1`);

        // Payment method breakdown
        const paymentBreakdown = await db.all(`
            SELECT currency as name, COUNT(*) as count, SUM(amount) as total
            FROM transactions
            WHERE createdAt >= ${dateFilter} AND status = 'Completed'
            GROUP BY currency
        `);

        // Payout trend
        const payoutTrend = await db.all(`
            SELECT 
                strftime('%Y-%m-%d', createdAt) as date,
                SUM(amount) as totalPayouts, COUNT(*) as payoutCount
            FROM payouts WHERE createdAt >= ${dateFilter}
            GROUP BY date ORDER BY date ASC
        `);

        // Transfer trend
        const transferTrend = await db.all(`
            SELECT 
                strftime('%Y-%m-%d', createdAt) as date,
                SUM(amount) as totalTransfers, COUNT(*) as transferCount
            FROM transfers WHERE createdAt >= ${dateFilter}
            GROUP BY date ORDER BY date ASC
        `);

        // Top sellers
        const topSellers = await db.all(`
            SELECT u.id, u.businessName, u.fullName, u.email,
                SUM(CASE WHEN t.status = 'Completed' THEN t.amount ELSE 0 END) as totalRevenue,
                COUNT(t.id) as transactionCount
            FROM users u
            LEFT JOIN transactions t ON u.id = t.userId
            WHERE u.role = 'seller' AND (t.createdAt >= ${dateFilter} OR t.id IS NULL)
            GROUP BY u.id HAVING totalRevenue > 0
            ORDER BY totalRevenue DESC LIMIT 10
        `);

        // Month comparison
        const thisMonth = await db.get(`
            SELECT SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END) as revenue, COUNT(*) as transactions
            FROM transactions WHERE createdAt >= date('now', 'start of month')
        `);
        const lastMonth = await db.get(`
            SELECT SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END) as revenue, COUNT(*) as transactions
            FROM transactions
            WHERE createdAt >= date('now', 'start of month', '-1 month') AND createdAt < date('now', 'start of month')
        `);

        res.json({
            revenueTrend, volumeTrend, statusBreakdown, userGrowth,
            userStats: { total: totalUsers?.count||0, verified: verifiedUsers?.count||0, disabled: disabledUsers?.count||0, suspended: suspendedUsers?.count||0 },
            paymentBreakdown, payoutTrend, transferTrend, topSellers,
            comparison: {
                thisMonth: { revenue: thisMonth?.revenue||0, transactions: thisMonth?.transactions||0 },
                lastMonth: { revenue: lastMonth?.revenue||0, transactions: lastMonth?.transactions||0 },
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== FEE TIERS ====================

export const getFeeTiers = async (req, res) => {
    try {
        const db = getDb();
        const tiers = await db.all(`SELECT * FROM fee_tiers ORDER BY minAmount ASC`);
        const flatFee = await db.get(`SELECT value FROM system_settings WHERE key = 'platform_fee'`);
        const feeMode = await db.get(`SELECT value FROM system_settings WHERE key = 'fee_mode'`);
        const minWithdrawal = await db.get(`SELECT value FROM system_settings WHERE key = 'min_withdrawal'`);
        const escrowDays = await db.get(`SELECT value FROM system_settings WHERE key = 'escrow_days'`);

        res.json({
            mode: feeMode?.value || 'flat',
            flatFee: flatFee?.value || '1',
            minWithdrawal: minWithdrawal?.value || '500',
            escrowDays: escrowDays?.value || '3',
            tiers: tiers.length > 0 ? tiers : [
                { id: null, minAmount: 0, maxAmount: 1000, feePercent: 1.5, label: 'Small Transactions' },
                { id: null, minAmount: 1001, maxAmount: 10000, feePercent: 1.0, label: 'Medium Transactions' },
                { id: null, minAmount: 10001, maxAmount: 999999999, feePercent: 0.5, label: 'Large Transactions' },
            ]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFeeTiers = async (req, res) => {
    try {
        const db = getDb();
        const { mode, flatFee, minWithdrawal, escrowDays, tiers } = req.body;

        const upsertSetting = async (key, value) => {
            await db.run(`
                INSERT INTO system_settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = CURRENT_TIMESTAMP
            `, [key, value, value]);
        };

        if (mode) await upsertSetting('fee_mode', mode);
        if (flatFee !== undefined) await upsertSetting('platform_fee', flatFee.toString());
        if (minWithdrawal !== undefined) await upsertSetting('min_withdrawal', minWithdrawal.toString());
        if (escrowDays !== undefined) await upsertSetting('escrow_days', escrowDays.toString());

        if (tiers && Array.isArray(tiers)) {
            await db.run(`DELETE FROM fee_tiers`);
            for (const tier of tiers) {
                await db.run(
                    `INSERT INTO fee_tiers (minAmount, maxAmount, feePercent, label) VALUES (?, ?, ?, ?)`,
                    [tier.minAmount, tier.maxAmount, tier.feePercent, tier.label || '']
                );
            }
        }

        res.json({ message: "Fee configuration updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPublicFees = async (req, res) => {
    try {
        const db = getDb();
        const feeMode = await db.get(`SELECT value FROM system_settings WHERE key = 'fee_mode'`);
        const flatFee = await db.get(`SELECT value FROM system_settings WHERE key = 'platform_fee'`);
        const tiers = await db.all(`SELECT * FROM fee_tiers ORDER BY minAmount ASC`);

        res.json({
            mode: feeMode?.value || 'flat',
            flatFee: parseFloat(flatFee?.value || '1'),
            tiers: tiers.length > 0 ? tiers : [
                { minAmount: 0, maxAmount: 1000, feePercent: 1.5 },
                { minAmount: 1001, maxAmount: 10000, feePercent: 1.0 },
                { minAmount: 10001, maxAmount: 999999999, feePercent: 0.5 },
            ]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

