import walletService from '../utils/walletService.js';
import cryptoService from '../utils/cryptoService.js';
import intasendService from '../utils/intasendService.js';

export const getWallets = async (req, res) => {
    try {
        const balances = await walletService.getBalances(req.user.id);
        
        // Also fetch IntaSend wallet data
        let intasendWallets = [];
        try {
            intasendWallets = await intasendService.getWallets();
        } catch (err) {
            console.error('Failed to fetch IntaSend wallets:', err.message);
        }

        // Merge the data - add intasend_balance to each local wallet
        const mergedBalances = balances.map(wallet => {
            const isKes = wallet.currency_code === 'KES';
            const intasendWallet = isKes && Array.isArray(intasendWallets) 
                ? intasendWallets.find(w => w.currency === 'KES') 
                : null;
            
            return {
                ...wallet,
                intasend_balance: intasendWallet ? {
                    current_balance: parseFloat(intasendWallet.current_balance) || 0,
                    available_balance: parseFloat(intasendWallet.available_balance) || 0,
                    wallet_id: intasendWallet.wallet_id,
                } : null
            };
        });

        res.json(mergedBalances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWalletStats = async (req, res) => {
    try {
        // Get IntaSend wallets to find KES wallet
        let intasendWallets = [];
        try {
            intasendWallets = await intasendService.getWallets();
        } catch (err) {
            console.error('Failed to fetch IntaSend wallets:', err.message);
        }

        const kesWallet = Array.isArray(intasendWallets) 
            ? intasendWallets.find(w => w.currency === 'KES') 
            : null;

        let mpesaVolume = 0;
        let mpesaPayments = 0;

        if (kesWallet?.wallet_id) {
            try {
                const transactions = await intasendService.getWalletTransactions(kesWallet.wallet_id, 'month');
                
                // Filter for incoming payments (M-Pesa deposits)
                if (Array.isArray(transactions)) {
                    mpesaPayments = transactions.filter(t => 
                        t.type === 'credit' || t.type === 'incoming' || t.status === 'completed'
                    ).length;
                    
                    mpesaVolume = transactions
                        .filter(t => t.type === 'credit' || t.type === 'incoming' || t.status === 'completed')
                        .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
                }
            } catch (err) {
                console.error('Failed to fetch IntaSend wallet transactions:', err.message);
            }
        }

        res.json({
            mpesaVolume,
            mpesaPayments,
            wallet: kesWallet ? {
                current_balance: parseFloat(kesWallet.current_balance) || 0,
                available_balance: parseFloat(kesWallet.available_balance) || 0,
                wallet_id: kesWallet.wallet_id,
            } : null
        });
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
