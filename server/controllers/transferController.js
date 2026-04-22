import { getDb } from '../config/db.js';
import getPaymentProvider from '../utils/paymentProviderFactory.js';
import Notification from '../models/Notification.js';
import smsService from '../services/smsService.js';

const provider = getPaymentProvider();

const normalizePhone = (phone) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0') && p.length === 10) p = '254' + p.slice(1);
    else if (p.length === 9) p = '254' + p;
    return p;
};

// Calculate available balance for a user
const getAvailableBalance = async (db, userId) => {
    // Total earned from completed payment links
    const links = await db.all(`SELECT totalEarnedValue FROM payment_links WHERE userId = ?`, userId);
    const totalEarned = links.reduce((acc, l) => acc + (l.totalEarnedValue || 0), 0);

    // Total spent on transfers (processing + completed)
    const transfers = await db.get(
        `SELECT SUM(amount + fee) as total FROM transfers WHERE senderId = ? AND status IN ('Processing', 'Completed')`,
        userId
    );

    // Total spent on payouts (processing + completed)
    const payouts = await db.get(
        `SELECT SUM(amount + fee) as total FROM payouts WHERE userId = ? AND status IN ('Processing', 'Completed')`,
        userId
    );

    const totalUsed = (transfers?.total || 0) + (payouts?.total || 0);
    return totalEarned - totalUsed;
};

