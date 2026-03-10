import Transaction from '../models/Transaction.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import { getDb } from '../config/db.js';

export const createTransaction = async (req, res) => {
    try {
        const { linkId, buyerName, buyerEmail, buyerPhone, amount, currency, status, transactionId, type } = req.body;

        // Find the link to get the seller's userId
        const link = await PaymentLink.findBySlug(req.params.slug || ''); // if coming from public page
        const actualLinkId = linkId || (link ? link.id : null);
        const userId = link ? link.userId : (req.user ? req.user.id : null);

        if (!userId) {
            return res.status(400).json({ message: "User ID not found for transaction" });
        }

        // Get platform fee from settings
        const db = getDb();
        const settings = await db.get("SELECT value FROM system_settings WHERE key = 'platform_fee'");
        const platformFeePercent = settings ? parseFloat(settings.value) : 2.5;
        const fee = (amount * platformFeePercent) / 100;

        const newTransaction = await Transaction.create({
            userId,
            linkId: actualLinkId,
            buyerName,
            buyerEmail,
            buyerPhone,
            amount,
            fee,
            currency,
            status: status || 'Completed', // Default to Completed for testing if not provided
            transactionId,
            type
        });

        // Update payment link stats if applicable
        if (actualLinkId) {
            await PaymentLink.updatePaymentStats(actualLinkId, amount);

            // If one-time link, mark as used/locked after first payment and update it with buyer details
            if (link && link.linkType === 'one-time') {
                await PaymentLink.updateBuyerDetails(actualLinkId, {
                    buyerName,
                    buyerEmail,
                    buyerPhone
                });
                await PaymentLink.updateStatus(actualLinkId, 'Funds locked');
            }
        }

        // Notify Seller
        await Notification.create({
            userId: userId,
            title: "Payment Received",
            message: `You received ${amount} ${currency} from ${buyerName || 'a customer'}.`,
            type: 'success'
        });

        // Notify Admin (Earnings)
        await Notification.create({
            userId: null,
            title: "Platform Earnings",
            message: `New transaction of ${amount} ${currency}. Platform fee: ${fee} ${currency}.`,
            type: 'info'
        });

        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findAllByUserId(req.user.id);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTransactionByTrackingToken = async (req, res) => {
    try {
        const txn = await Transaction.findByTrackingToken(req.params.token);
        if (!txn) return res.status(404).json({ message: "Tracking token not found" });
        res.json(txn);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const [stats, methodStats] = await Promise.all([
            Transaction.findStats(req.user.id),
            Transaction.findPaymentMethodStats(req.user.id)
        ]);
        res.json({ stats, methodStats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

