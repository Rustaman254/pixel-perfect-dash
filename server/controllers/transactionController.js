import Transaction from '../models/Transaction.js';
import PaymentLink from '../models/PaymentLink.js';
import Notification from '../models/Notification.js';
import { getDb } from '../config/db.js';
import pesapalService from '../utils/pesapalService.js';
import jengaService from '../utils/jengaService.js';
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

        // Get platform fee
        const db = getDb();
        const settings = await db.get("SELECT value FROM system_settings WHERE key = 'platform_fee'");
        const platformFeePercent = settings ? parseFloat(settings.value) : 2.5;
        const fee = (amount * platformFeePercent) / 100;

        const tx_ref = "TXN-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        // 1. Create pending transaction in our DB
        const newTransaction = await Transaction.create({
            userId,
            linkId: actualLinkId,
            buyerName,
            buyerEmail,
            buyerPhone,
            amount,
            fee,
            currency,
            status: 'Pending',
            transactionId: tx_ref,
            type
        });


        console.log('Submitting Order:', { provider: type === 'jenga' ? 'Jenga' : 'PesaPal', orderData });
        
        if (type === 'jenga') {
            // Jenga Collection logic
            const jengaData = {
                amount: amount,
                currency: currency,
                reference: tx_ref,
                description: `Payment for ${link?.name || 'RippliFy Link'}`,
                callbackUrl: `${process.env.BASE_URL.replace('3001', '5173')}/pay/${slug}/callback`,
                customer: {
                    name: buyerName,
                    email: buyerEmail,
                    phone: buyerPhone
                }
            };
            
            const jengaResponse = await jengaService.receivePayment(jengaData);
            console.log('Jenga Submit Response:', jengaResponse);
            
            return res.status(201).json({
                ...newTransaction,
                redirect_url: jengaResponse.url, 
                transactionId: jengaResponse.transactionId
            });
        } else {
            // PesaPal logic
            const names = buyerName.split(' ');
            const firstName = names[0] || 'Buyer';
            const lastName = names.slice(1).join(' ') || 'Customer';
    
            const orderData = {
                id: tx_ref,
                currency: currency,
                amount: amount,
                description: `Payment for ${link?.name || 'RippliFy Link'}`,
                callback_url: `${process.env.BASE_URL.replace('3001', '5173')}/pay/${slug}/callback`,
                notification_id: process.env.PESAPAL_WEBHOOK_ID,
                billing_address: {
                    email_address: buyerEmail,
                    phone_number: buyerPhone,
                    first_name: firstName,
                    last_name: lastName
                }
            };
    
            const pesapalResponse = await pesapalService.submitOrder(orderData);
            console.log('PesaPal Submit Response:', pesapalResponse);
    
            res.status(201).json({
                ...newTransaction,
                redirect_url: pesapalResponse.redirect_url,
                order_tracking_id: pesapalResponse.order_tracking_id
            });
        }
    } catch (error) {
        console.error('Create Transaction Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const handlePesapalIPN = async (req, res) => {
    try {
        const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;
        console.log(`PesaPal IPN Received: ${OrderTrackingId}, Ref: ${OrderMerchantReference}, Type: ${OrderNotificationType}`);

        if (OrderNotificationType === 'IPNRECORDS') {
            // Verify payment status
            const statusData = await pesapalService.getTransactionStatus(OrderTrackingId);
            console.log('PesaPal Payment Status:', statusData);

            if (statusData.payment_status_description === 'Completed') {
                const transaction = await Transaction.findByTransactionId(OrderMerchantReference);

                if (transaction && transaction.status === 'Pending') {
                    // Update transaction status
                    await Transaction.updateStatus(transaction.id, 'Funds locked');

                    // Update payment link stats
                    if (transaction.linkId) {
                        await PaymentLink.updatePaymentStats(transaction.linkId, transaction.amount);

                        const link = await PaymentLink.findById(transaction.linkId);
                        if (link && link.linkType === 'one-time') {
                            await PaymentLink.updateStatus(link.id, 'Funds locked');
                        }
                    }

                    // Notify Seller
                    await Notification.create({
                        userId: transaction.userId,
                        title: "Payment Received (PesaPal)",
                        message: `You received ${transaction.amount} ${transaction.currency} from ${transaction.buyerName}. Funds are held in escrow.`,
                        type: 'success'
                    });
                }
            }
        }

        res.status(200).json({
            OrderTrackingId,
            OrderMerchantReference,
            status: '200'
        });
    } catch (error) {
        console.error('IPN processing error:', error);
        res.status(500).send('Internal Server Error');
    }
};


export const handleJengaIPN = async (req, res) => {
    try {
        console.log('Jenga IPN Received:', req.body);
        const { status, reference } = req.body;

        if (status === 'SUCCESS') {
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
                    title: "Payment Received (Jenga)",
                    message: `You received ${transaction.amount} ${transaction.currency} from ${transaction.buyerName}. Funds are held in escrow.`,
                    type: 'success'
                });
            }
        }

        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Jenga IPN processing error:', error);
        res.status(500).send('Internal Server Error');
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

