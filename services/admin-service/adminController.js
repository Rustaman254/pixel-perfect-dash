import { createConnection } from '../shared/db.js';
import { callService, authService, ripplifyService, watchtowerService, shopalizeService } from '../shared/serviceClient.js';

const db = () => createConnection('admin_db');

// GET /api/admin/dashboard
export const getDashboard = async (req, res) => {
  try {
    const [authStats, shopalizeStats, watchtowerStats] = await Promise.allSettled([
      callService('auth', '/internal/stats'),
      shopalizeService.getStoreStats(),
      watchtowerService.getPlatformOverview(),
    ]);

    // Get ripplify revenue from all transactions
    let totalRevenue = 0;
    let totalTransactions = 0;
    try {
      const allTransactions = await callService('ripplify', '/internal/transactions/stats?userId=0');
      totalTransactions = allTransactions.totalTransactions || 0;
    } catch {}

    // Count total transactions across platform
    let ripplifyTransactionCount = 0;
    try {
      const txResult = await callService('ripplify', '/internal/transactions?userId=0');
      ripplifyTransactionCount = Array.isArray(txResult) ? txResult.length : 0;
    } catch {}

    const authData = authStats.status === 'fulfilled' ? authStats.value : {};
    const shopalizeData = shopalizeStats.status === 'fulfilled' ? shopalizeStats.value : {};
    const watchtowerData = watchtowerStats.status === 'fulfilled' ? watchtowerStats.value : {};

    res.json({
      totalUsers: authData.totalUsers || 0,
      activeUsers: authData.activeUsers || 0,
      todaySignups: authData.todaySignups || 0,
      totalTransactions: ripplifyTransactionCount,
      totalRevenue: shopalizeData.totalRevenue || 0,
      totalStores: shopalizeData.totalProjects || 0,
      publishedStores: shopalizeData.publishedProjects || 0,
      totalOrders: shopalizeData.totalOrders || 0,
      totalProducts: shopalizeData.totalProducts || 0,
      totalSessions: watchtowerData.totalSessions || 0,
      totalPageViews: watchtowerData.totalPageViews || 0,
      uniqueVisitors: watchtowerData.uniqueUsers || 0,
      avgSessionDuration: watchtowerData.avgDuration || 0,
      totalRageClicks: watchtowerData.totalRageClicks || 0,
      totalDeadClicks: watchtowerData.totalDeadClicks || 0,
      sessionsOverTime: watchtowerData.sessionsOverTime || [],
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    let query = `?page=${page}&limit=${limit}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (role) query += `&role=${encodeURIComponent(role)}`;

    const result = await authService.getUsers(query);
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// GET /api/admin/users/:id
export const getUserDetail = async (req, res) => {
  try {
    const userId = req.params.id;

    const [user, ripplifyStats, ripplifyTransactions, ripplifyPayouts, shopalizeStores, watchtowerOverview, watchtowerSessions] = await Promise.allSettled([
      callService('auth', `/internal/users/${userId}`),
      callService('ripplify', `/internal/transactions/stats?userId=${userId}`),
      callService('ripplify', `/internal/transactions?userId=${userId}`),
      callService('ripplify', `/internal/payouts?userId=${userId}`),
      shopalizeService.getStores(userId),
      watchtowerService.getOverview(userId),
      watchtowerService.getSessions(userId, '?limit=10'),
    ]);

    const userData = user.status === 'fulfilled' ? user.value : null;
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: userData,
      ripplify: {
        stats: ripplifyStats.status === 'fulfilled' ? ripplifyStats.value : {},
        transactions: ripplifyTransactions.status === 'fulfilled' ? ripplifyTransactions.value : [],
        payouts: ripplifyPayouts.status === 'fulfilled' ? ripplifyPayouts.value : [],
      },
      shopalize: {
        stores: shopalizeStores.status === 'fulfilled' ? shopalizeStores.value : [],
      },
      watchtower: {
        overview: watchtowerOverview.status === 'fulfilled' ? watchtowerOverview.value : {},
        sessions: watchtowerSessions.status === 'fulfilled' ? watchtowerSessions.value : {},
      },
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ message: 'Failed to get user detail' });
  }
};

// PUT /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDisabled, isSuspended, suspendReason } = req.body;

    const result = await callService('auth', `/internal/users/${id}/status`, {
      method: 'PUT',
      body: { isDisabled, isSuspended, suspendReason },
    });

    res.json(result);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// GET /api/admin/transactions
export const getTransactions = async (req, res) => {
  try {
    const { userId, page = 1, limit = 50 } = req.query;
    let path = '/internal/transactions';
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    else params.set('userId', '0');
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    path += `?${params.toString()}`;

    const result = await callService('ripplify', path);
    res.json(result);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
};

// GET /api/admin/payouts
export const getPayouts = async (req, res) => {
  try {
    const { userId } = req.query;
    const path = userId
      ? `/internal/payouts?userId=${userId}`
      : '/internal/payouts?userId=0';

    const result = await callService('ripplify', path);
    res.json(result);
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({ message: 'Failed to get payouts' });
  }
};

// PUT /api/admin/payouts/:id/status
export const updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await callService('ripplify', `/internal/payouts/${id}/status`, {
      method: 'PUT',
      body: { status },
    });

    res.json(result);
  } catch (error) {
    console.error('Update payout status error:', error);
    res.status(500).json({ message: 'Failed to update payout status' });
  }
};

// GET /api/admin/currencies
export const getCurrencies = async (req, res) => {
  try {
    const currencies = await authService.getCurrencies();
    res.json(currencies);
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ message: 'Failed to get currencies' });
  }
};

// POST /api/admin/currencies
export const addCurrency = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/currencies', {
      method: 'POST',
      body: req.body,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Add currency error:', error);
    res.status(500).json({ message: 'Failed to add currency' });
  }
};

// PUT /api/admin/currencies/:code
export const updateCurrency = async (req, res) => {
  try {
    const { code } = req.params;

    const result = await callService('auth', `/internal/currencies/${code}`, {
      method: 'PUT',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({ message: 'Failed to update currency' });
  }
};

// GET /api/admin/fees
export const getFeeTiers = async (req, res) => {
  try {
    const result = await callService('ripplify', '/internal/fees');
    res.json(result);
  } catch (error) {
    console.error('Get fee tiers error:', error);
    res.status(500).json({ message: 'Failed to get fee tiers' });
  }
};

// PUT /api/admin/fees
export const updateFeeTiers = async (req, res) => {
  try {
    const result = await callService('ripplify', '/internal/fees', {
      method: 'PUT',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Update fee tiers error:', error);
    res.status(500).json({ message: 'Failed to update fee tiers' });
  }
};

// GET /api/admin/settings
export const getSettings = async (req, res) => {
  try {
    const settings = await authService.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to get settings' });
  }
};

// PUT /api/admin/settings
export const updateSettings = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/settings', {
      method: 'PUT',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

// GET /api/admin/analytics
export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [platformOverview, shopalizeStats] = await Promise.allSettled([
      watchtowerService.getPlatformOverview(),
      shopalizeService.getStoreStats(),
    ]);

    const watchtowerData = platformOverview.status === 'fulfilled' ? platformOverview.value : {};
    const shopalizeData = shopalizeStats.status === 'fulfilled' ? shopalizeStats.value : {};

    res.json({
      watchtower: watchtowerData,
      shopalize: shopalizeData,
      period: { startDate, endDate },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
};

// GET /api/admin/apps
export const getApps = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/apps');
    res.json(result);
  } catch (error) {
    console.error('Get apps error:', error);
    res.status(500).json({ message: 'Failed to get apps' });
  }
};

// POST /api/admin/apps
export const createApp = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/apps', {
      method: 'POST',
      body: req.body,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create app error:', error);
    res.status(500).json({ message: 'Failed to create app' });
  }
};

// PUT /api/admin/apps/:id
export const updateApp = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await callService('auth', `/internal/apps/${id}`, {
      method: 'PUT',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Update app error:', error);
    res.status(500).json({ message: 'Failed to update app' });
  }
};

// GET /api/admin/features
export const getFeatureFlags = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/features');
    res.json(result);
  } catch (error) {
    console.error('Get feature flags error:', error);
    res.status(500).json({ message: 'Failed to get feature flags' });
  }
};

// PUT /api/admin/features/:key
export const updateFeatureFlag = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await callService('auth', `/internal/features/${key}`, {
      method: 'PUT',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Update feature flag error:', error);
    res.status(500).json({ message: 'Failed to update feature flag' });
  }
};

// GET /api/admin/users/:id/features
export const getUserFeatureOverrides = async (req, res) => {
  try {
    const { id } = req.params;
    const features = await authService.getFeatures(id);
    res.json(features);
  } catch (error) {
    console.error('Get user feature overrides error:', error);
    res.status(500).json({ message: 'Failed to get user feature overrides' });
  }
};

// PUT /api/admin/users/:id/features
export const updateUserFeatureOverrides = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await callService('auth', `/internal/features/user/${id}`, {
      method: 'PUT',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Update user feature overrides error:', error);
    res.status(500).json({ message: 'Failed to update user feature overrides' });
  }
};

// GET /api/admin/referrals
export const getReferralCodes = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/referrals');
    res.json(result);
  } catch (error) {
    console.error('Get referral codes error:', error);
    res.status(500).json({ message: 'Failed to get referral codes' });
  }
};

// POST /api/admin/referrals
export const createReferralCode = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/referrals', {
      method: 'POST',
      body: req.body,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create referral code error:', error);
    res.status(500).json({ message: 'Failed to create referral code' });
  }
};

// GET /api/admin/roles
export const getRoles = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/roles');
    res.json(result);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Failed to get roles' });
  }
};

// POST /api/admin/roles
export const createRole = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/roles', {
      method: 'POST',
      body: req.body,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

// POST /api/admin/roles/assign
export const assignRole = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/roles/assign', {
      method: 'POST',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Failed to assign role' });
  }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action } = req.query;
    let path = '/internal/audit-logs';
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (userId) params.set('userId', userId);
    if (action) params.set('action', action);
    path += `?${params.toString()}`;

    const result = await callService('auth', path);
    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to get audit logs' });
  }
};

// GET /api/admin/notifications
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, targetRole } = req.query;

    let query = db()('notifications').orderBy('createdAt', 'desc');
    if (type) query = query.where({ type });
    if (targetRole) query = query.where({ targetRole });

    const total = await query.clone().count('id as count').first();
    const notifications = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

    res.json({
      notifications,
      total: parseInt(total.count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
};

// POST /api/admin/notifications
export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, actionUrl, actionLabel, targetRole, appName, deliveryChannel } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const [notification] = await db()('notifications')
      .insert({
        userId: userId || null,
        title,
        message,
        type: type || 'info',
        actionUrl: actionUrl || null,
        actionLabel: actionLabel || null,
        targetRole: targetRole || null,
        appName: appName || 'ripplify',
        deliveryChannel: deliveryChannel || 'app',
      })
      .returning('*');

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
};

// DELETE /api/admin/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await db()('notifications').where({ id }).delete();
    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// GET /api/admin/support
export const getSupportTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = db()('support_tickets').orderBy('createdAt', 'desc');
    if (status) query = query.where({ status });

    const total = await query.clone().count('id as count').first();
    const tickets = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

    res.json({
      tickets,
      total: parseInt(total.count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ message: 'Failed to get support tickets' });
  }
};

// PUT /api/admin/support/:id
export const updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const [ticket] = await db()('support_tickets')
      .where({ id })
      .update({ status })
      .returning('*');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ message: 'Failed to update support ticket' });
  }
};

export default {
  getDashboard, getUsers, getUserDetail, updateUserStatus,
  getTransactions, getPayouts, updatePayoutStatus,
  getCurrencies, addCurrency, updateCurrency,
  getFeeTiers, updateFeeTiers,
  getSettings, updateSettings,
  getAnalytics,
  getApps, createApp, updateApp,
  getFeatureFlags, updateFeatureFlag,
  getUserFeatureOverrides, updateUserFeatureOverrides,
  getReferralCodes, createReferralCode,
  getRoles, createRole, assignRole,
  getAuditLogs,
  getNotifications, createNotification, deleteNotification,
  getSupportTickets, updateSupportTicket,
};
