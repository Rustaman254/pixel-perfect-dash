import crypto from 'crypto';
import { createConnection } from '../shared/db.js';
import intasendService from './utils/intasendService.js';

const db = () => createConnection('ripplify_db');

const normalizePhone = (phone) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, '');

    if (p.startsWith('0') && p.length === 10) {
        p = '254' + p.slice(1);
    } else if (p.length === 9) {
        p = '254' + p;
    }
    return p;
};

const splitName = (fullName) => {
    if (!fullName) return { firstName: 'Customer', lastName: '' };
    const parts = fullName.trim().split(/\s+/);
    return {
        firstName: parts[0] || 'Customer',
        lastName: parts.slice(1).join(' ') || '',
    };
};

const generateTxRef = () => 'TXN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const generateTrackingToken = () => crypto.randomBytes(16).toString('hex');

export const createPublicTransaction = async (req, res) => {
  try {
    const { slug } = req.params;
    const { buyerName, buyerEmail, buyerPhone, amount, currency, paymentMethod, mpesaPhone, network, type } = req.body;

    const link = await db()('payment_links').where({ slug }).first();
    if (!link) {
      return res.status(404).json({ message: 'Payment link not found' });
    }

    if (link.status !== 'Active') {
      return res.status(400).json({ message: 'Payment link is not active' });
    }

    const txRef = generateTxRef();
    const trackingToken = generateTrackingToken();
    const finalAmount = parseFloat(amount) || link.price;
    const finalCurrency = currency || link.currency || 'KES';

    const [newTransaction] = await db()('transactions')
      .insert({
        userId: link.userId,
        linkId: link.id,
        buyerName: buyerName || '',
        buyerEmail: buyerEmail || '',
        buyerPhone: buyerPhone || '',
        amount: finalAmount,
        fee: 0,
        currency: finalCurrency,
        status: 'Pending',
        transactionId: txRef,
        trackingToken,
        type: type || 'Payment',
        paymentMethod: paymentMethod || 'mpesa',
        network: network || 'mpesa',
      })
      .returning('*');

    const { firstName, lastName } = splitName(buyerName);
    const email = buyerEmail || 'customer@ripplify.io';
    const phone = normalizePhone(req.body.phone || buyerPhone);

    // Fetch the user's IntaSend wallet for the given currency
    const userWallet = await db()('wallets')
        .where({ userId: link.userId, currency_code: finalCurrency, network: 'fiat' })
        .first();
    
    const walletId = userWallet?.intasend_wallet_id || null;

    // Crypto
    if (paymentMethod === 'crypto') {
        const fetch = (await import('node-fetch')).default;
        return res.status(201).json({
            ...newTransaction,
            cryptoDepositInfo: {
                address: "0xMockCryptoAddressFor" + newTransaction.id,
                network: network || 'polygon'
            }
        });
    }

    // M-Pesa STK Push
    if (paymentMethod === 'mpesa') {
        const mPesaTarget = normalizePhone(mpesaPhone || req.body.phone || buyerPhone);
        if (!mPesaTarget || mPesaTarget.length < 12) {
            return res.status(400).json({ message: "Valid Kenyan phone number is required for M-Pesa" });
        }

        const stkResponse = await intasendService.mpesaStkPush({
            phone: mPesaTarget,
            email,
            amount: finalAmount,
            firstName,
            lastName,
            apiRef: txRef,
            host: process.env.BASE_URL || 'https://ripplify.io',
            walletId,
        });

        const invoiceId = stkResponse?.invoice?.invoice_id || stkResponse?.invoice?.id || null;
        if (invoiceId) {
            await db()('transactions')
                .where({ id: newTransaction.id })
                .update({ paymentMethod: 'mpesa', externalRef: invoiceId });
        }

        return res.status(201).json({
            ...newTransaction,
            intasendResponse: stkResponse,
            invoiceId,
            paymentType: 'mpesa_stk',
        });
    }

    // Card/Bank/Checkout Hosted UI
    if (['card', 'bank', 'checkout'].includes(paymentMethod)) {
        const frontendUrl = process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https://') 
            ? process.env.FRONTEND_URL 
            : 'https://ripplify.io';
        
        const redirectUrl = `${frontendUrl}/pay/${slug}?intasend_complete=true`;

        let intasendMethod = null;
        if (paymentMethod === 'card') {
            intasendMethod = 'CARD-PAYMENT';
        }

        const checkoutResponse = await intasendService.checkoutCharge({
            email,
            firstName,
            lastName,
            phone,
            amount: finalAmount,
            currency: finalCurrency,
            apiRef: txRef,
            redirectUrl,
            method: intasendMethod,
            host: process.env.BASE_URL || 'https://ripplify.io',
            walletId,
        });

        const invoiceId = checkoutResponse?.invoice?.invoice_id || checkoutResponse?.invoice?.id || checkoutResponse?.id || null;
        const checkoutUrl = checkoutResponse?.url || null;

        if (invoiceId) {
            await db()('transactions')
                .where({ id: newTransaction.id })
                .update({ paymentMethod, externalRef: invoiceId });
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
        message: "Payment method " + (paymentMethod || 'unknown') + " is not supported." 
    });

  } catch (error) {
    console.error('CreatePublicTransaction error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default createPublicTransaction;