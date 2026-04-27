import walletService from '../utils/walletService.js';
import cryptoService from '../utils/cryptoService.js';
import getPaymentProvider from '../utils/paymentProviderFactory.js';

const provider = getPaymentProvider();

export const getWallets = async (req, res) => {
    try {
        const balances = await walletService.getBalances(req.user.id);
        
        // Also fetch provider wallet data
        let intasendWallets = [];
        try {
            intasendWallets = await provider.getWallets();
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
            intasendWallets = await provider.getWallets();
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
                const transactions = await provider.getWalletTransactions(kesWallet.wallet_id, 'month');
                
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

export const createWallet = async (req, res) => {
    try {
        const { currency, network } = req.body;
        const currency_code = currency || req.body.currency_code || 'KES';
        const finalNetwork = network || req.body.network || 'fiat';
        
        // Create the wallet in local database (IntaSend provides default wallet automatically)
        const wallet = await walletService.getBalance(req.user.id, currency_code, finalNetwork);
        
        res.status(201).json({ 
            message: "Wallet created successfully", 
            wallet: {
                id: wallet.id,
                currency_code: wallet.currency_code,
                network: wallet.network,
                balance: wallet.balance
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const depositFunds = async (req, res) => {
    try {
        console.log('[DEPOSIT] Request body:', JSON.stringify(req.body));
        const { currency, network, amount, paymentMethod, phone, method } = req.body;
        
        // Handle legacy field names from frontend
        const finalAmount = amount || req.body.amount || req.body.value;
        const finalCurrency = currency || req.body.currency_code || 'KES';
        const finalNetwork = network || req.body.network || 'fiat';
        const finalPaymentMethod = paymentMethod || method || req.body.paymentMethod || 'checkout';
        console.log('[DEPOSIT] finalAmount:', finalAmount, 'finalCurrency:', finalCurrency, 'finalPaymentMethod:', finalPaymentMethod);
        
        if (!finalAmount || parseFloat(finalAmount) <= 0) {
            console.log('[DEPOSIT] Invalid amount, finalAmount:', finalAmount);
            return res.status(400).json({ message: "Amount is required and must be greater than 0" });
        }
        
        // For crypto, we return the deposit address instead
        if (finalPaymentMethod === 'crypto') {
            const depositInfo = await cryptoService.getDepositAddress(req.user.id, finalNetwork);
            return res.json({ message: "Deposit address generated", depositInfo });
        }
        
        // For fiat - use IntaSend checkout or STK push
        const provider = getPaymentProvider();
        
        if (finalPaymentMethod === 'mpesa') {
            // STK Push for M-Pesa
            try {
                const result = await provider.mpesaStkPush({
                    phone: phone || req.user.phone,
                    email: req.user.email,
                    amount: finalAmount,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    apiRef: `deposit_${Date.now()}`,
                    host: process.env.FRONTEND_URL || process.env.BASE_URL
                });
                return res.json({ 
                    message: "STK push initiated", 
                    data: result,
                    invoiceId: result?.invoice?.id
                });
            } catch (stkError) {
                console.log('[DEPOSIT] STK Push failed, falling back to checkout:', stkError.message);
                // Fall through to checkout
            }
        }
        
        // Default to checkout (card/mobile money via redirect)
        try {
            const result = await provider.checkoutCharge({
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                phone: phone || req.user.phone,
                amount: finalAmount,
                currency: finalCurrency,
                apiRef: `deposit_${Date.now()}`,
                redirectUrl: `${process.env.FRONTEND_URL}/pay/callback`,
                method: finalPaymentMethod === 'card' ? 'CARD-PAYMENT' : (finalPaymentMethod === 'mpesa' ? 'M-PESA' : undefined)
            });
            
            if (result?.data?.url) {
                return res.json({ 
                    message: "Payment link created", 
                    checkoutUrl: result.data.url,
                    data: result
                });
            }
            
            return res.json({ 
                message: "Checkout initiated", 
                data: result
            });
        } catch (checkoutError) {
            console.log('[DEPOSIT] Checkout also failed:', checkoutError.message);
            throw checkoutError;
        }
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
