import IntaSend from 'intasend-node';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const debugLog = (...args) => { if (!isProd) console.log(...args); };

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
const mpesaStkPush = async ({ phone, email, amount, firstName, lastName, apiRef, host, walletId }) => {
    try {
        const intasend = getClient();
        const collection = intasend.collection();

        // Ensure host is a valid HTTPS URL
        const validHost = (host && host.startsWith('https://')) ? host : getValidHostUrl();

        const payload = {
            first_name: firstName || 'Customer',
            last_name: lastName || '',
            email: email || 'customer@ripplify.io',
            host: validHost,
            amount: parseFloat(amount),
            phone_number: phone,
            api_ref: apiRef,
        };

        if (walletId) {
            payload.wallet_id = walletId;
        }

        const response = await collection.mpesaStkPush(payload);

        debugLog('IntaSend STK Push Response:', JSON.stringify(response, null, 2));
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
const checkoutCharge = async ({ email, firstName, lastName, phone, amount, currency, apiRef, redirectUrl, method, host, walletId }) => {
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

        if (walletId) {
            payload.wallet_id = walletId;
        }

        // If a specific method is requested, add it
        if (method) {
            payload.method = method; // e.g., 'CARD-PAYMENT', 'M-PESA'
        }

        if (phone) {
            payload.phone_number = phone;
        }

        debugLog('IntaSend Checkout Payload:', JSON.stringify(payload, null, 2));

        const response = await collection.charge(payload);
        debugLog('IntaSend Checkout Response:', JSON.stringify(response, null, 2));
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
        debugLog('IntaSend Status Response:', JSON.stringify(response, null, 2));
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
const mpesaB2c = async ({ name, account, amount, narrative, walletId }) => {
    try {
        const intasend = getClient();
        const payouts = intasend.payouts();

        const payload = {
            currency: 'KES',
            transactions: [
                {
                    name: name || 'Customer',
                    account: account,
                    amount: parseFloat(amount).toString(), // IntaSend expects string or proper number
                    narrative: narrative || 'Payout from Ripplify'
                }
            ]
        };

        if (walletId) {
            payload.wallet_id = walletId;
        }

        const response = await payouts.mpesa(payload);

        debugLog('IntaSend B2C Payout Response:', JSON.stringify(response, null, 2));

        // Attempting to auto-approve if possible. Some IntaSend setups require 2FA checker.
        try {
            await payouts.approve(response, false);
            debugLog('IntaSend B2C Payout Auto-Approved successfully.');
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
const bankPayout = async ({ name, account, bankCode, amount, narrative, walletId }) => {
    try {
        const intasend = getClient();
        const payouts = intasend.payouts();

        const payload = {
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
        };

        if (walletId) {
            payload.wallet_id = walletId;
        }

        const response = await payouts.bank(payload);

        debugLog('IntaSend Bank Payout Response:', JSON.stringify(response, null, 2));

        // Auto-approve if possible
        try {
            await payouts.approve(response, false);
            debugLog('IntaSend Bank Payout Auto-Approved successfully.');
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
const intasendTransfer = async ({ name, amount, narrative, walletId }) => {
    try {
        const intasend = getClient();
        const payouts = intasend.payouts();

        const payload = {
            currency: 'KES',
            transactions: [
                {
                    name: name || 'Customer',
                    amount: parseFloat(amount).toString(),
                    narrative: narrative || 'Ripplify Transfer'
                }
            ]
        };

        if (walletId) {
            payload.wallet_id = walletId;
        }

        const response = await payouts.intasend(payload);

        debugLog('IntaSend Internal Transfer Response:', JSON.stringify(response, null, 2));

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
        debugLog('IntaSend Payout Status Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Payout Status Check Error:', error);
        throw new Error(error?.message || 'Payout status check failed');
    }
};

/**
 * Create a new working wallet in IntaSend
 */
const createIntaSendWallet = async (label, currency = 'KES') => {
    try {
        const intasend = getClient();
        const wallets = intasend.wallets();

        const response = await wallets.create({
            label: label,
            wallet_type: 'WORKING',
            currency: currency,
            can_disburse: true
        });

        debugLog('IntaSend Wallet Created:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Wallet Creation Error:', error);
        throw new Error(error?.message || 'Wallet creation failed');
    }
};

/**
 * Get wallet details (including balance)
 */
const getIntaSendWallet = async (walletId) => {
    try {
        const intasend = getClient();
        const wallets = intasend.wallets();

        const response = await wallets.details({ wallet_id: walletId });
        debugLog('IntaSend Wallet Details:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Wallet Details Error:', error);
        throw new Error(error?.message || 'Wallet details fetch failed');
    }
};

/**
 * Get wallet transaction history
 */
const getIntaSendWalletTransactions = async (walletId) => {
    try {
        const intasend = getClient();
        const wallets = intasend.wallets();

        const response = await wallets.transactions({ wallet_id: walletId });
        debugLog('IntaSend Wallet Transactions:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Wallet Transactions Error:', error);
        throw new Error(error?.message || 'Wallet transactions fetch failed');
    }
};

/**
 * Internal transfer between IntaSend wallets
 */
const intasendInternalTransfer = async ({ sender_wallet_id, receiver_wallet_id, amount, narrative }) => {
    try {
        const intasend = getClient();
        const wallets = intasend.wallets();

        const response = await wallets.intra_transfer({
            sender_wallet_id,
            receiver_wallet_id,
            amount: parseFloat(amount),
            narrative: narrative || 'Ripplify Internal Transfer'
        });

        debugLog('IntaSend Internal Transfer:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('IntaSend Internal Transfer Error:', error);
        throw new Error(error?.message || 'Internal transfer failed');
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
    createIntaSendWallet,
    getIntaSendWallet,
    getIntaSendWalletTransactions,
    intasendInternalTransfer
};
