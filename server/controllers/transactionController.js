import Transaction from '../models/Transaction.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import { getDb } from '../config/db.js';
import paystackService from '../utils/paystackService.js';
import crypto from 'crypto';

export const createTransaction = async (req, res) => {
    console.log('Create Transaction Request:', { params: req.params, body: req.body });
    try {
        const { linkId, buyerName, buyerEmail, buyerPhone, amount, currency, type } = req.body;
        const slug = req.params.slug;

        // Find the link to get the seller's userId
        const link = await PaymentLink.findBySlug(slug || '');
        const actualLinkId = linkId || (link ? link.id : null);
        const userId = link ? link.userId : (req.user ? req.user.id : null);

        if (!userId) {
            return res.status(400).json({ message: "User ID not found for transaction" });
        }

        // Ensure numeric amount
        const numericAmount = parseFloat(amount) || 0;
        if (numericAmount <= 0) {
            return res.status(400).json({ message: "Invalid transaction amount" });
        }

        // Security: Validate amount against link price
        if (link) {
            if (link.linkType !== 'donation') {
                let expectedAmount = parseFloat(link.price) || 0;
                if (link.category === 'product') {
                    expectedAmount += (parseFloat(link.shippingFee) || 0);
                }
                
                // Use a small epsilon for float comparison if necessary, but prices are usually simple
                if (Math.abs(numericAmount - expectedAmount) > 0.01) {
                    return res.status(400).json({ 
                        message: "Transaction amount mismatch. Please do not tamper with the price.",
                        expected: expectedAmount,
                        received: numericAmount
                    });
                }
            } else if (link.minDonation > 0 && numericAmount < link.minDonation) {
                return res.status(400).json({ 
                    message: `Minimum donation amount is ${link.currency} ${link.minDonation}` 
                });
            }
        }

        // Get platform fee
        const db = getDb();
        const settings = await db.get("SELECT value FROM system_settings WHERE key = 'platform_fee'");
        const platformFeePercent = settings ? parseFloat(settings.value) : 2.5;
        const fee = (numericAmount * platformFeePercent) / 100;

        const tx_ref = "TXN-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        // 1. Create pending transaction in our DB
        const newTransaction = await Transaction.create({
            userId,
            linkId: actualLinkId,
            buyerName,
            buyerEmail: buyerEmail || 'customer@ripplify.io',
            buyerPhone,
            amount: numericAmount,
            fee: fee,
            currency: currency || 'KES',
            status: 'Pending',
            transactionId: tx_ref,
            type
        });

        // Crypto Handling
        if (req.body.paymentMethod === 'crypto') {
            const network = req.body.network || (currency === 'USDA' ? 'cardano' : 'polygon');
            const { default: cryptoService } = await import('../utils/cryptoService.js');
            const depositInfo = await cryptoService.getDepositAddress(userId, network);
            
            await db.run(
                `UPDATE transactions SET paymentMethod = ?, network = ? WHERE id = ?`,
                ['crypto', network, newTransaction.id]
            );
            
            return res.status(201).json({
                ...newTransaction,
                cryptoDepositInfo: depositInfo
            });
        }


        // Paystack Unified Charge (Card, Mobile Money, Bank)
        if (['paystack', 'card', 'mpesa', 'bank'].includes(req.body.paymentMethod)) {
            console.log('Submitting Paystack Charge via Raw API');
            const paystackData = {
                amount: Math.round(numericAmount * 100),
                email: buyerEmail || 'customer@ripplify.io',
                currency: currency || 'KES',
                reference: tx_ref,
                metadata: {
                    buyerName,
                    buyerPhone: req.body.phone || buyerPhone,
                    linkId: link?.id
                }
            };

            // Normalize phone number for Paystack (Kenya format +254XXXXXXXXX)
            const normalizePhone = (phone) => {
                if (!phone) return '';
                // Remove all non-digit characters (including +)
                let p = phone.replace(/\D/g, '');
                
                // If it starts with 0 and is 10 digits (07... or 01...), prepend 254 and remove the leading 0
                if (p.startsWith('0') && p.length === 10) {
                    p = '254' + p.slice(1);
                }
                // If it's 9 digits (7... or 1...), prepend 254
                else if (p.length === 9) {
                    p = '254' + p;
                }
                // If it starts with 254 and is 12 digits, it's already correct
                // Otherwise return as-is
                
                // Paystack requires the + prefix for mobile money
                if (p.startsWith('254') && p.length === 12) {
                    return '+' + p;
                }
                
                return '+' + p;
            };

            const formattedPhone = normalizePhone(req.body.mobile_money?.phone || req.body.phone || buyerPhone);
            console.log('Normalized phone for Paystack:', formattedPhone, '(source: mobile_money.phone=', req.body.mobile_money?.phone, ', buyerPhone=', buyerPhone, ')');

            // Mapping frontend methods to Paystack structure
            if (req.body.card) {
                paystackData.card = req.body.card;
            } else if (req.body.mobile_money) {
                paystackData.mobile_money = {
                    ...req.body.mobile_money,
                    phone: formattedPhone
                };
            } else if (req.body.bank) {
                paystackData.bank = req.body.bank;
            } else if (req.body.paymentMethod === 'mpesa') {
                paystackData.mobile_money = {
                    phone: formattedPhone,
                    provider: 'mpesa'
                };
            } else {
                return res.status(400).json({ message: "Payment details missing for " + req.body.paymentMethod });
            }
            
            console.log('Final Paystack Data:', JSON.stringify(paystackData, null, 2));

            const paystackResponse = await paystackService.charge(paystackData);
            console.log('Paystack Charge Response:', JSON.stringify(paystackResponse, null, 2));
            
            return res.status(201).json({
                ...newTransaction,
                paystackResponse, 
                transactionId: paystackResponse.data?.reference || tx_ref,
                redirect_url: null
            });
        }

        return res.status(400).json({ 
            message: "Payment method " + (req.body.paymentMethod || 'unknown') + " is not supported in-app. Please contact support." 
        });
    } catch (error) {
        console.error('Create Transaction Error Full:', error);
        
        // Check if it's a validation error (400) from Paystack
        const isValidationError = error.message.includes('format') || 
                                 error.message.includes('Invalid') || 
                                 error.response?.status === 400;
        
        res.status(isValidationError ? 400 : 500).json({ 
            message: error.response?.data?.message || error.message || "An unexpected error occurred during transaction creation.",
            details: error.response?.data || null
        });
    }
};


