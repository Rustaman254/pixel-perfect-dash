import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');

export const getWallets = async (req, res) => {
  try {
    const wallets = await db()('wallets').where({ userId: req.user.id }).orderBy('currency_code', 'asc');
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWallet = async (req, res) => {
  try {
    const { currency_code, network } = req.body;
    if (!currency_code) return res.status(400).json({ message: 'currency_code is required' });

    const existing = await db()('wallets')
      .where({ userId: req.user.id, currency_code, network: network || 'fiat' })
      .first();
    if (existing) return res.status(400).json({ message: 'Wallet already exists for this currency/network' });

    const [wallet] = await db()('wallets')
      .insert({
        userId: req.user.id,
        currency_code,
        network: network || 'fiat',
        balance: 0,
        locked_balance: 0,
      })
      .returning('*');

    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deposit = async (req, res) => {
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
      const [newWallet] = await db()('wallets')
        .insert({ userId: req.user.id, currency_code: currencyCode, network: net, balance: numericAmount })
        .returning('*');
      wallet = newWallet;
    } else {
      await db()('wallets').where({ id: wallet.id }).increment('balance', numericAmount).update({ updatedAt: db().fn.now() });
      wallet = await db()('wallets').where({ id: wallet.id }).first();
    }

    res.json({ message: 'Deposit successful', wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const withdraw = async (req, res) => {
  try {
    const { currency, network, amount } = req.body;
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const currencyCode = currency || 'KES';
    const net = network || 'fiat';

    const wallet = await db()('wallets')
      .where({ userId: req.user.id, currency_code: currencyCode, network: net })
      .first();

    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    if (parseFloat(wallet.balance) < numericAmount) {
      return res.status(400).json({ message: `Insufficient balance. Available: ${wallet.balance}` });
    }

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

export default { getWallets, createWallet, deposit, withdraw };
