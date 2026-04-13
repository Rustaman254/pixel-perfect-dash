import crypto from 'crypto';
import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

const generateTxRef = () => 'TXN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const generateTrackingToken = () => crypto.randomBytes(16).toString('hex');

export const getMyTransactions = async (req, res) => {
  try {
    const transactions = await db()('transactions')
      .where({ userId: req.user.id })
      .orderBy('createdAt', 'desc');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalResult = await db()('transactions')
      .where({ userId, status: 'Funds locked' })
      .sum('amount as total')
      .first();

    const countResult = await db()('transactions')
      .where({ userId })
      .count('id as count')
      .first();

    const completedResult = await db()('transactions')
      .where({ userId, status: 'Completed' })
      .count('id as count')
      .first();

    const pendingResult = await db()('transactions')
      .where({ userId, status: 'Pending' })
      .count('id as count')
      .first();

    const feeResult = await db()('transactions')
      .where({ userId })
      .sum('fee as total')
      .first();

    const methodStats = await db()('transactions')
      .where({ userId })
      .whereNotNull('paymentMethod')
      .select('paymentMethod')
      .count('id as count')
      .sum('amount as total')
      .groupBy('paymentMethod');

    res.json({
      stats: {
        totalEarned: parseFloat(totalResult?.total || 0),
        totalTransactions: parseInt(countResult?.count || 0),
        completedTransactions: parseInt(completedResult?.count || 0),
        pendingTransactions: parseInt(pendingResult?.count || 0),
        totalFees: parseFloat(feeResult?.total || 0),
      },
      methodStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactionByToken = async (req, res) => {
  try {
    const txn = await db()('transactions')
      .where({ trackingToken: req.params.token })
      .orWhere({ transactionId: req.params.token })
      .first();
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json(txn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { linkId, buyerName, buyerEmail, buyerPhone, amount, currency, type, paymentMethod, network } = req.body;

    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) return res.status(400).json({ message: 'Invalid transaction amount' });

    let userId = req.user?.id;
    let link = null;

    if (linkId) {
      link = await db()('payment_links').where({ id: linkId }).first();
      if (link) userId = link.userId;
    }

    if (!userId) return res.status(400).json({ message: 'User ID not found for transaction' });

    if (link) {
      if (link.linkType !== 'donation') {
        let expectedAmount = parseFloat(link.price) || 0;
        if (link.category === 'product') expectedAmount += parseFloat(link.shippingFee || 0);
        if (Math.abs(numericAmount - expectedAmount) > 0.01) {
          return res.status(400).json({ message: 'Transaction amount mismatch', expected: expectedAmount, received: numericAmount });
        }
      } else if (link.minDonation > 0 && numericAmount < link.minDonation) {
        return res.status(400).json({ message: `Minimum donation amount is ${link.currency} ${link.minDonation}` });
      }
    }

    const txRef = generateTxRef();
    const trackingToken = generateTrackingToken();
    const fee = (numericAmount * 2.5) / 100;

    const [newTransaction] = await db()('transactions')
      .insert({
        userId,
        linkId: linkId || null,
        buyerName: buyerName || '',
        buyerEmail: buyerEmail || '',
        buyerPhone: buyerPhone || '',
        amount: numericAmount,
        fee,
        currency: currency || 'KES',
        status: 'Pending',
        transactionId: txRef,
        trackingToken,
        type: type || 'Payment',
        paymentMethod: paymentMethod || null,
        network: network || null,
      })
      .returning('*');

    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    const transaction = await db()('transactions').where({ id }).first();
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const [updated] = await db()('transactions')
      .where({ id })
      .update({ status })
      .returning('*');

    if (status === 'Funds locked' && transaction.linkId) {
      await db()('payment_links').where({ id: transaction.linkId }).increment('paymentCount', 1).increment('totalEarnedValue', transaction.amount);
      const link = await db()('payment_links').where({ id: transaction.linkId }).first();
      if (link && link.linkType === 'one-time') {
        await db()('payment_links').where({ id: link.id }).update({ status: 'Funds locked' });
      }
    }

    if (status === 'Shipped' && transaction.linkId) {
      const link = await db()('payment_links').where({ id: transaction.linkId }).first();
      if (link && link.linkType === 'one-time') {
        await db()('payment_links').where({ id: link.id }).update({ status: 'Shipped' });
      }
    }

    res.json({ message: 'Transaction status updated', transaction: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal: get transactions for a user
export const internalGetTransactions = async (req, res) => {
  try {
    const { userId, page = 1, limit = 50 } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    
    const uid = parseInt(userId);
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    const transactions = await db()('transactions')
      .where({ userId: uid })
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);
    
    const countResult = await db()('transactions').where({ userId: uid }).count('* as count').first();
    const total = parseInt(countResult.count) || 0;
    
    res.json({ transactions, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal: get stats for a user
export const internalGetTransactionStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Platform-wide stats (no userId or userId=0 means get all)
    if (!userId || userId === '0') {
      const [pendingResult, successResult, totalResult, countResult] = await Promise.all([
        db()('transactions').where({ status: 'Pending' }).sum('amount as total').first(),
        db()('transactions').where({ status: 'Success' }).sum('amount as total').first(),
        db()('transactions').where({ status: 'Success' }).sum('amount as total').first(),
        db()('transactions').count('id as count').first(),
      ]);
      
      return res.json({
        totalEarned: parseFloat(totalResult?.total || 0),
        totalPending: parseFloat(pendingResult?.total || 0),
        totalSuccess: parseFloat(successResult?.total || 0),
        totalTransactions: parseInt(countResult?.count || 0),
      });
    }
    
    const uid = parseInt(userId);

    const totalResult = await db()('transactions').where({ userId: uid, status: 'Funds locked' }).sum('amount as total').first();
    const countResult = await db()('transactions').where({ userId: uid }).count('id as count').first();

    res.json({
      totalEarned: parseFloat(totalResult?.total || 0),
      totalTransactions: parseInt(countResult?.count || 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal: get ALL transactions for admin
export const internalGetAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    let query = db()('transactions');
    
    if (status) query = query.where({ status });
    if (search) {
      query = query.where(function() {
        this.where('buyerName', 'ilike', `%${search}%`)
          .orWhere('buyerEmail', 'ilike', `%${search}%`)
          .orWhere('transactionId', 'ilike', `%${search}%`);
      });
    }
    
    const transactions = await query
      .select('transactions.*', db.raw('users.fullName as sellerName, users.businessName as sellerBusinessName'))
      .leftJoin('users', 'transactions.userId', 'users.id')
      .orderBy('transactions.createdAt', 'desc')
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);
    
    const countResult = await query.clone().count('* as count').first();
    const total = parseInt(countResult.count) || 0;
    
    res.json({ transactions, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  getMyTransactions, getTransactionStats, getTransactionByToken,
  createTransaction, updateTransactionStatus,
  internalGetTransactions, internalGetAllTransactions, internalGetTransactionStats,
};
