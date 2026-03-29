import { createConnection } from '../shared/db.js';
import { callService, authService, ripplifyService, watchtowerService, shopalizeService } from '../shared/serviceClient.js';

const db = () => createConnection('admin_db');
const SUPER_ADMIN_ID = 4;

// GET /api/admin/companies
export const getCompanies = async (req, res) => {
  try {
    const result = await callService('auth', '/api/auth/internal/stores');
    res.json(result || []);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Failed to get companies' });
  }
};

// POST /api/admin/companies
export const createCompany = async (req, res) => {
  try {
    const result = await callService('auth', '/api/auth/internal/stores', {
      method: 'POST',
      body: req.body,
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Failed to create company' });
  }
};

// PUT /api/admin/companies/:id
export const updateCompany = async (req, res) => {
  try {
    const result = await callService('auth', `/api/auth/internal/stores/${req.params.id}`, {
      method: 'PUT',
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Failed to update company' });
  }
};

// DELETE /api/admin/companies/:id
export const deleteCompany = async (req, res) => {
  try {
    const result = await callService('auth', `/api/auth/internal/stores/${req.params.id}`, {
      method: 'DELETE',
    });
    res.json(result);
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Failed to delete company' });
  }
};

// GET /api/admin/permissions
export const getPermissions = async (req, res) => {
  try {
    const permissions = [
      { id: 1, name: 'users.view', description: 'View users' },
      { id: 2, name: 'users.edit', description: 'Edit users' },
      { id: 3, name: 'users.delete', description: 'Delete users' },
      { id: 4, name: 'transactions.view', description: 'View transactions' },
      { id: 5, name: 'transactions.approve', description: 'Approve transactions' },
      { id: 6, name: 'payouts.view', description: 'View payouts' },
      { id: 7, name: 'payouts.approve', description: 'Approve payouts' },
      { id: 8, name: 'settings.edit', description: 'Edit settings' },
      { id: 9, name: 'analytics.view', description: 'View analytics' },
      { id: 10, name: 'admin.manage', description: 'Manage admin' },
    ];
    res.json(permissions);
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ message: 'Failed to get permissions' });
  }
};

// GET /api/admin/api-keys
export const getApiKeys = async (req, res) => {
  try {
    const result = await callService('auth', '/internal/api-keys');
    res.json(result || []);
  } catch (error) {
    console.error('Get api keys error:', error);
    res.status(500).json({ message: 'Failed to get API keys' });
  }
};

// POST /api/admin/api-keys
export const createApiKey = async (req, res) => {
  try {
    const { name, userId } = req.body;
    const result = await callService('auth', '/internal/api-keys', {
      method: 'POST',
      body: { name, userId },
    });
    res.json(result);
  } catch (error) {
    console.error('Create api key error:', error);
    res.status(500).json({ message: 'Failed to create API key' });
  }
};

// DELETE /api/admin/api-keys/:id
export const deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    await callService('auth', `/internal/api-keys/${id}`, {
      method: 'DELETE',
    });
    res.json({ message: 'API key deleted' });
  } catch (error) {
    console.error('Delete api key error:', error);
    res.status(500).json({ message: 'Failed to delete API key' });
  }
};

// GET /api/admin/ripplify/stats
export const getRipplifyStats = async (req, res) => {
  try {
    const stats = await ripplifyService.getTransactionStats(0);
    res.json(stats);
  } catch (error) {
    console.error('Get ripplify stats error:', error);
    res.status(500).json({ message: 'Failed to get ripplify stats' });
  }
};

