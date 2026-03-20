import { getDb } from '../config/db.js';
import crypto from 'crypto';

/**
 * Wallet Service for tracking balances and processing internal/external transfers.
 */
const walletService = {
    // Get all wallet balances for a user
    async getBalances(userId) {
        const db = getDb();
        return await db.all(`SELECT * FROM wallets WHERE userId = ?`, [userId]);
    },

    // Get specific currency balance for a user
    async getBalance(userId, currency, network) {
        const db = getDb();
        let wallet = await db.get(
            `SELECT * FROM wallets WHERE userId = ? AND currency_code = ? AND network = ?`,
            [userId, currency, network]
        );
        if (!wallet) {
            // Auto-create wallet if it doesn't exist
            const res = await db.run(
                `INSERT INTO wallets (userId, currency_code, network) VALUES (?, ?, ?)`,
                [userId, currency, network]
            );
            wallet = await db.get(`SELECT * FROM wallets WHERE id = ?`, res.lastID);
        }
        return wallet;
    },

    // Process internal transfer between two platform users
    async internalTransfer(senderId, receiverId, currency, network, amount) {
        if (amount <= 0) throw new Error("Amount must be greater than zero");
        if (senderId === receiverId) throw new Error("Sender and receiver cannot be the same");

        const db = getDb();
        
        // SQLite doesn't currently expose full BEGIN/COMMIT cleanly via sqlite3 library wrapper without manual driver management but we can do it via exec
        await db.run('BEGIN TRANSACTION');

        try {
            const senderWallet = await this.getBalance(senderId, currency, network);
            const receiverWallet = await this.getBalance(receiverId, currency, network);

            if (senderWallet.balance < amount) {
                throw new Error("Insufficient funds");
            }

            // Deduct sender
            await db.run(
                `UPDATE wallets SET balance = balance - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
                [amount, senderWallet.id]
            );

            // Credit receiver
            await db.run(
                `UPDATE wallets SET balance = balance + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
                [amount, receiverWallet.id]
            );

            // Record transaction
            const txToken = crypto.randomBytes(16).toString('hex');
            const res = await db.run(
                `INSERT INTO transactions (userId, senderId, receiverId, amount, currency, network, type, paymentMethod, status, trackingToken)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [senderId, senderId, receiverId, amount, currency, network, 'Internal Transfer', 'wallet', 'Completed', txToken]
            );

            await db.run('COMMIT');
            return res.lastID;
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    },

    // Deposit generic funds (fiat or crypto from external source)
    async deposit(userId, currency, network, amount, txHash = null, paymentMethod = 'external') {
        if (amount <= 0) throw new Error("Deposit amount must be positive");
        
        const db = getDb();
        await db.run('BEGIN TRANSACTION');
        
        try {
            const wallet = await this.getBalance(userId, currency, network);
            
            await db.run(
                `UPDATE wallets SET balance = balance + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
                [amount, wallet.id]
            );

            const txToken = crypto.randomBytes(16).toString('hex');
            const res = await db.run(
                `INSERT INTO transactions (userId, receiverId, amount, currency, network, type, paymentMethod, status, trackingToken, txHash)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, userId, amount, currency, network, 'Deposit', paymentMethod, 'Completed', txToken, txHash]
            );

            await db.run('COMMIT');
            return res.lastID;
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    },
    
    // Process external withdrawal request
    async withdraw(userId, currency, network, amount, destination) {
        if (amount <= 0) throw new Error("Withdrawal amount must be positive");
        
        const db = getDb();
        await db.run('BEGIN TRANSACTION');
        
        try {
            const wallet = await this.getBalance(userId, currency, network);
            
            if (wallet.balance < amount) {
                 throw new Error("Insufficient funds");
            }
            
            // Lock funds during processing
            await db.run(
                `UPDATE wallets SET balance = balance - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
                [amount, wallet.id]
            );

            const txToken = crypto.randomBytes(16).toString('hex');
            const metadata = JSON.stringify({ destination });
            
            const res = await db.run(
                `INSERT INTO transactions (userId, senderId, amount, currency, network, type, paymentMethod, status, trackingToken, metadata)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, userId, amount, currency, network, 'Withdrawal', 'external', 'Processing', txToken, metadata]
            );

            await db.run('COMMIT');
            return res.lastID;
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    }
};

export default walletService;
