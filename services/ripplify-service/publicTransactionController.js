import crypto from 'crypto';
import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

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

    res.status(201).json({
      success: true,
      transactionId: txRef,
      trackingToken,
      amount: finalAmount,
      currency: finalCurrency,
      status: 'Pending',
    });
  } catch (error) {
    console.error('CreatePublicTransaction error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default createPublicTransaction;