import Payout from '../models/Payout.js';
import User from '../models/User.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import jengaService from '../utils/jengaService.js';

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
        const payoutFee = settings ? parseFloat(settings.value) : 50; // default 50 units (e.g. KES 50)
        const netAmount = amount - payoutFee;

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

        // Trigger Jenga Payout
        try {
            const payoutData = {
                amount: netAmount,
                currency: user.currency || 'KES',
                reference: `PAY-${newPayout.id}`,
                destination: {
                    type: user.payoutMethod === 'mpesa' ? 'MobileMoney' : 'Bank',
                    details: user.payoutDetails // This should be parsed based on method
                }
            };
            
            const jengaResponse = await jengaService.sendMoney(payoutData);
            console.log('Jenga Payout Response:', jengaResponse);
            
            // If Jenga call is successful, we can auto-complete or wait for callback
            // For now, let's keep it 'Processing' and let the admin know
            await Notification.create({
                userId: null,
                title: "Payout Request (Jenga)",
                message: `Automated payout of ${netAmount} initiated for ${user.email}. Status: ${jengaResponse.status}`,
                type: 'info'
            });
        } catch (jengaError) {
            console.error('Jenga Payout Initiation Failed:', jengaError);
            // Don't fail the request, admin can still process manually
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