export const handlePaystackIPN = async (req, res) => {
    try {
        console.log('Paystack IPN Received:', req.body.event);
        const signature = req.headers['x-paystack-signature'];
        
        // Simple signature verification (Ideally requires raw body, but this should work for simple payloads)
        const isValid = paystackService.verifyWebhookSignature(signature, JSON.stringify(req.body));
        if (!isValid) {
            console.log('Paystack Signature Verification Failed');
            // We could return 401, but best practice is to return 200 in webhooks to prevent retries
            // if we are failing due to formatting. For safety, return 400.
            return res.status(400).send('Invalid Signature');
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const data = event.data;
            const transaction = await Transaction.findByTransactionId(data.reference);
            
            if (transaction && transaction.status === 'Pending') {
                await Transaction.updateStatus(transaction.id, 'Funds locked');
                
                if (transaction.linkId) {
                    await PaymentLink.updatePaymentStats(transaction.linkId, transaction.amount);
                    
                    const link = await PaymentLink.findById(transaction.linkId);
                    if (link && link.linkType === 'one-time') {
                        await PaymentLink.updateStatus(link.id, 'Funds locked');
                    }
                }

                await Notification.create({
                    userId: transaction.userId,
                    title: "Payment Received (Paystack)",
                    message: `You received ${transaction.amount} ${transaction.currency} from ${transaction.buyerName}. Funds are held in escrow.`,
                    type: 'success'
                });
            }
        }

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Paystack webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const submitPaystackOTP = async (req, res) => {
    try {
        const { otp, reference } = req.body;
        const response = await paystackService.submitOTP(otp, reference);
        res.json(response);
    } catch (error) {
        console.error('Submit OTP Error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const submitPaystackPIN = async (req, res) => {
    try {
        const { pin, reference } = req.body;
        const response = await paystackService.submitPIN(pin, reference);
        res.json(response);
    } catch (error) {
        console.error('Submit PIN Error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const submitPaystackBirthday = async (req, res) => {
    try {
        const { birthday, reference } = req.body;
        const response = await paystackService.submitBirthday(birthday, reference);
        res.json(response);
    } catch (error) {
        console.error('Submit Birthday Error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const submitPaystackAddress = async (req, res) => {
    try {
        const { address, city, state, zipcode, reference } = req.body;
        const response = await paystackService.submitAddress({ address, city, state, zipcode }, reference);
        res.json(response);
    } catch (error) {
        console.error('Submit Address Error:', error);
        res.status(400).json({ message: error.message });
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

export const verifyPaystackPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const result = await paystackService.verifyPayment(reference);
        
        // If payment is successful, update local transaction status
        if (result.data?.status === 'success') {
            const transaction = await Transaction.findByTransactionId(reference);
            if (transaction && transaction.status === 'Pending') {
                await Transaction.updateStatus(transaction.id, 'Funds locked');
                
                if (transaction.linkId) {
                    await PaymentLink.updatePaymentStats(transaction.linkId, transaction.amount);
                    const link = await PaymentLink.findById(transaction.linkId);
                    if (link && link.linkType === 'one-time') {
                        await PaymentLink.updateStatus(link.id, 'Funds locked');
                    }
                }

                await Notification.create({
                    userId: transaction.userId,
                    title: "Payment Received (M-Pesa)",
                    message: `You received ${transaction.amount} ${transaction.currency} from ${transaction.buyerName}. Funds are held in escrow.`,
                    type: 'success'
                });
            }
        }
        
        res.json(result);
    } catch (error) {
        console.error('Verify Paystack Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};
