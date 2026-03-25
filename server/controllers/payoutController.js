import Payout from '../models/Payout.js';
import User from '../models/User.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import { getDb } from '../config/db.js';
import intasendService from '../utils/intasendService.js';
import { getPlatformRevenue } from './adminController.js';
import smsService from '../services/smsService.js';


export const requestPayout = async (req, res) => {
    try {
        const { amount, payoutMethodId } = req.body;
        const userId = req.user.id;
        const db = getDb();

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Resolve which payout method to use
        let payoutMethod = null;
        let payoutDetails = '';

        if (payoutMethodId) {
            // Use a specific saved payout method
            payoutMethod = await db.get(
                `SELECT * FROM user_payout_methods WHERE id = ? AND userId = ? AND isActive = 1`,
                payoutMethodId, userId
            );
            if (!payoutMethod) {
                return res.status(400).json({ message: "Selected payout method not found. Please set it up in Settings > Payout Options.", redirectTo: '/settings' });
            }
        } else {
            // Fall back to user's default payout method
            payoutMethod = await db.get(
                `SELECT * FROM user_payout_methods WHERE userId = ? AND isDefault = 1 AND isActive = 1`,
                userId
            );
            if (!payoutMethod) {
                // Last resort: use legacy user fields
                if (!user.payoutMethod || !user.payoutDetails) {
                    return res.status(400).json({ message: "No payout method configured. Please add one in Settings > Payout Options.", redirectTo: '/settings' });
                }
                payoutMethod = { method: user.payoutMethod, details: user.payoutDetails, label: user.payoutMethod === 'mpesa' ? 'M-Pesa' : 'Bank' };
            }
        }

        if (!['mpesa', 'bank'].includes(payoutMethod.method)) {
            return res.status(400).json({ message: "Only M-Pesa and Bank withdrawals are supported." });
        }

        const transactionLimit = user.transactionLimit || 5000;
        if (amount > transactionLimit) {
            return res.status(400).json({ message: `Please complete KYC verification to request payouts higher than ${transactionLimit}.` });
        }

        // Calculate available balance
        let available;
        if (user.role === 'admin') {
            const totalRevenue = await getPlatformRevenue();
            const totalWithdrawnByAdmins = await db.get(`
                SELECT SUM(amount) as total 
                FROM payouts p 
                JOIN users u ON p.userId = u.id 
                WHERE u.role = 'admin' AND p.status IN ('Processing', 'Completed')
            `);
            available = totalRevenue - (totalWithdrawnByAdmins?.total || 0);
        } else {
            const links = await PaymentLink.findAllByUserId(userId);
            const totalEarned = links.reduce((acc, l) => acc + (l.totalEarnedValue || 0), 0);

            const payouts = await Payout.findAllByUserId(userId);
            const withdrawn = payouts
                .filter(p => ['Processing', 'Completed'].includes(p.status))
                .reduce((acc, p) => acc + p.amount + (p.fee || 0), 0);

            const transfers = await db.get(
                `SELECT SUM(amount + fee) as total FROM transfers WHERE senderId = ? AND status IN ('Processing', 'Completed')`,
                userId
            );
            const transferSpent = transfers?.total || 0;

            available = totalEarned - withdrawn - transferSpent;
        }

        if (amount > available) {
            return res.status(400).json({ message: `Insufficient balance. Available: KES ${available.toLocaleString()}` });
        }

        // Process payout via IntaSend
        let intasendResponse = null;
        let detailsDisplay = payoutMethod.details;

        const platformFee = amount * 0.01;
        const netAmount = amount - platformFee;

        if (netAmount <= 0) {
            return res.status(400).json({ message: "Payout amount too small after fees." });
        }

        if (payoutMethod.method === 'mpesa') {
            let phone = payoutMethod.details.replace(/\D/g, '');
            if (phone.startsWith('0') && phone.length === 10) phone = '254' + phone.slice(1);
            else if (phone.length === 9) phone = '254' + phone;
            detailsDisplay = phone;

            try {
                intasendResponse = await intasendService.mpesaB2c({
                    name: user.fullName || 'Customer',
                    account: phone,
                    amount: netAmount,
                    narrative: 'Ripplify Payout'
                });
            } catch (apiError) {
                return res.status(500).json({ message: `IntaSend M-Pesa Payout Error: ${apiError.message}` });
            }
        } else if (payoutMethod.method === 'bank') {
            let bankData;
            try {
                bankData = JSON.parse(payoutMethod.details);
            } catch (e) {
                return res.status(400).json({ message: "Invalid bank details. Please update in Settings > Payout Options.", redirectTo: '/settings' });
            }

            if (!bankData.account || !bankData.bankCode) {
                return res.status(400).json({ message: "Bank Account and Bank Code are required. Please update in Settings.", redirectTo: '/settings' });
            }

            detailsDisplay = `${bankData.bankCode} - ${bankData.account}`;

            try {
                intasendResponse = await intasendService.bankPayout({
                    name: user.fullName || 'Customer',
                    account: bankData.account,
                    bankCode: bankData.bankCode,
                    amount: netAmount,
                    narrative: 'Ripplify Bank Payout'
                });
            } catch (apiError) {
                return res.status(500).json({ message: `IntaSend Bank Payout Error: ${apiError.message}` });
            }
        }

        const newPayout = await Payout.create({
            userId,
            amount: amount,
            fee: platformFee,
            currency: 'KES',
            method: payoutMethod.method,
            details: detailsDisplay,
            status: 'Processing'
        });

        await Notification.create({
            userId: null,
            title: "Payout Initiated",
            message: `Payout of KES ${netAmount.toLocaleString()} (${payoutMethod.method}) initiated for ${user.email}.`,
            type: 'info'
        });

        try {
            if (user.phone) {
                await smsService.sendPayoutSMS(user.phone, newPayout);
            }
        } catch (e) { console.error('Payout SMS error:', e.message); }

        res.status(201).json(newPayout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPayouts = async (req, res) => {
    try {
        const payouts = await Payout.findAllByUserId(req.user.id);
        res.json(payouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