// GET /api/admin/ripplify/analytics
export const getRipplifyAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await ripplifyService.getUserTransactions(0, `&period=${period}`);
    res.json(result.transactions || []);
  } catch (error) {
    console.error('Get ripplify analytics error:', error);
    res.status(500).json({ message: 'Failed to get ripplify analytics' });
  }
};

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
    res.json(result.users || []);
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
      callService('auth', `/api/auth/internal/users/${userId}`),
      callService('ripplify', `/api/ripplify/transactions/stats?userId=${userId}`),
      callService('ripplify', `/api/ripplify/transactions?userId=${userId}`),
      callService('ripplify', `/api/ripplify/payouts?userId=${userId}`),
      shopalizeService.getStores(userId),
      watchtowerService.getOverview(userId),
      watchtowerService.getSessions(userId, '&limit=10'),
    ]);

    const userData = user.status === 'fulfilled' ? user.value : null;
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ripplifyStatsData = ripplifyStats.status === 'fulfilled' ? ripplifyStats.value : {};

    res.json({
      ...userData,
      stats: {
        transactionCount: ripplifyStatsData.totalTransactions || 0,
        totalVolume: ripplifyStatsData.totalVolume || 0,
        linkCount: ripplifyStatsData.totalLinks || 0,
        pendingPayouts: ripplifyStatsData.pendingPayouts || 0,
        apiKeys: [],
      },
      ripplify: {
        stats: ripplifyStatsData,
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

// PATCH /api/admin/users/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await callService('auth', `/api/auth/internal/users/${id}`, {
      method: 'PATCH',
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// PUT /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDisabled, isSuspended, suspendReason, isVerified } = req.body;

    if (parseInt(id) === SUPER_ADMIN_ID && (isDisabled || isSuspended)) {
      return res.status(403).json({ message: "Cannot suspend or disable the super admin account." });
    }

    const result = await callService('auth', `/api/auth/internal/users/${id}/status`, {
      method: 'PUT',
      body: { isDisabled, isSuspended, suspendReason, isVerified },
    });

    res.json(result);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// GET /api/admin/users/:id/roles
export const getUserRoles = async (req, res) => {
  try {
    const userId = req.params.id;
    const roles = await db()('user_roles').select('roles.*').join('roles', 'user_roles.role_id', 'roles.id').where('user_roles.user_id', userId);
    res.json(roles || []);
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ message: 'Failed to get user roles' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === SUPER_ADMIN_ID) {
      return res.status(403).json({ message: "Cannot delete the super admin account." });
    }

    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    const result = await callService('auth', `/api/auth/internal/users/${id}`, {
      method: 'DELETE',
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// GET /api/admin/transactions
export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    const result = await callService('ripplify', `/internal/transactions/all?${params.toString()}`);
    res.json(result.transactions || []);
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
      ? `/api/ripplify/payouts?userId=${userId}`
      : '/api/ripplify/payouts?userId=0';

    const result = await callService('ripplify', path);
    res.json(result.payouts || []);
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
    const result = await callService('auth', '/api/auth/internal/features');
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

    const result = await callService('auth', `/api/auth/internal/features/${key}`, {
      method: 'PUT',
      body: req.body,
    });

    res.json(result);
  } catch (error) {
    console.error('Update feature flag error:', error);
    res.status(500).json({ message: 'Failed to update feature flag' });
  }
};

// PATCH /api/admin/feature-flags/:id/toggle
export const toggleFeatureFlag = async (req, res) => {
  try {
    const result = await callService('auth', `/api/auth/internal/features/${req.params.id}/toggle`, {
      method: 'PATCH',
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    console.error('Toggle feature flag error:', error);
    res.status(500).json({ message: 'Failed to toggle feature flag' });
  }
};

// DELETE /api/admin/feature-flags/:id
export const deleteFeatureFlag = async (req, res) => {
  try {
    const result = await callService('auth', `/api/auth/internal/features/${req.params.id}`, {
      method: 'DELETE',
    });
    res.json(result);
  } catch (error) {
    console.error('Delete feature flag error:', error);
    res.status(500).json({ message: 'Failed to delete feature flag' });
  }
};

// POST /api/admin/feature-flags
export const createFeatureFlag = async (req, res) => {
  try {
    const result = await callService('auth', '/api/auth/internal/features', {
      method: 'POST',
      body: req.body,
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Create feature flag error:', error);
    res.status(500).json({ message: 'Failed to create feature flag' });
  }
};

// GET /api/admin/users/:id/features
export const getUserFeatureOverrides = async (req, res) => {
  try {
    const { id } = req.params;
    const features = await callService('auth', `/api/auth/internal/features/${id}`);
    res.json(features || []);
  } catch (error) {
    console.error('Get user feature overrides error:', error);
    res.status(500).json({ message: 'Failed to get user feature overrides' });
  }
};

// PUT /api/admin/users/:id/features
export const updateUserFeatureOverrides = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await callService('auth', `/api/auth/internal/features/${id}`, {
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
    const result = await callService('auth', '/api/auth/internal/roles');
    res.json(result);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Failed to get roles' });
  }
};

// POST /api/admin/roles
export const createRole = async (req, res) => {
  try {
    const result = await callService('auth', '/api/auth/internal/roles', {
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
    const result = await callService('auth', '/api/auth/internal/roles/assign', {
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;

    let baseQuery = db()('notifications')
      .where(function() {
        this.where('targetRole', 'admin').orWhereNull('targetRole').orWhere('targetRole', '');
      });
    if (type) baseQuery = baseQuery.where({ type });

    const notifications = await baseQuery
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    res.json(notifications);
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

// PUT /api/admin/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    await db()('notifications').where({ id: req.params.id }).update({ isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

// PUT /api/admin/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    await db()('notifications')
      .where(function() {
        this.where('targetRole', 'admin').orWhereNull('targetRole').orWhere('targetRole', '');
      })
      .update({ isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
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

// ===== SHOPIFY-LIKE SHOPIZE ADMIN ENDPOINTS =====

// GET /api/admin/shopalize/stores
export const getShopalizeStores = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    params.set('page', page);
    params.set('limit', limit);

    const result = await shopalizeService.getAllStores(`?${params.toString()}`);
    res.json(result);
  } catch (error) {
    console.error('Get shopalize stores error:', error);
    res.status(500).json({ message: 'Failed to get stores' });
  }
};

// GET /api/admin/shopalize/stores/:id
export const getShopalizeStoreDetail = async (req, res) => {
  try {
    const result = await shopalizeService.getStoreDetail(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Get shopalize store detail error:', error);
    res.status(500).json({ message: 'Failed to get store detail' });
  }
};

// PUT /api/admin/shopalize/stores/:id
export const updateShopalizeStore = async (req, res) => {
  try {
    const result = await shopalizeService.updateStore(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update shopalize store error:', error);
    res.status(500).json({ message: 'Failed to update store' });
  }
};

// DELETE /api/admin/shopalize/stores/:id
export const deleteShopalizeStore = async (req, res) => {
  try {
    const result = await shopalizeService.deleteStore(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Delete shopalize store error:', error);
    res.status(500).json({ message: 'Failed to delete store' });
  }
};

// GET /api/admin/shopalize/orders
export const getShopalizeOrders = async (req, res) => {
  try {
    const { status, storeId, search, page = 1, limit = 50 } = req.query;
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (storeId) params.set('storeId', storeId);
    if (search) params.set('search', search);
    params.set('page', page);
    params.set('limit', limit);

    const result = await shopalizeService.getAllOrders(`?${params.toString()}`);
    res.json(result);
  } catch (error) {
    console.error('Get shopalize orders error:', error);
    res.status(500).json({ message: 'Failed to get orders' });
  }
};

// PUT /api/admin/shopalize/orders/:id
export const updateShopalizeOrder = async (req, res) => {
  try {
    const result = await shopalizeService.updateOrder(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update shopalize order error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
};

// GET /api/admin/shopalize/products
export const getShopalizeProducts = async (req, res) => {
  try {
    const { storeId, search, category, page = 1, limit = 50 } = req.query;
    const params = new URLSearchParams();
    if (storeId) params.set('storeId', storeId);
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    params.set('page', page);
    params.set('limit', limit);

    const result = await shopalizeService.getAllProducts(`?${params.toString()}`);
    res.json(result);
  } catch (error) {
    console.error('Get shopalize products error:', error);
    res.status(500).json({ message: 'Failed to get products' });
  }
};

// PUT /api/admin/shopalize/products/:id
export const updateShopalizeProduct = async (req, res) => {
  try {
    const result = await shopalizeService.updateProduct(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update shopalize product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// DELETE /api/admin/shopalize/products/:id
export const deleteShopalizeProduct = async (req, res) => {
  try {
    const result = await shopalizeService.deleteProduct(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Delete shopalize product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

// GET /api/admin/shopalize/customers
export const getShopalizeCustomers = async (req, res) => {
  try {
    const { storeId, search, page = 1, limit = 50 } = req.query;
    const params = new URLSearchParams();
    if (storeId) params.set('storeId', storeId);
    if (search) params.set('search', search);
    params.set('page', page);
    params.set('limit', limit);

    const result = await shopalizeService.getAllCustomers(`?${params.toString()}`);
    res.json(result);
  } catch (error) {
    console.error('Get shopalize customers error:', error);
    res.status(500).json({ message: 'Failed to get customers' });
  }
};

// GET /api/admin/shopalize/analytics
export const getShopalizeAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await shopalizeService.getAdminAnalytics(`?period=${period}`);
    res.json(result);
  } catch (error) {
    console.error('Get shopalize analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
};

// GET /api/admin/shopalize/settings
export const getShopalizeSettings = async (req, res) => {
  try {
    const result = await shopalizeService.getAdminSettings();
    res.json(result);
  } catch (error) {
    console.error('Get shopalize settings error:', error);
    res.status(500).json({ message: 'Failed to get settings' });
  }
};

// PUT /api/admin/shopalize/settings
export const updateShopalizeSettings = async (req, res) => {
  try {
    const result = await shopalizeService.updateAdminSettings(req.body);
    res.json(result);
  } catch (error) {
    console.error('Update shopalize settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

// GET /api/admin/shopalize/feature-flags
export const getShopalizeFeatureFlags = async (req, res) => {
  try {
    const result = await shopalizeService.getFeatureFlags();
    res.json(result);
  } catch (error) {
    console.error('Get shopalize feature flags error:', error);
    res.status(500).json({ message: 'Failed to get feature flags' });
  }
};

// POST /api/admin/shopalize/feature-flags
export const createShopalizeFeatureFlag = async (req, res) => {
  try {
    const result = await shopalizeService.createFeatureFlag(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create shopalize feature flag error:', error);
    res.status(500).json({ message: 'Failed to create feature flag' });
  }
};

// PUT /api/admin/shopalize/feature-flags/:id
export const updateShopalizeFeatureFlag = async (req, res) => {
  try {
    const result = await shopalizeService.updateFeatureFlag(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update shopalize feature flag error:', error);
    res.status(500).json({ message: 'Failed to update feature flag' });
  }
};

// DELETE /api/admin/shopalize/feature-flags/:id
export const deleteShopalizeFeatureFlag = async (req, res) => {
  try {
    const result = await shopalizeService.deleteFeatureFlag(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Delete shopalize feature flag error:', error);
    res.status(500).json({ message: 'Failed to delete feature flag' });
  }
};

// GET /api/admin/shopalize/stats (for dashboard)
export const getShopalizeAdminStats = async (req, res) => {
  try {
    const [stats, analytics] = await Promise.allSettled([
      shopalizeService.getStoreStats(),
      shopalizeService.getAdminAnalytics('?period=30d'),
    ]);

    const statsData = stats.status === 'fulfilled' ? stats.value : {};
    const analyticsData = analytics.status === 'fulfilled' ? analytics.value : {};

    res.json({
      ...statsData,
      analytics: analyticsData,
    });
  } catch (error) {
    console.error('Get shopalize admin stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
};

export default {
  getDashboard, getRipplifyStats, getRipplifyAnalytics,
  getUsers, getUserDetail, updateUserStatus, updateUser, deleteUser,
  getCompanies, createCompany, updateCompany, deleteCompany,
  getPermissions,
  getApiKeys, createApiKey, deleteApiKey,
  getTransactions, getPayouts, updatePayoutStatus,
  getCurrencies, addCurrency, updateCurrency,
  getFeeTiers, updateFeeTiers,
  getSettings, updateSettings,
  getAnalytics,
  getApps, createApp, updateApp,
  getFeatureFlags, updateFeatureFlag, createFeatureFlag, toggleFeatureFlag, deleteFeatureFlag,
  getUserFeatureOverrides, updateUserFeatureOverrides,
  getReferralCodes, createReferralCode,
  getRoles, createRole, assignRole,
  getAuditLogs,
  getNotifications, createNotification, deleteNotification, markNotificationRead, markAllNotificationsRead,
  getSupportTickets, updateSupportTicket,
  // Shopalize admin
  getShopalizeStores, getShopalizeStoreDetail, updateShopalizeStore, deleteShopalizeStore,
  getShopalizeOrders, updateShopalizeOrder,
  getShopalizeProducts, updateShopalizeProduct, deleteShopalizeProduct,
  getShopalizeCustomers,
  getShopalizeAnalytics,
  getShopalizeSettings, updateShopalizeSettings,
  getShopalizeFeatureFlags, createShopalizeFeatureFlag, updateShopalizeFeatureFlag, deleteShopalizeFeatureFlag,
  getShopalizeAdminStats,
};
