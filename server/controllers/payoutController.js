import Payout from '../models/Payout.js';
import User from '../models/User.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import paystackService from '../utils/paystackService.js';
import { getDb } from '../config/db.js';

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
        const links = await PaymentLink.findAllByUserId(userId);
        const totalEarned = links.reduce((acc, l) => acc + (l.totalEarnedValue || 0), 0);

        const payouts = await Payout.findAllByUserId(userId);
        const withdrawn = payouts
            .filter(p => ['Processing', 'Completed'].includes(p.status))
            .reduce((acc, p) => acc + p.amount, 0);

        const available = totalEarned - withdrawn;

        if (amount > available) {
            return res.status(400).json({ message: `Insufficient balance. Available: ${user.currency || 'KES'} ${available.toLocaleString()}` });
        }


        // Calculate amount after fee deduction (for Ripplify's profitability)
        // We can apply a payout fee if needed, or just use the collected fees.
        // The user asked to make the platform profitable with good margins.
        const db = getDb();
        const settings = await db.get("SELECT value FROM system_settings WHERE key = 'payout_fee'");
        const flatFee = settings ? parseFloat(settings.value) : 50;
        const percentFee = amount * 0.02; // 2% platform margin
        const totalFee = flatFee + percentFee;
        const netAmount = amount - totalFee;

        if (netAmount <= 0) {
            return res.status(400).json({ message: "Payout amount too small after fees." });
        }

        const newPayout = await Payout.create({
            userId,
            amount: netAmount,
            currency: user.currency || 'KES',
            method: user.payoutMethod,
            details: user.payoutDetails,
            status: 'Processing'
        });

        try {
            // 1. Create a Transfer Recipient
            const recipientResponse = await paystackService.createTransferRecipient({
                type: "nuban",
                name: user.fullName || user.email,
                account_number: user.payoutDetails.accountNumber || "0000000000",
                bank_code: user.payoutDetails.bankCode || "058", // Generic or specific bank code
                currency: user.currency || 'NGN'
            });

            // 2. Initiate Transfer
            const transferData = {
                source: "balance",
                amount: netAmount * 100, // Paystack uses subunit
                recipient: recipientResponse.data.recipient_code,
                reason: `Payout for ${user.email} - PAY-${newPayout.id}`
            };

            const transferResponse = await paystackService.initiateTransfer(transferData);
            console.log('Paystack Payout Response:', transferResponse);

            await Notification.create({
                userId: null,
                title: "Payout Request (Paystack)",
                message: `Automated payout of ${netAmount} initiated for ${user.email}. Status: ${transferResponse.data.status}`,
                type: 'info'
            });
        } catch (paystackError) {
            console.error('Paystack Payout Initiation Failed:', paystackError);
        }

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
