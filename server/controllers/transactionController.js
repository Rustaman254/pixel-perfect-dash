import Transaction from '../models/Transaction.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import { getDb } from '../config/db.js';
import intasendService from '../utils/intasendService.js';
import crypto from 'crypto';
import emailService from '../services/emailService.js';
import smsService from '../services/smsService.js';

/**
 * Normalize Kenyan phone numbers to 254XXXXXXXXX format (no + prefix — IntaSend requirement)
 */
const normalizePhone = (phone) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, '');

    if (p.startsWith('0') && p.length === 10) {
        p = '254' + p.slice(1);
    } else if (p.length === 9) {
        p = '254' + p;
    }
    // Already starts with 254 and is 12 digits — fine as-is
    return p;
};

/**
 * Split a full name into first and last parts
 */
const splitName = (fullName) => {
    if (!fullName) return { firstName: 'Customer', lastName: '' };
    const parts = fullName.trim().split(/\s+/);
    return {
        firstName: parts[0] || 'Customer',
        lastName: parts.slice(1).join(' ') || '',
    };
};

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

        const { firstName, lastName } = splitName(buyerName);
        const email = buyerEmail || 'customer@ripplify.io';
        const phone = normalizePhone(req.body.phone || buyerPhone);

        // IntaSend M-Pesa STK Push
        if (req.body.paymentMethod === 'mpesa') {
            console.log('Triggering IntaSend M-Pesa STK Push');
            const mpesaPhone = normalizePhone(req.body.mpesaPhone || req.body.phone || buyerPhone);

            if (!mpesaPhone || mpesaPhone.length < 12) {
                return res.status(400).json({ message: "Valid Kenyan phone number is required for M-Pesa" });
            }

            const stkResponse = await intasendService.mpesaStkPush({
                phone: mpesaPhone,
                email,
                amount: numericAmount,
                firstName,
                lastName,
                apiRef: tx_ref,
                host: process.env.BASE_URL || 'https://ripplify.io',
            });

            // Store the IntaSend invoice_id for status tracking
            const invoiceId = stkResponse?.invoice?.invoice_id || stkResponse?.invoice?.id || null;
            if (invoiceId) {
                await db.run(
                    `UPDATE transactions SET paymentMethod = ?, externalRef = ? WHERE id = ?`,
                    ['mpesa', invoiceId, newTransaction.id]
                );
            }

            return res.status(201).json({
                ...newTransaction,
                intasendResponse: stkResponse,
                invoiceId,
                paymentType: 'mpesa_stk',
            });
        }

        // IntaSend Checkout (Card / Bank / General)
        if (['card', 'bank', 'checkout'].includes(req.body.paymentMethod)) {
            console.log('Generating IntaSend Checkout Link for:', req.body.paymentMethod);

            // Determine redirect URL — back to the payment page
            // IntaSend requires HTTPS URLs, so we ensure we use a valid HTTPS frontend URL
            const frontendUrl = process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https://') 
                ? process.env.FRONTEND_URL 
                : 'https://ripplify.io';
            // Include intasend_complete parameter so frontend can detect the callback
            const redirectUrl = `${frontendUrl}/pay/${slug}?intasend_complete=true`;

            // Map payment method to IntaSend method identifier
            let intasendMethod = null;
            if (req.body.paymentMethod === 'card') {
                intasendMethod = 'CARD-PAYMENT';
            }
            // bank and checkout use the default (all methods) checkout

            const checkoutResponse = await intasendService.checkoutCharge({
                email,
                firstName,
                lastName,
                phone,
                amount: numericAmount,
                currency: currency || 'KES',
                apiRef: tx_ref,
                redirectUrl,
                method: intasendMethod,
                host: process.env.BASE_URL || 'https://ripplify.io',
            });

            const invoiceId = checkoutResponse?.invoice?.invoice_id || checkoutResponse?.invoice?.id || checkoutResponse?.id || null;
            const checkoutUrl = checkoutResponse?.url || null;

            if (invoiceId) {
                await db.run(
                    `UPDATE transactions SET paymentMethod = ?, externalRef = ? WHERE id = ?`,
                    [req.body.paymentMethod, invoiceId, newTransaction.id]
                );
            }

            return res.status(201).json({
                ...newTransaction,
                intasendResponse: checkoutResponse,
                invoiceId,
                checkout_url: checkoutUrl,
                paymentType: 'checkout',
            });
        }

        return res.status(400).json({ 
            message: "Payment method " + (req.body.paymentMethod || 'unknown') + " is not supported. Use mpesa, card, bank, or crypto." 
        });
    } catch (error) {
        console.error('Create Transaction Error Full:', error);
        
        const isValidationError = error.message?.includes('format') || 
                                 error.message?.includes('Invalid') || 
                                 error.message?.includes('required');
        
        res.status(isValidationError ? 400 : 500).json({ 
            message: error.message || "An unexpected error occurred during transaction creation.",
        });
    }
};


/**
 * IntaSend Webhook Handler
 * Receives POST with payment state changes from IntaSend
 */
