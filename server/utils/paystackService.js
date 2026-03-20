import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const getHeaders = () => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        throw new Error('PAYSTACK_SECRET_KEY is not defined in environment variables');
    }
    return {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
    };
};

const initiatePayment = async (paymentData) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, paymentData, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Initiate Payment Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Paystack payment initialization failed');
    }
};

const verifyPayment = async (reference) => {
    try {
        const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Verify Payment Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Paystack payment verification failed');
    }
};

const createTransferRecipient = async (recipientData) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/transferrecipient`, recipientData, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Create Recipient Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Paystack recipient creation failed');
    }
};

const initiateTransfer = async (transferData) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/transfer`, transferData, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Initiate Transfer Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Paystack transfer initiation failed');
    }
};

const chargeMobileMoney = async (chargeData) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/charge`, chargeData, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Mobile Money Charge Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Paystack mobile money charge failed');
    }
};

const charge = async (chargeData) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/charge`, chargeData, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Charge Error:', error.response?.data || error.message);
        // Surface the nested detail message from Paystack (e.g. "Declined. Please use test mobile money number...")
        const detailMessage = error.response?.data?.data?.message;
        const topMessage = error.response?.data?.message;
        const errMsg = detailMessage || topMessage || 'Paystack charge failed';
        const err = new Error(errMsg);
        err.response = error.response;
        throw err;
    }
};

const submitOTP = async (otp, reference) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/charge/submit_otp`, { otp, reference }, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Submit OTP Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'OTP submission failed');
    }
};

const submitPIN = async (pin, reference) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/charge/submit_pin`, { pin, reference }, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Submit PIN Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'PIN submission failed');
    }
};

const submitBirthday = async (birthday, reference) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/charge/submit_birthday`, { birthday, reference }, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Submit Birthday Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Birthday submission failed');
    }
};

const submitAddress = async (addressData, reference) => {
    try {
        const response = await axios.post(`${PAYSTACK_BASE_URL}/charge/submit_address`, { ...addressData, reference }, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Paystack Submit Address Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Address submission failed');
    }
};

const verifyWebhookSignature = (signature, requestBody) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return false;
    
    // Convert body to string if it isn't already
    const payload = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
    
    const hash = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
    return hash === signature;
};

export default {
    initiatePayment,
    verifyPayment,
    verifyWebhookSignature,
    createTransferRecipient,
    initiateTransfer,
    chargeMobileMoney,
    charge,
    submitOTP,
    submitPIN,
    submitBirthday,
    submitAddress
};
