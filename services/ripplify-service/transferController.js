import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

const getAvailableBalance = async (userId) => {
  const links = await db()('payment_links').where({ userId }).select('totalEarnedValue');
  const totalEarned = links.reduce((acc, l) => acc + (parseFloat(l.totalEarnedValue) || 0), 0);

  const transfersResult = await db()('transfers')
    .where({ senderId: userId })
    .whereIn('status', ['Processing', 'Completed'])
    .sum(db().raw('amount + fee'));
  const transferSpent = parseFloat(transfersResult[0]?.sum || 0);

  const payoutsResult = await db()('payouts')
    .where({ userId })
    .whereIn('status', ['Processing', 'Completed'])
    .sum(db().raw('amount + fee'));
  const payoutSpent = parseFloat(payoutsResult[0]?.sum || 0);

  return totalEarned - transferSpent - payoutSpent;
};

export const sendTransfer = async (req, res) => {
  try {
    const { receiverId, receiverPhone, receiverEmail, amount, currency, method, note } = req.body;
    const senderId = req.user.id;

    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (!method) return res.status(400).json({ message: 'Payment method is required' });

    let fee = 0;
    if (method === 'mpesa') fee = numericAmount * 0.01;
    else if (method === 'bank') fee = numericAmount * 0.005;

    const totalDeduct = numericAmount + fee;
    const available = await getAvailableBalance(senderId);
    if (totalDeduct > available) {
      return res.status(400).json({ message: `Insufficient balance. Available: ${available.toFixed(2)}` });
    }

    let transferStatus = 'Completed';
    let externalRef = null;

    if (method === 'internal') {
      if (!receiverId) return res.status(400).json({ message: 'Receiver ID required for internal transfer' });
      transferStatus = 'Completed';
    } else if (['mpesa', 'bank'].includes(method)) {
      transferStatus = 'Processing';
    }

    const [transfer] = await db()('transfers')
      .insert({
        senderId,
        receiverId: receiverId || null,
        receiverPhone: receiverPhone || '',
        receiverEmail: receiverEmail || null,
        amount: numericAmount,
        fee,
        currency: currency || 'KES',
        method,
        status: transferStatus,
        note: note || '',
        externalRef,
      })
      .returning('*');

    res.status(201).json({ message: transferStatus === 'Processing' ? 'Transfer initiated' : 'Transfer successful', transfer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTransfers = async (req, res) => {
  try {
    const transfers = await db()('transfers')
      .where({ senderId: req.user.id })
      .orderBy('createdAt', 'desc');
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { sendTransfer, getMyTransfers };
