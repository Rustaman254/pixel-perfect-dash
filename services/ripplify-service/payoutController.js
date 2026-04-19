import { createConnection } from '../shared/db.js';
import intasendService from './utils/intasendService.js';

const db = () => createConnection('ripplify_db');

export const requestPayout = async (req, res) => {
  try {
    const { amount, payoutMethodId, method, details, currency } = req.body;
    const userId = req.user.id;
    const finalCurrency = currency || 'KES';

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const numericAmount = parseFloat(amount);

    // Get the user's fiat wallet
    const wallet = await db()('wallets')
      .where({ userId, currency_code: finalCurrency, network: 'fiat' })
      .first();
    
    if (!wallet) return res.status(400).json({ message: `No ${finalCurrency} wallet found.` });

    // Sync balance from IntaSend
    let available = parseFloat(wallet.balance);
    if (wallet.intasend_wallet_id) {
        try {
            const details = await intasendService.getIntaSendWallet(wallet.intasend_wallet_id);
            available = parseFloat(details.available_balance);
        } catch (e) {
            console.error('Failed to sync wallet balance before payout:', e.message);
        }
    }

    if (numericAmount > available) {
      return res.status(400).json({ message: `Insufficient balance. Available: ${available.toFixed(2)}` });
    }

    // Resolve payout method
    let payoutMethod = null;
    let payoutDetails = details || '';

    if (payoutMethodId) {
      payoutMethod = await db()('user_payout_methods')
        .where({ id: payoutMethodId, userId, isActive: true })
        .first();
      if (!payoutMethod) return res.status(400).json({ message: 'Selected payout method not found' });
    } else if (method && details) {
      payoutMethod = { method, details, label: method === 'mpesa' ? 'M-Pesa' : 'Bank' };
    } else {
      payoutMethod = await db()('user_payout_methods')
        .where({ userId, isDefault: true, isActive: true })
        .first();
      if (!payoutMethod) return res.status(400).json({ message: 'No payout method configured. Please add one in Settings.' });
    }

    payoutDetails = payoutMethod.details;
    const fee = numericAmount * 0.01; // 1% fee (adjust as needed)

    // Trigger IntaSend Payout
    let trackingId = null;
    if (wallet.intasend_wallet_id) {
        try {
            let resp;
            if (payoutMethod.method === 'mpesa') {
                resp = await intasendService.mpesaB2c({
                    name: req.user.fullName || 'User',
                    account: payoutDetails,
                    amount: numericAmount,
                    narrative: `Payout for ${req.user.fullName || userId}`,
                    walletId: wallet.intasend_wallet_id
                });
            } else {
                // Bank payout (simplified, might need more details)
                resp = await intasendService.bankPayout({
                    name: req.user.fullName || 'User',
                    account: payoutDetails,
                    bankCode: payoutMethod.bankCode || '01',
                    amount: numericAmount,
                    narrative: `Payout for ${req.user.fullName || userId}`,
                    walletId: wallet.intasend_wallet_id
                });
            }
            trackingId = resp.tracking_id || (resp.payouts && resp.payouts[0] ? resp.payouts[0].tracking_id : null);
        } catch (e) {
            return res.status(500).json({ message: `IntaSend Payout failed: ${e.message}` });
        }
    }

    const [newPayout] = await db()('payouts')
      .insert({
        userId,
        amount: numericAmount,
        fee,
        currency: finalCurrency,
        method: payoutMethod.method,
        details: trackingId || payoutDetails,
        status: 'Processing',
      })
      .returning('*');

    // Update local balance
    await db()('wallets')
        .where({ id: wallet.id })
        .decrement('balance', numericAmount + fee)
        .update({ updatedAt: db().fn.now() });

    res.status(201).json(newPayout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPayouts = async (req, res) => {
  try {
    const payouts = await db()('payouts')
      .where({ userId: req.user.id })
      .orderBy('createdAt', 'desc');
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal: get payouts for a user
export const internalGetPayouts = async (req, res) => {
  try {
    const { userId, page = 1, limit = 50 } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    
    const uid = parseInt(userId);
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    const payouts = await db()('payouts')
      .where({ userId: uid })
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);
    
    const countResult = await db()('payouts').where({ userId: uid }).count('* as count').first();
    const total = parseInt(countResult.count) || 0;
    
    res.json({ payouts, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { requestPayout, getMyPayouts, internalGetPayouts };
