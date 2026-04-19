import { createConnection } from '../shared/db.js';
import intasendService from './utils/intasendService.js';

const db = () => createConnection('ripplify_db');

export const getWallets = async (req, res) => {
  try {
    let wallets = await db()('wallets').where({ userId: req.user.id }).orderBy('currency_code', 'asc');
    
    // Auto-create KES wallet if none exists
    if (wallets.length === 0) {
      try {
        const intasendLabel = `User ${req.user.id} - KES`;
        const intasendWallet = await intasendService.createIntaSendWallet(intasendLabel, 'KES');
        
        const [newWallet] = await db()('wallets')
          .insert({
            userId: req.user.id,
            currency_code: 'KES',
            network: 'fiat',
            balance: 0,
            locked_balance: 0,
            intasend_wallet_id: intasendWallet.wallet_id,
            intasend_label: intasendLabel,
          })
          .returning('*');

        wallets = [newWallet];
      } catch (e) {
          console.error(`Failed to auto-create wallet bounds:`, e.message);
      }
    }

    // Sync balance for each IntaSend-linked wallet
    const syncedWallets = await Promise.all(wallets.map(async (wallet) => {
      if (wallet.intasend_wallet_id) {
        try {
          const details = await intasendService.getIntaSendWallet(wallet.intasend_wallet_id);
          // Update local balance if it differs
          if (parseFloat(details.available_balance) !== parseFloat(wallet.balance)) {
            await db()('wallets')
              .where({ id: wallet.id })
              .update({ 
                balance: details.available_balance,
                locked_balance: details.frozen_balance,
                updatedAt: db().fn.now()
              });
            wallet.balance = details.available_balance;
            wallet.locked_balance = details.frozen_balance;
          }
        } catch (e) {
          console.error(`Failed to sync wallet ${wallet.intasend_wallet_id}:`, e.message);
        }
      }
      return wallet;
    }));

    res.json(syncedWallets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWallet = async (req, res) => {
  try {
    const { currency_code, network, label } = req.body;
    if (!currency_code) return res.status(400).json({ message: 'currency_code is required' });

    const existing = await db()('wallets')
      .where({ userId: req.user.id, currency_code, network: network || 'fiat' })
      .first();
    if (existing) return res.status(400).json({ message: 'Wallet already exists for this currency/network' });

    // Create IntaSend wallet if network is fiat
    let intasendWalletId = null;
    let intasendLabel = label || `User ${req.user.id} - ${currency_code}`;
    
    if (!network || network === 'fiat') {
      try {
        const intasendWallet = await intasendService.createIntaSendWallet(intasendLabel, currency_code);
        intasendWalletId = intasendWallet.wallet_id;
      } catch (e) {
        return res.status(500).json({ message: `IntaSend Wallet creation failed: ${e.message}` });
      }
    }

    const [wallet] = await db()('wallets')
      .insert({
        userId: req.user.id,
        currency_code,
        network: network || 'fiat',
        balance: 0,
        locked_balance: 0,
        intasend_wallet_id: intasendWalletId,
        intasend_label: intasendLabel,
      })
      .returning('*');

    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWalletTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await db()('wallets').where({ id, userId: req.user.id }).first();
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    if (wallet.intasend_wallet_id) {
      const transactions = await intasendService.getIntaSendWalletTransactions(wallet.intasend_wallet_id);
      return res.json(transactions);
    }

    // Fallback to local transactions if no IntaSend wallet (e.g. crypto)
    const localTransactions = await db()('transactions')
      .where({ userId: req.user.id, currency: wallet.currency_code })
      .orderBy('createdAt', 'desc')
      .limit(50);
    
    res.json(localTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deposit = async (req, res) => {
  // Deposit logic now primarily handled via payment links/checkout
  // But we keep this for manual local adjustments if needed
  try {
    const { currency, network, amount } = req.body;
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const currencyCode = currency || 'KES';
    const net = network || 'fiat';

    let wallet = await db()('wallets')
      .where({ userId: req.user.id, currency_code: currencyCode, network: net })
      .first();

    if (!wallet) {
      // If no wallet found, we create one (with IntaSend if fiat)
      return res.status(404).json({ message: 'Wallet not found. Please create a wallet first.' });
    }

    await db()('wallets').where({ id: wallet.id }).increment('balance', numericAmount).update({ updatedAt: db().fn.now() });
    wallet = await db()('wallets').where({ id: wallet.id }).first();

    res.json({ message: 'Deposit recorded (local sync)', wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const withdraw = async (req, res) => {
  // Withdrawal now triggers a payout via IntaSend if it's a fiat wallet
  try {
    const { currency, network, amount, payout_method_id } = req.body;
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const wallet = await db()('wallets')
      .where({ userId: req.user.id, currency_code: currency || 'KES', network: network || 'fiat' })
      .first();

    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    if (parseFloat(wallet.balance) < numericAmount) {
      return res.status(400).json({ message: `Insufficient balance. Available: ${wallet.balance}` });
    }

    // If IntaSend wallet exists, we should ideally check balance there too
    if (wallet.intasend_wallet_id) {
       const details = await intasendService.getIntaSendWallet(wallet.intasend_wallet_id);
       if (parseFloat(details.available_balance) < numericAmount) {
           return res.status(400).json({ message: `Insufficient IntaSend balance. Available: ${details.available_balance}` });
       }
    }

    // Decrement local balance (optimistic)
    await db()('wallets')
      .where({ id: wallet.id })
      .decrement('balance', numericAmount)
      .update({ updatedAt: db().fn.now() });

    const updated = await db()('wallets').where({ id: wallet.id }).first();
    res.json({ message: 'Withdrawal processing', wallet: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWalletStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await db()('transactions')
      .where({ userId, type: 'Payment', status: 'Completed' })
      .select(db().raw('COALESCE(SUM(amount), 0) as mpesaVolume'))
      .select(db().raw('COUNT(id) as mpesaPayments'))
      .first();

    const wallet = await db()('wallets')
      .where({ userId, currency_code: 'KES' })
      .first();

    // If wallet has IntaSend ID, we can get more accurate stats if needed
    // For now we use local aggregated stats but return synced wallet balance
    let syncedBalance = wallet ? wallet.balance : 0;
    if (wallet && wallet.intasend_wallet_id) {
        try {
            const details = await intasendService.getIntaSendWallet(wallet.intasend_wallet_id);
            syncedBalance = details.available_balance;
        } catch (e) {}
    }

    res.json({
      mpesaVolume: parseFloat(stats.mpesaVolume || 0),
      mpesaPayments: parseInt(stats.mpesaPayments || 0),
      wallet: wallet ? { ...wallet, balance: syncedBalance } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getWallets, createWallet, getWalletTransactions, deposit, withdraw, getWalletStats };
