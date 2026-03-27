import dotenv from 'dotenv';
dotenv.config();

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-sokostack-2026-secret';

const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001',
  ripplify: process.env.RIPPLIFY_SERVICE_URL || 'http://127.0.0.1:3002',
  shopalize: process.env.SHOPALIZE_SERVICE_URL || 'http://127.0.0.1:3003',
  watchtower: process.env.WATCHTOWER_SERVICE_URL || 'http://127.0.0.1:3004',
  admin: process.env.ADMIN_SERVICE_URL || 'http://127.0.0.1:3005',
};

// Internal service-to-service HTTP client
export const callService = async (serviceName, path, options = {}) => {
  const baseUrl = SERVICE_URLS[serviceName];
  if (!baseUrl) throw new Error(`Unknown service: ${serviceName}`);

  const url = `${baseUrl}${path}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': INTERNAL_API_KEY,
      ...(options.userToken ? { 'Authorization': `Bearer ${options.userToken}` } : {}),
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `Service call failed: ${response.status}` }));
    const err = new Error(error.message);
    err.status = response.status;
    err.data = error;
    throw err;
  }

  return response.json();
};

// Convenience methods
export const authService = {
  getUser: (userId) => callService('auth', `/internal/users/${userId}`),
  getUsers: (query = '') => callService('auth', `/internal/users${query}`),
  getSettings: () => callService('auth', '/internal/settings'),
  getCurrencies: () => callService('auth', '/internal/currencies'),
  getFeatures: (userId) => callService('auth', `/internal/features/${userId}`),
  validateApiKey: (key) => callService('auth', '/internal/validate-key', {
    method: 'POST',
    body: { key },
  }),
};

export const ripplifyService = {
  getTransactionStats: (userId) => callService('ripplify', `/internal/transactions/stats?userId=${userId}`),
  getUserTransactions: (userId, query = '') => callService('ripplify', `/internal/transactions?userId=${userId}${query}`),
  getUserPayouts: (userId) => callService('ripplify', `/internal/payouts?userId=${userId}`),
  getPaymentLinks: (userId) => callService('ripplify', `/internal/links?userId=${userId}`),
};

export const watchtowerService = {
  getOverview: (userId) => callService('watchtower', `/internal/overview?userId=${userId}`),
  getSessions: (userId, query = '') => callService('watchtower', `/internal/sessions?userId=${userId}${query}`),
  getPlatformOverview: () => callService('watchtower', '/internal/platform-overview'),
  pushEvent: (data) => callService('watchtower', '/internal/events', {
    method: 'POST',
    body: data,
  }),
};

export const shopalizeService = {
  getStores: (userId) => callService('shopalize', `/internal/stores?userId=${userId}`),
  getStoreStats: () => callService('shopalize', '/internal/stats'),
};

export default callService;
