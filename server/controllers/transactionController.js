import Transaction from '../models/Transaction.js';
import PaymentLink from '../models/PaymentLink.js';

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

        const newTransaction = await Transaction.create({
            userId,
            linkId: actualLinkId,
            buyerName,
            buyerEmail,
            buyerPhone,
            amount,
            currency,
            status,
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

