import { getDb } from '../config/db.js';
import walletService from './walletService.js';
import crypto from 'crypto';

/**
 * Payment Service acting as a router for different payment methods.
 */
const paymentService = {
    // Top-level Create Checkout Intent
    async createCheckoutIntent(userId, amount, currency, paymentMethod, metadata = {}) {
        const db = getDb();
        const clientSecret = crypto.randomBytes(32).toString('hex'); // Mock secret for now
        
        const res = await db.run(
            `INSERT INTO payment_intents (userId, amount, currency, paymentMethod, status, clientSecret, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, amount, currency, paymentMethod, 'pending', clientSecret, JSON.stringify(metadata)]
        );
        
        return {
            intentId: res.lastID,
            clientSecret,
            amount,
            currency,
            paymentMethod
        };
    },

    // Confirm Payment
    async confirmPayment(intentId, txHash = null) {
        const db = getDb();
        const intent = await db.get(`SELECT * FROM payment_intents WHERE id = ?`, [intentId]);
        
        if (!intent) throw new Error("Payment intent not found");
        if (intent.status === 'succeeded') throw new Error("Payment already succeeded");
        
        await db.run('BEGIN TRANSACTION');
        try {
            // Update Intent
            await db.run(
                `UPDATE payment_intents SET status = 'succeeded', txHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
                [txHash, intentId]
            );
            
            // Deposit the funds into the user's wallet
            // The network defaults to "fiat" for card/mpesa, or the metadata network for crypto
            const meta = intent.metadata ? JSON.parse(intent.metadata) : {};
            const network = meta.network || 'fiat';
            
            await walletService.deposit(intent.userId, intent.currency, network, intent.amount, txHash, intent.paymentMethod);
            
            await db.run('COMMIT');
            return true;
        } catch (error) {
            await db.run('ROLLBACK');
            throw error;
        }
    },
    
    // Unified webhook handler for external providers (Stripe, M-Pesa callbacks)
    async handleWebhook(provider, payload) {
        // Here we would parse provider specific payload
        // e.g., if provider === 'stripe'
        
        let intentId;
        let pStatus = 'failed';
        let txHash = null;

        // Mock parsing logic
        if (provider === 'mock_provider') {
            intentId = payload.intentId;
            pStatus = payload.status;
            txHash = payload.txHash || null;
        }
        
        if (pStatus === 'succeeded') {
            await this.confirmPayment(intentId, txHash);
        }
    }
};

export default paymentService;
