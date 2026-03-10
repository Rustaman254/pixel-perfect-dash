import Payout from '../models/Payout.js';
import User from '../models/User.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';

export const requestPayout = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.payoutMethod || !user.payoutDetails) {
            return res.status(400).json({ message: "Please set your payout method and details in Settings first." });
        }

        // Calculate available balance
        // Simplified: (Total Earned from Links) - (Processing/Completed Payouts)
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

        const newPayout = await Payout.create({
            userId,
            amount,
            currency: user.currency || 'KES',
            method: user.payoutMethod,
            details: user.payoutDetails,
            status: 'Processing'
        });

        // Notify Admin
        await Notification.create({
            userId: null,
            title: "Payout Request",
            message: `User ${user.email} requested a payout of ${amount} ${user.currency || 'KES'}.`,
            type: 'warning'
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
