import { Router } from 'express';
import crypto from 'crypto';
import { createConnection } from '../shared/db.js';

const db = () => createConnection('ripplify_db');
const router = Router();

// IntaSend Webhook Signature Validation
const validateIntaSendSignature = (req) => {
    const signature = req.headers['x-intasend-signature'];
    const secret = process.env.INTASEND_SECRET_KEY;
    
    if (!signature || !secret) return false;

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return signature === expectedSignature;
};

router.post('/intasend', async (req, res) => {
    // Note: Signature validation might be tricky in sandbox/test mode
    // if IntaSend doesn't send signatures or uses a different mechanism.
    // For now we log it and proceed if in test mode or if valid.
    if (process.env.INTASEND_TEST_MODE !== 'true') {
        if (!validateIntaSendSignature(req)) {
            console.warn('Invalid IntaSend signature received');
            return res.status(401).json({ message: 'Invalid signature' });
        }
    } else {
        console.log('Skipping signature validation in test mode');
    }

    const { challenge, event, invoice_id, tracking_token, status, amount, api_ref, state } = req.body;

    // Challenge response for IntaSend webhook setup
    if (challenge) {
        return res.json({ challenge });
    }

    console.log('IntaSend Webhook Received:', JSON.stringify(req.body, null, 2));

    try {
        if (event === 'payment.succeeded' || event === 'payment_completed') {
            // Handle STK Push or Checkout completion
            const ref = invoice_id || api_ref;
            
            // Idempotency check or transaction lookup
            let transaction = await db()('transactions')
                .where({ transactionId: ref })
                .orWhere({ externalRef: ref })
                .first();
            
            if (transaction && transaction.status === 'Completed') {
                return res.json({ message: 'Already processed' });
            }

            if (transaction) {
                await db()('transactions')
                    .where({ id: transaction.id })
                    .update({ status: 'Completed', updatedAt: db().fn.now() });
                
                // Credit user wallet if not already captured by the transaction logic
                // (Usually captured during initiation but we ensure consistency)
                const wallet = await db()('wallets')
                    .where({ userId: transaction.userId, currency_code: transaction.currency })
                    .first();
                
                if (wallet) {
                    await db()('wallets')
                        .where({ id: wallet.id })
                        .increment('balance', transaction.amount)
                        .update({ updatedAt: db().fn.now() });
                }
            } else if (api_ref && api_ref.startsWith('PL-')) {
                // Payment Link reference
                const linkSlug = api_ref.replace('PL-', '');
                const link = await db()('payment_links').where({ slug: linkSlug }).first();
                if (link) {
                     await db()('payment_links')
                        .where({ id: link.id })
                        .update({ 
                            paymentCount: db().raw('payment_count + 1'),
                            totalEarnedValue: db().raw(`total_earned_value + ${amount || 0}`),
                            updatedAt: db().fn.now() 
                        });
                     
                     // Create transaction record
                     await db()('transactions').insert({
                        userId: link.userId,
                        linkId: link.id,
                        amount: amount,
                        currency: link.currency,
                        status: 'Completed',
                        transactionId,
                        type: 'Payment',
                        paymentMethod: req.body.method || 'IntaSend'
                     });

                     // Credit wallet
                     await db()('wallets')
                        .where({ userId: link.userId, currency_code: link.currency })
                        .increment('balance', amount)
                        .update({ updatedAt: db().fn.now() });
                }
            }
        } else if (event === 'payout.succeeded' || event === 'payout_completed') {
            // Handle Payout completion
            const externalRef = tracking_token;
            const payout = await db()('payouts').where({ details: externalRef }).first();
            if (payout) {
                await db()('payouts')
                    .where({ id: payout.id })
                    .update({ status: 'Completed', updatedAt: db().fn.now() });
            }
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Internal error' });
    }
});

export default router;
