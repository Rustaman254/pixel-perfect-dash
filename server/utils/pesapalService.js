import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PESAPAL_BASE_URL = process.env.PESAPAL_ENV === 'live' 
  ? 'https://pay.pesapal.com/v3' 
  : 'https://cybqa.pesapal.com/pesapalv3';

let cachedToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }, {
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.token) {
      cachedToken = response.data.token;
      // Tokens usually expire in 5 minutes, but the response tells us exactly when.
      // We'll set a safety margin.
      tokenExpiry = Date.now() + (5 * 60 * 1000) - 30000; 
      return cachedToken;
    }
    throw new Error('Failed to get PesaPal access token');
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.response?.data?.error?.code || error.message;
    console.error('PesaPal Auth Error:', error.response?.data || error.message);
    throw new Error(`PesaPal Auth: ${errorMsg}`);
  }
};

const registerIPN = async (callbackUrl) => {
  const token = await getAccessToken();
  try {
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
      url: callbackUrl,
      ipn_notification_type: 'GET'
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data; // Includes ipn_id
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.response?.data?.error?.code || error.message;
    console.error('PesaPal IPN Registration Error:', error.response?.data || error.message);
    throw new Error(`PesaPal IPN: ${errorMsg}`);
  }
};

const submitOrder = async (orderData) => {
  const token = await getAccessToken();
  try {
    // orderData should include amount, description, callback_url, notification_id, billing_address, etc.
    const response = await axios.post(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, orderData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data; // Includes order_tracking_id and redirect_url
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.response?.data?.error?.code || error.message;
    console.error('PesaPal Order Submission Error:', error.response?.data || error.message);
    throw new Error(`PesaPal Order: ${errorMsg}`);
  }
};

const getTransactionStatus = async (orderTrackingId) => {
  const token = await getAccessToken();
  try {
    const response = await axios.get(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('PesaPal Status Check Error:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  getAccessToken,
  registerIPN,
  submitOrder,
  getTransactionStatus
};
