import dotenv from 'dotenv';
dotenv.config();

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-api-key-2025';

const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3006',
  ripplify: process.env.RIPPLIFY_SERVICE_URL || 'http://localhost:3007',
  shopalize: process.env.SHOPALIZE_SERVICE_URL || 'http://localhost:3008',
  watchtower: process.env.WATCHTOWER_SERVICE_URL || 'http://localhost:3009',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3010',
};

// Internal service-to-service HTTP client
export const callService = async (serviceName, path, options = {}) => {
  const baseUrl = SERVICE_URLS[serviceName];
  if (!baseUrl) throw new Error(`Unknown service: ${serviceName}`);

  // Add /api/ prefix for auth service internal routes
  let fullPath = path;
  if (serviceName === 'auth' && path.startsWith('/internal/')) {
    fullPath = '/api/auth' + path;
  }

  const url = `${baseUrl}${fullPath}`;

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
  getUser: (userId) => callService('auth', `/api/auth/internal/users/${userId}`),
  getUsers: (query = '') => callService('auth', `/api/auth/internal/users${query}`),
  getSettings: () => callService('auth', '/api/auth/internal/settings'),
  getCurrencies: () => callService('auth', '/api/auth/internal/currencies'),
  getFeatures: (userId) => callService('auth', `/api/auth/internal/features/${userId}`),
  validateApiKey: (key) => callService('auth', '/api/auth/internal/validate-key', {
    method: 'POST',
    body: { key },
  }),
};

export const ripplifyService = {
  getTransactionStats: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return callService('ripplify', `/internal/transactions/stats${query}`);
  },
  getUserTransactions: (userId, query = '') => callService('ripplify', `/internal/transactions?userId=${userId}${query}`),
  getUserPayouts: (userId) => callService('ripplify', `/internal/payouts?userId=${userId}`),
  getPaymentLinks: (userId) => callService('ripplify', `/internal/links?userId=${userId}`),
  createPaymentLink: (linkData, authHeader) => callService('ripplify', '/api/payment-links/create', {
    method: 'POST',
    body: linkData,
    userToken: authHeader?.replace('Bearer ', ''),
  }),
  getPaymentLink: (linkId) => callService('ripplify', `/api/payment-links/${linkId}`),
};

export const adminService = {
  getFeatureFlags: () => callService('admin', '/api/admin/feature-flags'),
  getFeatureFlag: (key) => callService('admin', `/api/admin/feature-flags?key=${key}`),
  toggleFeatureFlag: (id) => callService('admin', `/api/admin/feature-flags/${id}/toggle`, { method: 'PATCH' }),
  createFeatureFlag: (data) => callService('admin', '/api/admin/feature-flags', { method: 'POST', body: data }),
  updateFeatureFlag: (id, data) => callService('admin', `/api/admin/feature-flags/${id}`, { method: 'PUT', body: data }),
  deleteFeatureFlag: (id) => callService('admin', `/api/admin/feature-flags/${id}`, { method: 'DELETE' }),
};

export const watchtowerService = {
  getOverview: (userId) => callService('watchtower', `/api/watchtower/internal/overview?userId=${userId}`),
  getSessions: (userId, query = '') => callService('watchtower', `/api/watchtower/internal/sessions?userId=${userId}${query}`),
  getPlatformOverview: () => callService('watchtower', '/api/watchtower/internal/platform-overview'),
  pushEvent: (data) => callService('watchtower', '/api/watchtower/internal/events', {
    method: 'POST',
    body: data,
  }),
};

export const shopalizeService = {
  getStores: (userId) => callService('shopalize', `/api/shopalize/internal/stores?userId=${userId}`),
  getStoreStats: () => callService('shopalize', '/api/shopalize/internal/stats'),
  // Admin endpoints
  getAllStores: (query = '') => callService('shopalize', `/api/shopalize/internal/admin/stores${query}`),
  getStoreDetail: (id) => callService('shopalize', `/api/shopalize/internal/admin/stores/${id}`),
  updateStore: (id, body) => callService('shopalize', `/api/shopalize/internal/admin/stores/${id}`, { method: 'PUT', body }),
  deleteStore: (id) => callService('shopalize', `/api/shopalize/internal/admin/stores/${id}`, { method: 'DELETE' }),
  getAllOrders: (query = '') => callService('shopalize', `/api/shopalize/internal/admin/orders${query}`),
  updateOrder: (id, body) => callService('shopalize', `/api/shopalize/internal/admin/orders/${id}`, { method: 'PUT', body }),
  getAllProducts: (query = '') => callService('shopalize', `/api/shopalize/internal/admin/products${query}`),
  updateProduct: (id, body) => callService('shopalize', `/api/shopalize/internal/admin/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id) => callService('shopalize', `/api/shopalize/internal/admin/products/${id}`, { method: 'DELETE' }),
  getAllCustomers: (query = '') => callService('shopalize', `/api/shopalize/internal/admin/customers${query}`),
  getAdminAnalytics: (query = '') => callService('shopalize', `/api/shopalize/internal/admin/analytics${query}`),
  getAdminSettings: () => callService('shopalize', '/api/shopalize/internal/admin/settings'),
  updateAdminSettings: (body) => callService('shopalize', '/api/shopalize/internal/admin/settings', { method: 'PUT', body }),
  getFeatureFlags: () => callService('shopalize', '/api/shopalize/internal/admin/feature-flags'),
  createFeatureFlag: (body) => callService('shopalize', '/api/shopalize/internal/admin/feature-flags', { method: 'POST', body }),
  updateFeatureFlag: (id, body) => callService('shopalize', `/api/shopalize/internal/admin/feature-flags/${id}`, { method: 'PUT', body }),
  deleteFeatureFlag: (id) => callService('shopalize', `/api/shopalize/internal/admin/feature-flags/${id}`, { method: 'DELETE' }),
};

export default callService;
