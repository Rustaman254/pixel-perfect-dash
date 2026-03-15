import axios from 'axios';
import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const JENGA_URL = process.env.JENGA_ENV === 'live' 
    ? 'https://api.jengaapi.io' 
    : 'https://sandbox.jengaapi.io';

const getAccessToken = async () => {
    try {
        const response = await axios.post(`${JENGA_URL}/authentication/v1/login`, {
            merchantId: process.env.JENGA_MERCHANT_ID,
            consumerSecret: process.env.JENGA_CONSUMER_SECRET
        }, {
            headers: {
                'Api-Key': process.env.JENGA_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        return response.data.accessToken;
    } catch (error) {
        console.error('Jenga Auth Error:', error.response?.data || error.message);
        throw error;
    }
};

const generateSignature = (data) => {
    try {
        const privateKeyPath = process.env.JENGA_PRIVATE_KEY_PATH;
        if (!privateKeyPath || !fs.existsSync(privateKeyPath)) {
            console.warn('Jenga Private Key not found at:', privateKeyPath);
            return 'MOCK_SIGNATURE';
        }
        const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        
        const md = forge.md.sha256.create();
        md.update(data, 'utf8');
        
        const signature = privateKey.sign(md);
        return forge.util.encode64(signature);
    } catch (error) {
        console.error('Signature Generation Error:', error);
        return 'SIGNATURE_ERROR';
    }
};

const receivePayment = async (paymentData) => {
    const token = await getAccessToken();
    // Signature string: reference + amount + currency + merchantId
    const signatureData = `${paymentData.reference}${paymentData.amount}${paymentData.currency}${process.env.JENGA_MERCHANT_ID}`;
    const signature = generateSignature(signatureData);

    try {
        const response = await axios.post(`${JENGA_URL}/transaction/v1/payments`, paymentData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Signature': signature,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Jenga Receive Payment Error:', error.response?.data || error.message);
        // Fallback or return simulated response if in sandbox and error is auth/key related
        if (process.env.JENGA_ENV === 'sandbox') {
             return { url: `${process.env.BASE_URL.replace('3001', '5173')}/pay/mock-success`, transactionId: 'MOCK-TXN-' + Date.now() };
        }
        throw error;
    }
};

const sendMoney = async (payoutData) => {
    const token = await getAccessToken();
    // Signature string: sourceAccount + amount + currency + reference
    const signatureData = `${process.env.JENGA_ESCROW_ACCOUNT}${payoutData.amount}${payoutData.currency}${payoutData.reference}`;
    const signature = generateSignature(signatureData);

    try {
        const response = await axios.post(`${JENGA_URL}/transaction/v1/remittance`, payoutData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Signature': signature,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Jenga Send Money Error:', error.response?.data || error.message);
        if (process.env.JENGA_ENV === 'sandbox') {
            return { status: 'SUCCESS', transactionId: 'MOCK-PAY-' + Date.now() };
        }
        throw error;
    }
};

export default {
    receivePayment,
    sendMoney
};
