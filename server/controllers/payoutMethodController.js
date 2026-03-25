import { getDb } from '../config/db.js';

// Get all payout methods for current user
export const getPayoutMethods = async (req, res) => {
    try {
        const db = getDb();
        const methods = await db.all(
            `SELECT * FROM user_payout_methods WHERE userId = ? AND isActive = 1 ORDER BY isDefault DESC, createdAt ASC`,
            req.user.id
        );
        res.json(methods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new payout method
export const addPayoutMethod = async (req, res) => {
    try {
        const { method, label, details, isDefault } = req.body;
        const userId = req.user.id;
        const db = getDb();

        if (!method || !details) {
            return res.status(400).json({ message: "Method and details are required" });
        }

        if (!['mpesa', 'bank'].includes(method)) {
            return res.status(400).json({ message: "Only M-Pesa and Bank methods are supported" });
        }

        // Validate details format
        if (method === 'mpesa') {
            const phone = details.replace(/\D/g, '');
            if (phone.length < 9) return res.status(400).json({ message: "Invalid M-Pesa phone number" });
        } else if (method === 'bank') {
            try {
                const bankData = JSON.parse(details);
                if (!bankData.account || !bankData.bankCode) {
                    return res.status(400).json({ message: "Bank account and bank code are required" });
                }
            } catch (e) {
                return res.status(400).json({ message: "Bank details must be valid JSON with account and bankCode" });
            }
        }

        // Check for duplicates
        const existing = await db.get(
            `SELECT id FROM user_payout_methods WHERE userId = ? AND method = ? AND details = ? AND isActive = 1`,
            userId, method, details
        );
        if (existing) {
            return res.status(400).json({ message: "This payout method already exists" });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await db.run(`UPDATE user_payout_methods SET isDefault = 0 WHERE userId = ?`, userId);
        }

        const result = await db.run(
            `INSERT INTO user_payout_methods (userId, method, label, details, isDefault) VALUES (?, ?, ?, ?, ?)`,
            [userId, method, label || (method === 'mpesa' ? 'M-Pesa' : 'Bank Account'), details, isDefault ? 1 : 0]
        );

        const newMethod = await db.get(`SELECT * FROM user_payout_methods WHERE id = ?`, result.lastID);

        // Also update the legacy user fields if this is the default
        if (isDefault) {
            await db.run(`UPDATE users SET payoutMethod = ?, payoutDetails = ? WHERE id = ?`, [method, details, userId]);
        }

        res.status(201).json(newMethod);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a payout method
export const updatePayoutMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, details, isDefault } = req.body;
        const userId = req.user.id;
        const db = getDb();

        const existing = await db.get(`SELECT * FROM user_payout_methods WHERE id = ? AND userId = ?`, id, userId);
        if (!existing) return res.status(404).json({ message: "Payout method not found" });

        const updates = [];
        const values = [];

        if (label !== undefined) { updates.push('label = ?'); values.push(label); }
        if (details !== undefined) { updates.push('details = ?'); values.push(details); }
        if (isDefault !== undefined) {
            if (isDefault) {
                await db.run(`UPDATE user_payout_methods SET isDefault = 0 WHERE userId = ?`, userId);
            }
            updates.push('isDefault = ?'); values.push(isDefault ? 1 : 0);
        }

        if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });

        updates.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id, userId);

        await db.run(`UPDATE user_payout_methods SET ${updates.join(', ')} WHERE id = ? AND userId = ?`, values);

        const updated = await db.get(`SELECT * FROM user_payout_methods WHERE id = ?`, id);

        // Update legacy user fields if this is now the default
        if (isDefault) {
            await db.run(`UPDATE users SET payoutMethod = ?, payoutDetails = ? WHERE id = ?`, [updated.method, updated.details, userId]);
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a payout method (soft delete)
export const deletePayoutMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const db = getDb();

        const existing = await db.get(`SELECT * FROM user_payout_methods WHERE id = ? AND userId = ?`, id, userId);
        if (!existing) return res.status(404).json({ message: "Payout method not found" });

        await db.run(`UPDATE user_payout_methods SET isActive = 0 WHERE id = ? AND userId = ?`, id, userId);

        // If deleted was default, set another as default
        if (existing.isDefault) {
            const nextDefault = await db.get(
                `SELECT id FROM user_payout_methods WHERE userId = ? AND isActive = 1 ORDER BY createdAt ASC LIMIT 1`,
                userId
            );
            if (nextDefault) {
                await db.run(`UPDATE user_payout_methods SET isDefault = 1 WHERE id = ?`, nextDefault.id);
                const method = await db.get(`SELECT * FROM user_payout_methods WHERE id = ?`, nextDefault.id);
                await db.run(`UPDATE users SET payoutMethod = ?, payoutDetails = ? WHERE id = ?`, [method.method, method.details, userId]);
            }
        }

        res.json({ message: "Payout method removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
