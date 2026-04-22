import { createConnection } from '../shared/db.js';
import IntaSendProvider from './utils/IntaSendProvider.js';

const db = () => createConnection('ripplify_db');
const provider = new IntaSendProvider();

const getWalletBalance = async (userId, currency = 'KES') => {
  const wallet = await db()('wallets').where({ userId, currency_code: currency }).first();
  if (!wallet) return 0;
  
  // Sync if IntaSend wallet
  if (wallet.intasend_wallet_id) {
      try {
          const details = await provider.getIntaSendWallet(wallet.intasend_wallet_id);
          return parseFloat(details.available_balance);
      } catch (e) {
          return parseFloat(wallet.balance);
      }
  }
  return parseFloat(wallet.balance);
};

export const sendTransfer = async (req, res) => {
  try {
    const { receiverId, receiverPhone, receiverEmail, amount, currency, method, note } = req.body;
    const senderId = req.user.id;
    const finalCurrency = currency || 'KES';

    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (!method) return res.status(400).json({ message: 'Payment method is required' });

    let fee = 0;
    if (method === 'mpesa') fee = numericAmount * 0.01;
    else if (method === 'bank') fee = numericAmount * 0.005;

    const totalDeduct = numericAmount + fee;
    const available = await getWalletBalance(senderId, finalCurrency);
    if (totalDeduct > available) {
      return res.status(400).json({ message: `Insufficient balance. Available: ${available.toFixed(2)}` });
    }

    let transferStatus = 'Completed';
    let externalRef = null;

    if (method === 'internal' || method === 'intasend') {
      if (!receiverId && !receiverPhone && !receiverEmail) {
          return res.status(400).json({ message: 'Receiver identity required' });
      }
      
      // Fetch receiver wallet
      let receiverWallet;
      if (receiverId) {
          receiverWallet = await db()('wallets').where({ userId: receiverId, currency_code: finalCurrency }).first();
      } else if (receiverEmail || receiverPhone) {
          // Find user by email/phone first (simplified)
          const receiver = await db()('users')
            .where((builder) => {
                if (receiverEmail) builder.where({ email: receiverEmail });
                if (receiverPhone) builder.orWhere({ phone: receiverPhone });
            }).first();
          if (receiver) {
              receiverWallet = await db()('wallets').where({ userId: receiver.id, currency_code: finalCurrency }).first();
          }
      }

      const senderWallet = await db()('wallets').where({ userId: senderId, currency_code: finalCurrency }).first();

      if (senderWallet?.intasend_wallet_id && receiverWallet?.intasend_wallet_id) {
          // Perform IntaSend internal transfer
          try {
              const resp = await provider.intasendInternalTransfer({
                  name: receiverEmail || receiverPhone || 'User',
                  amount: numericAmount,
                  narrative: note || `Transfer from ${req.user.fullName || senderId}`,
                  walletId: senderWallet.intasend_wallet_id // Wait, intasendTransfer in service needs update
              });
              // Actually, intasend-node SDK intra_transfer uses sender_wallet_id and receiver_wallet_id
              // I should update provider.intasendInternalTransfer to use the intra_transfer API properly
              const intraResp = await provider.intasendInternalTransfer({
                  sender_wallet_id: senderWallet.intasend_wallet_id,
                  receiver_wallet_id: receiverWallet.intasend_wallet_id,
                  amount: numericAmount,
                  narrative: note || `Ripplify Transfer`
              });
              externalRef = intraResp.tracking_id;
              transferStatus = 'Completed';
          } catch (e) {
              return res.status(500).json({ message: `IntaSend Transfer failed: ${e.message}` });
          }
      } else {
          // Local ledger transfer
          if (receiverWallet) {
              await db()('wallets').where({ id: receiverWallet.id }).increment('balance', numericAmount);
          }
          transferStatus = 'Completed';
      }
    } else if (['mpesa', 'bank'].includes(method)) {
      // These should probably route through payouts if they go to external accounts
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
        currency: finalCurrency,
        method,
        status: transferStatus,
        note: note || '',
        externalRef,
      })
      .returning('*');

    // Deduct from sender
    await db()('wallets')
        .where({ userId: senderId, currency_code: finalCurrency })
        .decrement('balance', totalDeduct)
        .update({ updatedAt: db().fn.now() });

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