// Send money to a single recipient
export const sendTransfer = async (req, res) => {
    try {
        const { receiverId, receiverPhone, receiverEmail, amount, currency, method, note } = req.body;
        const senderId = req.user.id;
        const db = getDb();

        const numericAmount = parseFloat(amount);
        if (numericAmount <= 0) return res.status(400).json({ message: "Invalid amount" });
        if (!method) return res.status(400).json({ message: "Payment method is required" });

        // Validate sender
        const sender = await db.get(`SELECT * FROM users WHERE id = ?`, senderId);
        if (!sender) return res.status(404).json({ message: "Sender not found" });

        // Calculate fee based on method
        let fee = 0;
        if (method === 'mpesa') fee = numericAmount * 0.01;
        else if (method === 'bank') fee = numericAmount * 0.005;
        // internal = no fee

        const totalDeduct = numericAmount + fee;

        // Check balance
        const available = await getAvailableBalance(db, senderId);
        if (totalDeduct > available) {
            return res.status(400).json({ message: `Insufficient balance. Available: KES ${available.toLocaleString()}` });
        }

        let receiver = null;
        let receiverPhoneNorm = '';
        let externalRef = null;
        let transferStatus = 'Completed';

        if (method === 'internal') {
            // Internal transfer to another Ripplify user via IntaSend internal transfer
            if (!receiverId) return res.status(400).json({ message: "Receiver ID required for internal transfer" });
            receiver = await db.get(`SELECT * FROM users WHERE id = ?`, receiverId);
            if (!receiver) return res.status(404).json({ message: "Receiver not found" });
            if (receiver.id === senderId) return res.status(400).json({ message: "Cannot transfer to yourself" });

            // Use IntaSend internal transfer for real money movement
            try {
                const response = await provider.intasendTransfer({
                    name: receiver.fullName || receiver.businessName || 'Ripplify User',
                    amount: numericAmount,
                    narrative: note || `Transfer to ${receiver.fullName || receiver.email}`
                });
                externalRef = response?.tracking_id || response?.invoice?.invoice_id || null;
                transferStatus = 'Processing';
            } catch (apiError) {
                return res.status(500).json({ message: `Transfer failed: ${apiError.message}` });
            }

        } else if (method === 'mpesa') {
            // M-Pesa B2C transfer via IntaSend
            const phone = normalizePhone(receiverPhone);
            if (!phone || phone.length < 12) {
                return res.status(400).json({ message: "Valid Kenyan phone number required (e.g., 07xxxxxxxx)" });
            }
            receiverPhoneNorm = phone;

            try {
                const response = await provider.mpesaB2c({
                    name: sender.fullName || 'Ripplify User',
                    account: phone,
                    amount: numericAmount,
                    narrative: note || 'Ripplify M-Pesa Transfer'
                });
                externalRef = response?.tracking_id || response?.id || null;
                transferStatus = 'Processing';
            } catch (apiError) {
                return res.status(500).json({ message: `M-Pesa transfer failed: ${apiError.message}` });
            }

        } else if (method === 'bank') {
            // Bank transfer via IntaSend PesaLink
            if (!receiverId) return res.status(400).json({ message: "Receiver ID required for bank transfer" });

            // Get receiver's default bank payout method
            const receiverPayout = await db.get(
                `SELECT * FROM user_payout_methods WHERE userId = ? AND method = 'bank' AND isActive = 1 ORDER BY isDefault DESC LIMIT 1`,
                receiverId
            );
            if (!receiverPayout) {
                return res.status(400).json({ message: "Receiver has no bank payout method configured" });
            }

            let bankDetails;
            try { bankDetails = JSON.parse(receiverPayout.details); } catch (e) {
                return res.status(400).json({ message: "Receiver's bank details are invalid" });
            }
            if (!bankDetails.account || !bankDetails.bankCode) {
                return res.status(400).json({ message: "Receiver's bank details are incomplete" });
            }

            receiver = await db.get(`SELECT * FROM users WHERE id = ?`, receiverId);
            receiverPhoneNorm = bankDetails.account;

            try {
                const response = await provider.bankPayout({
                    name: receiver?.fullName || 'Ripplify User',
                    account: bankDetails.account,
                    bankCode: bankDetails.bankCode,
                    amount: numericAmount,
                    narrative: note || 'Ripplify Bank Transfer'
                });
                externalRef = response?.tracking_id || null;
                transferStatus = 'Processing';
            } catch (apiError) {
                return res.status(500).json({ message: `Bank transfer failed: ${apiError.message}` });
            }

        } else {
            return res.status(400).json({ message: `Unsupported transfer method: ${method}` });
        }

        // Create transfer record
        const result = await db.run(
            `INSERT INTO transfers (senderId, receiverId, receiverPhone, receiverEmail, amount, fee, currency, method, status, note, externalRef)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [senderId, receiver?.id || null, receiverPhoneNorm || receiverPhone || '', receiverEmail || null,
             numericAmount, fee, currency || 'KES', method, transferStatus, note || '', externalRef]
        );

        const transfer = {
            id: result.lastID, senderId, receiverId: receiver?.id,
            receiverPhone: receiverPhoneNorm || receiverPhone,
            amount: numericAmount, fee, method, status: transferStatus
        };

        // SMS notifications
        try {
            await smsService.sendTransferSentSMS(sender.phone, transfer);
        } catch (e) { console.error('SMS error:', e.message); }

        if (method === 'internal' && receiver?.phone) {
            try {
                await smsService.sendTransferReceivedSMS(receiver.phone, transfer);
            } catch (e) { console.error('SMS error:', e.message); }
        }

        // In-app notification to receiver
        if (receiver) {
            await Notification.create({
                userId: receiver.id,
                title: "Money Received",
                message: `You received KES ${numericAmount.toLocaleString()} from ${sender.fullName || sender.businessName}`,
                type: 'success',
                actionUrl: '/payouts',
                actionLabel: 'View Payouts'
            });
        }

        res.status(201).json({
            message: transferStatus === 'Processing'
                ? "Transfer initiated. Processing via IntaSend."
                : "Transfer successful",
            transfer
        });
    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Batch transfer to multiple recipients via M-Pesa
export const sendBatchTransfer = async (req, res) => {
    try {
        const { recipients, currency, method, note } = req.body;
        const senderId = req.user.id;
        const db = getDb();

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ message: "Recipients array is required" });
        }
        if (recipients.length > 50) {
            return res.status(400).json({ message: "Maximum 50 recipients per batch" });
        }

        // Validate sender
        const sender = await db.get(`SELECT * FROM users WHERE id = ?`, senderId);
        if (!sender) return res.status(404).json({ message: "Sender not found" });

        // Calculate total amount + fees
        let totalAmount = 0;
        let totalFees = 0;
        for (const r of recipients) {
            const amt = parseFloat(r.amount);
            if (amt <= 0) return res.status(400).json({ message: "Invalid amount for a recipient" });
            totalAmount += amt;
            if (method === 'mpesa') totalFees += amt * 0.01;
            else if (method === 'bank') totalFees += amt * 0.005;
        }

        const totalDeduct = totalAmount + totalFees;

        // Check balance
        const available = await getAvailableBalance(db, senderId);
        if (totalDeduct > available) {
            return res.status(400).json({
                message: `Insufficient balance. Available: KES ${available.toLocaleString()}, Required: KES ${totalDeduct.toLocaleString()}`
            });
        }

        const results = [];

        for (let i = 0; i < recipients.length; i++) {
            const r = recipients[i];
            try {
                const amt = parseFloat(r.amount);
                let fee = method === 'mpesa' ? amt * 0.01 : (method === 'bank' ? amt * 0.005 : 0);
                let receiver = null;
                let receiverPhoneNorm = '';
                let externalRef = null;

                if (method === 'mpesa') {
                    const phone = normalizePhone(r.phone);
                    if (!phone || phone.length < 12) {
                        results.push({ index: i, phone: r.phone, status: 'Failed', error: 'Invalid phone number' });
                        continue;
                    }
                    receiverPhoneNorm = phone;

                    // Send via IntaSend M-Pesa B2C
                    const response = await provider.mpesaB2c({
                        name: sender.fullName || 'Ripplify User',
                        account: phone,
                        amount: amt,
                        narrative: note || `Batch transfer ${i + 1}/${recipients.length}`
                    });
                    externalRef = response?.tracking_id || null;

                } else if (method === 'internal') {
                    if (!r.receiverId) {
                        results.push({ index: i, status: 'Failed', error: 'Receiver ID required' });
                        continue;
                    }
                    receiver = await db.get(`SELECT * FROM users WHERE id = ?`, r.receiverId);
                    if (!receiver) {
                        results.push({ index: i, receiverId: r.receiverId, status: 'Failed', error: 'User not found' });
                        continue;
                    }

                    const response = await provider.intasendTransfer({
                        name: receiver.fullName || receiver.businessName || 'User',
                        amount: amt,
                        narrative: note || `Batch transfer to ${receiver.fullName || receiver.email}`
                    });
                    externalRef = response?.tracking_id || null;
                }

                // Create transfer record
                const result = await db.run(
                    `INSERT INTO transfers (senderId, receiverId, receiverPhone, amount, fee, currency, method, status, note, externalRef)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'Processing', ?, ?)`,
                    [senderId, receiver?.id || null, receiverPhoneNorm || r.phone || '', amt, fee,
                     currency || 'KES', method, note || '', externalRef]
                );

                // Notify internal receiver
                if (receiver) {
                    await Notification.create({
                        userId: receiver.id,
                        title: "Money Received",
                        message: `You received KES ${amt.toLocaleString()} from ${sender.fullName || sender.businessName}`,
                        type: 'success'
                    });
                }

                results.push({ index: i, id: result.lastID, phone: r.phone, receiverId: r.receiverId, amount: amt, status: 'Processing' });
            } catch (err) {
                console.error(`Batch transfer item ${i} failed:`, err.message);
                results.push({ index: i, receiverId: r.receiverId, phone: r.phone, status: 'Failed', error: err.message });
            }
        }

        // SMS to sender about batch
        try {
            await smsService.sendBatchTransferSMS(sender.phone, recipients.length, totalAmount);
        } catch (e) { console.error('SMS error:', e.message); }

        const succeeded = results.filter(r => r.status !== 'Failed').length;
        res.status(201).json({
            message: `Batch transfer: ${succeeded}/${recipients.length} initiated successfully`,
            totalAmount, totalFees, results
        });
    } catch (error) {
        console.error('Batch transfer error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user's transfer history
export const getTransfers = async (req, res) => {
    try {
        const db = getDb();
        const transfers = await db.all(
            `SELECT t.*, u.fullName as receiverName, u.businessName as receiverBusiness
             FROM transfers t
             LEFT JOIN users u ON t.receiverId = u.id
             WHERE t.senderId = ?
             ORDER BY t.createdAt DESC`,
            req.user.id
        );
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search users for transfer (by email, phone, or ID)
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]);

        const db = getDb();
        const users = await db.all(
            `SELECT id, fullName, businessName, email, phone FROM users
             WHERE (email LIKE ? OR phone LIKE ? OR fullName LIKE ? OR businessName LIKE ? OR id = ?)
             AND id != ? AND role != 'admin' AND isDisabled = 0
             LIMIT 10`,
            [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(q) || 0, req.user.id]
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check transfer status via IntaSend
export const checkTransferStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const transfer = await db.get(`SELECT * FROM transfers WHERE id = ? AND senderId = ?`, id, req.user.id);
        if (!transfer) return res.status(404).json({ message: "Transfer not found" });

        if (!transfer.externalRef) {
            return res.json({ status: transfer.status, message: "No external reference to check" });
        }

        // Check with IntaSend
        try {
            const intasendStatus = await provider.checkPayoutStatus(transfer.externalRef);
            const payoutState = intasendStatus?.state || intasendStatus?.payout?.state || null;

            // Map IntaSend states to our states
            if (payoutState === 'COMPLETE' || payoutState === 'COMPLETED') {
                await db.run(`UPDATE transfers SET status = 'Completed' WHERE id = ?`, id);
                return res.json({ status: 'Completed', intasend: intasendStatus });
            } else if (payoutState === 'FAILED' || payoutState === 'REVERSED') {
                await db.run(`UPDATE transfers SET status = 'Failed' WHERE id = ?`, id);
                return res.json({ status: 'Failed', intasend: intasendStatus });
            }

            return res.json({ status: transfer.status, intasend: intasendStatus });
        } catch (apiError) {
            return res.json({ status: transfer.status, error: apiError.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
