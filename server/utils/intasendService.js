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
 * Get a valid HTTPS URL for IntaSend callbacks
 * IntaSend requires HTTPS URLs, so we ensure we always return a valid URL
 */
const getValidHostUrl = () => {
    const baseUrl = process.env.BASE_URL || '';
    const frontendUrl = process.env.FRONTEND_URL || '';
    
    // Prefer HTTPS URLs
    if (frontendUrl && frontendUrl.startsWith('https://')) {
        return frontendUrl;
    }
    if (baseUrl && baseUrl.startsWith('https://')) {
        return baseUrl;
    }
    
    // Fallback to a valid HTTPS URL
    return 'https://ripplify.io';
};

/**
 * Trigger M-Pesa STK Push directly to user's phone
 * Kenya-focused — phone must be in 254XXXXXXXXX format
 */
const mpesaStkPush = async ({ phone, email, amount, firstName, lastName, apiRef, host }) => {
    try {
        const intasend = getClient();
        const collection = intasend.collection();

        // Ensure host is a valid HTTPS URL
        const validHost = (host && host.startsWith('https://')) ? host : getValidHostUrl();

        const response = await collection.mpesaStkPush({
            first_name: firstName || 'Customer',
            last_name: lastName || '',
            email: email || 'customer@ripplify.io',
            host: validHost,
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

        // Ensure host is a valid HTTPS URL
        const validHost = (host && host.startsWith('https://')) ? host : getValidHostUrl();

        // Ensure redirect_url is a valid HTTPS URL
        let validRedirectUrl = redirectUrl;
        if (!validRedirectUrl || !validRedirectUrl.startsWith('https://')) {
            validRedirectUrl = `${getValidHostUrl()}/pay/callback`;
        }

        const payload = {
            first_name: firstName || 'Customer',
            last_name: lastName || '',
            email: email || 'customer@ripplify.io',
            host: validHost,
            amount: parseFloat(amount),
            currency: currency || 'KES',
            api_ref: apiRef,
            redirect_url: validRedirectUrl,
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

/**
 * Trigger Bank Transfer Payout via PesaLink
 */
const bankPayout = async ({ name, account, bankCode, amount, narrative }) => {
    try {
        const intasend = getClient();
        const payouts = intasend.payouts();

        const response = await payouts.bank({
            currency: 'KES',
            transactions: [
                {
                    name: name || 'Customer',
                    account: account,
                    bank_code: bankCode,
                    amount: parseFloat(amount).toString(),
                    narrative: narrative || 'Bank Payout from Ripplify'
                }
            ]
        });

        console.log('IntaSend Bank Payout Response:', JSON.stringify(response, null, 2));

        // Auto-approve if possible
        try {
            await payouts.approve(response, false);
            console.log('IntaSend Bank Payout Auto-Approved successfully.');
        } catch (approveErr) {
            console.warn('IntaSend Bank Payout Approval requires manual action or failed:', approveErr?.message || approveErr);
        }

        return response;
    } catch (error) {
        console.error('IntaSend Bank Payout Error:', error);
        const errMsg = error?.message || error?.toString() || 'Bank Payout failed';
        throw new Error(errMsg);
    }
};

/**
 * Transfer to another IntaSend account (instant, no fees)
 */
const intasendTransfer = async ({ name, amount, narrative }) => {
    try {
        const intasend = getClient();
        const payouts = intasend.payouts();

        const response = await payouts.intasend({
            currency: 'KES',
            transactions: [
                {
                    name: name || 'Customer',
                    amount: parseFloat(amount).toString(),
                    narrative: narrative || 'Ripplify Transfer'
                }
            ]
        });

        console.log('IntaSend Internal Transfer Response:', JSON.stringify(response, null, 2));

        try {
            await payouts.approve(response, false);
        } catch (approveErr) {
            console.warn('IntaSend Transfer Approval requires manual action:', approveErr?.message || approveErr);
        }

        return response;
    } catch (error) {
        console.error('IntaSend Internal Transfer Error:', error);
        const errMsg = error?.message || error?.toString() || 'IntaSend transfer failed';
        throw new Error(errMsg);
    }
};

/**
 * Check payout status by tracking ID
 */
const checkPayoutStatus = async (trackingId) => {
    try {
        const intasend = getClient();
        const payouts = intasend.payouts();

        const response = await payouts.status({ tracking_id: trackingId });
        console.log('IntaSend Payout Status Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Payout Status Check Error:', error);
        throw new Error(error?.message || 'Payout status check failed');
    }
};

/**
 * Get all wallets from IntaSend
 */
const getWallets = async () => {
    try {
        const intasend = getClient();
        const wallets = intasend.wallets();

        const response = await wallets.list();
        console.log('IntaSend Wallets Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Get Wallets Error:', error);
        throw new Error(error?.message || 'Get wallets failed');
    }
};

/**
 * Get wallet details by ID
 */
const getWalletDetails = async (walletId) => {
    try {
        const intasend = getClient();
        const wallets = intasend.wallets();

        const response = await wallets.details(walletId);
        console.log('IntaSend Wallet Details Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Get Wallet Details Error:', error);
        throw new Error(error?.message || 'Get wallet details failed');
    }
};

/**
 * Get wallet transactions (for M-Pesa volume)
 */
const getWalletTransactions = async (walletId, period = 'month') => {
    try {
        const intasend = getClient();
        const wallets = intasend.wallets();

        const response = await wallets.transactions(walletId, period);
        console.log('IntaSend Wallet Transactions Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Get Wallet Transactions Error:', error);
        throw new Error(error?.message || 'Get wallet transactions failed');
    }
};

export default {
    mpesaStkPush,
    checkoutCharge,
    checkPaymentStatus,
    mpesaB2c,
    bankPayout,
    intasendTransfer,
    checkPayoutStatus,
    getWallets,
    getWalletDetails,
    getWalletTransactions,
};
