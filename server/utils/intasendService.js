import IntaSend from 'intasend-node';
import dotenv from 'dotenv';

dotenv.config();

const getClient = () => {
    const publishableKey = process.env.INTASEND_PUBLISHABLE_KEY;
    const secretKey = process.env.INTASEND_SECRET_KEY;
    const testMode = process.env.INTASEND_TEST_MODE === 'true';

    if (!publishableKey || !secretKey) {
        throw new Error('INTASEND_PUBLISHABLE_KEY and INTASEND_SECRET_KEY must be defined in environment variables');
    }

    return new IntaSend(publishableKey, secretKey, testMode);
};

/**
 * Trigger M-Pesa STK Push directly to user's phone
 * Kenya-focused — phone must be in 254XXXXXXXXX format
 */
const mpesaStkPush = async ({ phone, email, amount, firstName, lastName, apiRef, host }) => {
    try {
        const intasend = getClient();
        const collection = intasend.collection();

        const response = await collection.mpesaStkPush({
            first_name: firstName || 'Customer',
            last_name: lastName || '',
            email: email || 'customer@ripplify.io',
            host: host || process.env.BASE_URL || 'https://ripplify.io',
            amount: parseFloat(amount),
            phone_number: phone,
            api_ref: apiRef,
        });

        console.log('IntaSend STK Push Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend STK Push Error:', error);
        const errMsg = error?.message || error?.toString() || 'M-Pesa STK Push failed';
        throw new Error(errMsg);
    }
};

/**
 * Generate a checkout link for card/bank payments
 * Supports all IntaSend payment methods — user is redirected to hosted checkout
 */
const checkoutCharge = async ({ email, firstName, lastName, phone, amount, currency, apiRef, redirectUrl, method, host }) => {
    try {
        const intasend = getClient();
        const collection = intasend.collection();

        const payload = {
            first_name: firstName || 'Customer',
            last_name: lastName || '',
            email: email || 'customer@ripplify.io',
            host: host || process.env.BASE_URL || 'https://ripplify.io',
            amount: parseFloat(amount),
            currency: currency || 'KES',
            api_ref: apiRef,
            redirect_url: redirectUrl,
        };

        // If a specific method is requested, add it
        if (method) {
            payload.method = method; // e.g., 'CARD-PAYMENT', 'M-PESA'
        }

        if (phone) {
            payload.phone_number = phone;
        }

        console.log('IntaSend Checkout Payload:', JSON.stringify(payload, null, 2));

        const response = await collection.charge(payload);
        console.log('IntaSend Checkout Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Checkout Error:', error);
        const errMsg = error?.message || error?.toString() || 'IntaSend checkout failed';
        throw new Error(errMsg);
    }
};

/**
 * Check payment status by invoice ID
 */
const checkPaymentStatus = async (invoiceId) => {
    try {
        const intasend = getClient();
        const collection = intasend.collection();

        const response = await collection.status(invoiceId);
        console.log('IntaSend Status Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Status Check Error:', error);
        const errMsg = error?.message || error?.toString() || 'Payment status check failed';
        throw new Error(errMsg);
    }
};

/**
 * Trigger M-Pesa B2C Payout
 */
const mpesaB2c = async ({ name, account, amount, narrative }) => {
    try {
        const intasend = getClient();
        const payouts = intasend.payouts();

        const response = await payouts.mpesa({
            currency: 'KES',
            transactions: [
                {
                    name: name || 'Customer',
                    account: account,
                    amount: parseFloat(amount).toString(), // IntaSend expects string or proper number
                    narrative: narrative || 'Payout from Ripplify'
                }
            ]
        });

        console.log('IntaSend B2C Payout Response:', JSON.stringify(response, null, 2));

        // Attempting to auto-approve if possible. Some IntaSend setups require 2FA checker.
        // We catch approve errors silently and return the initial response, as it might just need dashboard approval.
        try {
            await payouts.approve(response, false);
            console.log('IntaSend B2C Payout Auto-Approved successfully.');
        } catch (approveErr) {
            console.warn('IntaSend B2C Payout Approval requires manual action or failed:', approveErr?.message || approveErr);
        }

        return response;
    } catch (error) {
        console.error('IntaSend B2C Payout Error:', error);
        const errMsg = error?.message || error?.toString() || 'M-Pesa B2C Payout failed';
        throw new Error(errMsg);
    }
};

export default {
    mpesaStkPush,
    checkoutCharge,
    checkPaymentStatus,
    mpesaB2c,
};
