import Payout from '../models/Payout.js';
import User from '../models/User.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import { getDb } from '../config/db.js';
import intasendService from '../utils/intasendService.js';
import { getPlatformRevenue } from './adminController.js';


export const requestPayout = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.payoutMethod || !user.payoutDetails) {
            return res.status(400).json({ message: "Please set your payout method and details in Settings first." });
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
                .reduce((acc, p) => acc + p.amount, 0);

            available = totalEarned - withdrawn;
        }

        if (amount > available) {
            return res.status(400).json({ message: `Insufficient balance. Available: ${user.currency || 'KES'} ${available.toLocaleString()}` });
        }


        // Ensure we support M-Pesa and Bank via IntaSend auto API
        if (!['mpesa', 'bank'].includes(user.payoutMethod)) {
            return res.status(400).json({ message: "Currently, only M-Pesa and Bank Transfers are supported." });
        }

        let intasendResponse = null;
        let detailsDisplay = user.payoutDetails;

        if (user.payoutMethod === 'mpesa') {
            let phone = user.payoutDetails.replace(/\D/g, '');
            if (phone.startsWith('0') && phone.length === 10) phone = '254' + phone.slice(1);
            else if (phone.length === 9) phone = '254' + phone;
            detailsDisplay = phone;

            // Ripplify Profit Margin
            const totalFee = amount * 0.01; 
            const netAmount = amount - totalFee;

            if (netAmount <= 0) {
                return res.status(400).json({ message: "Payout amount too small after fees." });
            }

            try {
                intasendResponse = await intasendService.mpesaB2c({
                    name: user.fullName || 'Customer',
                    account: phone,
                    amount: netAmount,
                    narrative: 'Ripplify Payout'
                });
            } catch (apiError) {
                return res.status(500).json({ message: `IntaSend Payout Error: ${apiError.message}` });
            }
        } else if (user.payoutMethod === 'bank') {
            let bankData;
            try {
                bankData = JSON.parse(user.payoutDetails);
            } catch (e) {
                return res.status(400).json({ message: "Invalid bank details format. Please re-save in Settings." });
            }

            if (!bankData.account || !bankData.bankCode) {
                return res.status(400).json({ message: "Bank Account and Bank Code are required." });
            }
            
            detailsDisplay = `${bankData.bankCode} - ${bankData.account}`;

            // Ripplify Profit Margin
            const totalFee = amount * 0.01; 
            const netAmount = amount - totalFee;

            if (netAmount <= 0) {
                return res.status(400).json({ message: "Payout amount too small after fees." });
            }

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

        const platformFee = amount * 0.01;
        const netAmountFinal = amount - platformFee;

        const newPayout = await Payout.create({
            userId,
            amount: amount, // Gross amount
            fee: platformFee,
            currency: user.currency || 'KES',
            method: user.payoutMethod,
            details: detailsDisplay,
            status: 'Processing'
        });

        // Notifications
        await Notification.create({
            userId: null, // Admin
            title: "Payout Initiated",
            message: `Payout of ${netAmountFinal} initiated for ${user.email}.`,
            type: 'info'
        });

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
