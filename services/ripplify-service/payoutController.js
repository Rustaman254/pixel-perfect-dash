import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

export const requestPayout = async (req, res) => {
  try {
    const { amount, payoutMethodId, method, details, currency } = req.body;
    const userId = req.user.id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const numericAmount = parseFloat(amount);

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

    // Calculate available balance from payment links
    const links = await db()('payment_links').where({ userId });
    const totalEarned = links.reduce((acc, l) => acc + (parseFloat(l.totalEarnedValue) || 0), 0);

    const payouts = await db()('payouts').where({ userId }).whereIn('status', ['Processing', 'Completed']);
    const withdrawn = payouts.reduce((acc, p) => acc + parseFloat(p.amount || 0) + parseFloat(p.fee || 0), 0);

    const transfersResult = await db()('transfers')
      .where({ senderId: userId })
      .whereIn('status', ['Processing', 'Completed'])
      .sum(db().raw('amount + fee'));
    const transferSpent = parseFloat(transfersResult[0]?.sum || 0);

    const available = totalEarned - withdrawn - transferSpent;

    if (numericAmount > available) {
      return res.status(400).json({ message: `Insufficient balance. Available: ${available.toFixed(2)}` });
    }

    const fee = numericAmount * 0.01;
    const detailsDisplay = payoutDetails;

    const [newPayout] = await db()('payouts')
      .insert({
        userId,
        amount: numericAmount,
        fee,
        currency: currency || 'KES',
        method: payoutMethod.method,
        details: detailsDisplay,
        status: 'Processing',
      })
      .returning('*');

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
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const payouts = await db()('payouts').where({ userId: parseInt(userId) }).orderBy('createdAt', 'desc');
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { requestPayout, getMyPayouts, internalGetPayouts };