export const handleIntaSendWebhook = async (req, res) => {
    try {
        console.log('IntaSend Webhook Received:', JSON.stringify(req.body, null, 2));

        const event = req.body;
        const invoiceId = event.invoice_id;
        const state = event.state;
        const apiRef = event.api_ref;
        const challenge = event.challenge;

        // Validate challenge matches (set in IntaSend dashboard)
        // In production, verify the challenge string
        if (!invoiceId || !state) {
            console.log('IntaSend Webhook: Missing invoice_id or state');
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (state === 'COMPLETE') {
            // Find transaction by api_ref (our tx_ref) or externalRef (invoice_id)
            let transaction = null;
            if (apiRef) {
                transaction = await Transaction.findByTransactionId(apiRef);
            }
            if (!transaction) {
                // Try by externalRef (invoiceId)
                const db = getDb();
                const row = await db.get('SELECT * FROM transactions WHERE externalRef = ?', [invoiceId]);
                if (row) {
                    transaction = row;
                }
            }

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
                    title: "Payment Received",
                    message: `You received ${transaction.amount} ${transaction.currency} from ${transaction.buyerName}. Funds are held in escrow.`,
                    type: 'success'
                });

                // Send SMS to seller
                try {
                    const seller = await db.get(`SELECT phone, fullName, businessName FROM users WHERE id = ?`, transaction.userId);
                    if (seller?.phone) {
                        await smsService.sendTransactionSMS(seller.phone, {
                            ...transaction,
                            buyerName: transaction.buyerName
                        });
                    }
                } catch (smsError) {
                    console.error('Failed to send transaction SMS:', smsError.message);
                }

                // Send receipt email to buyer
                try {
                    const buyer = {
                        email: transaction.buyerEmail,
                        fullName: transaction.buyerName
                    };
                    await emailService.sendReceiptEmail(buyer, transaction);
                    console.log('Receipt email sent to:', transaction.buyerEmail);
                } catch (emailError) {
                    console.error('Failed to send receipt email:', emailError.message);
                }
            }
        } else if (state === 'FAILED') {
            let transaction = null;
            if (apiRef) {
                transaction = await Transaction.findByTransactionId(apiRef);
            }
            if (transaction && transaction.status === 'Pending') {
                await Transaction.updateStatus(transaction.id, 'Failed');
                console.log(`Transaction ${apiRef} marked as Failed (IntaSend webhook)`);
            }
        }

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('IntaSend webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * Check IntaSend payment status by invoice ID
 */
export const checkIntaSendPaymentStatus = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const result = await intasendService.checkPaymentStatus(invoiceId);

        const invoiceState = result?.invoice?.state || result?.state || null;

        // If payment is complete, update local transaction
        if (invoiceState === 'COMPLETE') {
            const apiRef = result?.invoice?.api_ref || null;
            let transaction = null;

            if (apiRef) {
                transaction = await Transaction.findByTransactionId(apiRef);
            }
            if (!transaction) {
                const db = getDb();
                const row = await db.get('SELECT * FROM transactions WHERE externalRef = ?', [invoiceId]);
                if (row) transaction = row;
            }

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
                    title: "Payment Received",
                    message: `You received ${transaction.amount} ${transaction.currency} from ${transaction.buyerName}. Funds are held in escrow.`,
                    type: 'success'
                });

                // Send SMS to seller
                try {
                    const db = getDb();
                    const seller = await db.get(`SELECT phone, fullName, businessName FROM users WHERE id = ?`, transaction.userId);
                    if (seller?.phone) {
                        await smsService.sendTransactionSMS(seller.phone, {
                            ...transaction,
                            buyerName: transaction.buyerName
                        });
                    }
                } catch (smsError) {
                    console.error('Failed to send transaction SMS:', smsError.message);
                }

                // Send receipt email
                try {
                    const buyer = {
                        email: transaction.buyerEmail,
                        fullName: transaction.buyerName
                    };
                    await emailService.sendReceiptEmail(buyer, transaction);
                } catch (emailError) {
                    console.error('Failed to send receipt email:', emailError.message);
                }
            }
        }

        res.json({
            invoiceId,
            state: invoiceState,
            raw: result,
        });
    } catch (error) {
        console.error('Check IntaSend Payment Status Error:', error);
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

export const updateTransactionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Verify ownership (only the seller/admin of the link can update status)
        if (transaction.userId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this transaction" });
        }

        await Transaction.updateStatus(id, status);

        // If the transaction is linked to a one-time payment link and status is Shipped, update link
        if (status === 'Shipped' && transaction.linkId) {
            const link = await PaymentLink.findById(transaction.linkId);
            if (link && link.linkType === 'one-time') {
                await PaymentLink.updateStatus(link.id, 'Shipped');
            }
        }

        res.json({ message: "Transaction status updated", status });
    } catch (error) {
        console.error('Update Transaction Status Error:', error);
        res.status(500).json({ message: error.message });
    }
};
