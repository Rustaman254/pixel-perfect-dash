import walletService from '../utils/walletService.js';
import cryptoService from '../utils/cryptoService.js';

export const getWallets = async (req, res) => {
    try {
        const balances = await walletService.getBalances(req.user.id);
        res.json(balances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const depositFunds = async (req, res) => {
    try {
        const { currency, network, amount, paymentMethod } = req.body;
        
        // For crypto, we return the deposit address instead
        if (paymentMethod === 'crypto') {
            const depositInfo = await cryptoService.getDepositAddress(req.user.id, network);
            return res.json({ message: "Deposit address generated", depositInfo });
        }
        
        // For fiat (mock simulating instant deposit for testing)
        // In reality, this would trigger an M-Pesa STK push or Card flow and deposit happens via webhook
        const txId = await walletService.deposit(req.user.id, currency, network || 'fiat', parseFloat(amount), null, paymentMethod || 'fiat');
        res.status(200).json({ message: "Deposit successful", txId });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const withdrawFunds = async (req, res) => {
    try {
        const { currency, network, amount, destination } = req.body;
        const txId = await walletService.withdraw(req.user.id, currency, network || 'fiat', parseFloat(amount), destination);
        res.status(200).json({ message: "Withdrawal processing", txId });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const internalTransfer = async (req, res) => {
    try {
        const { receiverId, currency, network, amount } = req.body;
        const txId = await walletService.internalTransfer(req.user.id, parseInt(receiverId), currency, network || 'fiat', parseFloat(amount));
        res.status(200).json({ message: "Transfer successful", txId });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
