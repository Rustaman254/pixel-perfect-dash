import { Router } from 'express';
import { protectJwt, admin } from '../shared/auth.js';
import { callService } from '../shared/serviceClient.js';
import * as ctrl from './adminController.js';

const RIPPLIFY_SERVER = process.env.RIPPLIFY_SERVER_URL || 'http://127.0.0.1:3001';

// Helper to proxy requests to the main ripplify server (port 3001) with JWT auth
const proxyToRipplify = async (req, res, path) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const qs = new URLSearchParams(req.query).toString();
  const url = `${RIPPLIFY_SERVER}/api/admin/${path}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(req.method !== 'GET' && req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  const data = await response.json();
  res.status(response.status).json(data);
};

const router = Router();

// All routes require JWT auth + admin role
const adminOnly = [protectJwt, admin];

// Dashboard
router.get('/dashboard', ...adminOnly, ctrl.getDashboard);

// Users
router.get('/users', ...adminOnly, ctrl.getUsers);
router.get('/users/:id', ...adminOnly, ctrl.getUserDetail);
router.put('/users/:id/status', ...adminOnly, ctrl.updateUserStatus);

// Transactions
router.get('/transactions', ...adminOnly, ctrl.getTransactions);

// Payouts
router.get('/payouts', ...adminOnly, ctrl.getPayouts);
router.put('/payouts/:id/status', ...adminOnly, ctrl.updatePayoutStatus);

// Currencies
router.get('/currencies', ...adminOnly, ctrl.getCurrencies);
router.post('/currencies', ...adminOnly, ctrl.addCurrency);
router.put('/currencies/:code', ...adminOnly, ctrl.updateCurrency);

// Fees
router.get('/fees', ...adminOnly, ctrl.getFeeTiers);
router.put('/fees', ...adminOnly, ctrl.updateFeeTiers);

// Settings
router.get('/settings', ...adminOnly, ctrl.getSettings);
router.put('/settings', ...adminOnly, ctrl.updateSettings);

// Analytics
router.get('/analytics', ...adminOnly, ctrl.getAnalytics);

// Apps
router.get('/apps', ...adminOnly, ctrl.getApps);
router.post('/apps', ...adminOnly, ctrl.createApp);
router.put('/apps/:id', ...adminOnly, ctrl.updateApp);

// Feature Flags
router.get('/features', ...adminOnly, ctrl.getFeatureFlags);
router.put('/features/:key', ...adminOnly, ctrl.updateFeatureFlag);
router.get('/users/:id/features', ...adminOnly, ctrl.getUserFeatureOverrides);
router.put('/users/:id/features', ...adminOnly, ctrl.updateUserFeatureOverrides);

// Referrals
router.get('/referrals', ...adminOnly, ctrl.getReferralCodes);
router.post('/referrals', ...adminOnly, ctrl.createReferralCode);

// Roles
router.get('/roles', ...adminOnly, ctrl.getRoles);
router.post('/roles', ...adminOnly, ctrl.createRole);
router.post('/roles/assign', ...adminOnly, ctrl.assignRole);

// Audit Logs
router.get('/audit-logs', ...adminOnly, ctrl.getAuditLogs);

// Notifications
router.get('/notifications', ...adminOnly, ctrl.getNotifications);
router.post('/notifications', ...adminOnly, ctrl.createNotification);
router.delete('/notifications/:id', ...adminOnly, ctrl.deleteNotification);

// Support
router.get('/support', ...adminOnly, ctrl.getSupportTickets);
router.put('/support/:id', ...adminOnly, ctrl.updateSupportTicket);

// ============================================================
// Project-Specific Admin Routes (proxy to respective services)
// ============================================================

// Ripplify admin (proxy to main ripplify server on port 3001)
router.get('/ripplify/stats', ...adminOnly, async (req, res) => {
  try { await proxyToRipplify(req, res, 'stats'); }
  catch (error) { console.error('Ripplify proxy stats error:', error.message); res.status(500).json({ message: 'Failed to load ripplify stats' }); }
});
router.get('/ripplify/analytics', ...adminOnly, async (req, res) => {
  try { await proxyToRipplify(req, res, 'analytics'); }
  catch (error) { console.error('Ripplify proxy analytics error:', error.message); res.status(500).json({ message: 'Failed to load ripplify analytics' }); }
});
router.get('/ripplify/users', ...adminOnly, async (req, res) => {
  try { await proxyToRipplify(req, res, 'users'); }
  catch (error) { console.error('Ripplify proxy users error:', error.message); res.status(500).json({ message: 'Failed to load ripplify users' }); }
});
router.get('/ripplify/transactions', ...adminOnly, async (req, res) => {
  try { await proxyToRipplify(req, res, 'transactions'); }
  catch (error) { console.error('Ripplify proxy transactions error:', error.message); res.status(500).json({ message: 'Failed to load ripplify transactions' }); }
});
router.get('/ripplify/payouts', ...adminOnly, async (req, res) => {
  try { await proxyToRipplify(req, res, 'payouts'); }
  catch (error) { console.error('Ripplify proxy payouts error:', error.message); res.status(500).json({ message: 'Failed to load ripplify payouts' }); }
});
router.get('/ripplify/settings', ...adminOnly, async (req, res) => {
  try { await proxyToRipplify(req, res, 'settings'); }
  catch (error) { console.error('Ripplify proxy settings error:', error.message); res.status(500).json({ message: 'Failed to load ripplify settings' }); }
});

// Watchtower admin (proxy to watchtower service)
router.get('/watchtower/stats', ...adminOnly, async (req, res) => {
  try {
    const result = await callService('watchtower', '/internal/admin/stats');
    res.json(result);
  } catch (error) {
    console.error('Watchtower proxy stats error:', error.message);
    res.status(500).json({ message: 'Failed to load watchtower stats' });
  }
});
router.get('/watchtower/analytics', ...adminOnly, async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const result = await callService('watchtower', `/internal/admin/analytics?${qs}`);
    res.json(result);
  } catch (error) {
    console.error('Watchtower proxy analytics error:', error.message);
    res.status(500).json({ message: 'Failed to load watchtower analytics' });
  }
});
router.get('/watchtower/sessions', ...adminOnly, async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const result = await callService('watchtower', `/internal/admin/sessions?${qs}`);
    res.json(result);
  } catch (error) {
    console.error('Watchtower proxy sessions error:', error.message);
    res.status(500).json({ message: 'Failed to load watchtower sessions' });
  }
});
router.get('/watchtower/users', ...adminOnly, async (req, res) => {
  try {
    const result = await callService('watchtower', '/internal/admin/users');
    res.json(result);
  } catch (error) {
    console.error('Watchtower proxy users error:', error.message);
    res.status(500).json({ message: 'Failed to load watchtower users' });
  }
});
router.get('/watchtower/settings', ...adminOnly, async (req, res) => {
  try {
    const result = await callService('watchtower', '/internal/admin/settings');
    res.json(result);
  } catch (error) {
    console.error('Watchtower proxy settings error:', error.message);
    res.status(500).json({ message: 'Failed to load watchtower settings' });
  }
});
router.put('/watchtower/settings', ...adminOnly, async (req, res) => {
  try {
    const result = await callService('watchtower', '/internal/admin/settings', {
      method: 'PUT',
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    console.error('Watchtower proxy settings update error:', error.message);
    res.status(500).json({ message: 'Failed to update watchtower settings' });
  }
});

// Shopalize admin (proxy to shopalize service)
router.get('/shopalize/stats', ...adminOnly, async (req, res) => {
  try {
    const result = await callService('shopalize', '/internal/admin/stats');
    res.json(result);
  } catch (error) {
    console.error('Shopalize proxy stats error:', error.message);
    res.status(500).json({ message: 'Failed to load shopalize stats' });
  }
});
router.get('/shopalize/analytics', ...adminOnly, async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const result = await callService('shopalize', `/internal/admin/analytics?${qs}`);
    res.json(result);
  } catch (error) {
    console.error('Shopalize proxy analytics error:', error.message);
    res.status(500).json({ message: 'Failed to load shopalize analytics' });
  }
});
router.get('/shopalize/projects', ...adminOnly, async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const result = await callService('shopalize', `/internal/admin/projects?${qs}`);
    res.json(result);
  } catch (error) {
    console.error('Shopalize proxy projects error:', error.message);
    res.status(500).json({ message: 'Failed to load shopalize projects' });
  }
});
router.get('/shopalize/orders', ...adminOnly, async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const result = await callService('shopalize', `/internal/admin/orders?${qs}`);
    res.json(result);
  } catch (error) {
    console.error('Shopalize proxy orders error:', error.message);
    res.status(500).json({ message: 'Failed to load shopalize orders' });
  }
});
router.get('/shopalize/settings', ...adminOnly, async (req, res) => {
  try {
    const result = await callService('shopalize', '/internal/admin/settings');
    res.json(result);
  } catch (error) {
    console.error('Shopalize proxy settings error:', error.message);
    res.status(500).json({ message: 'Failed to load shopalize settings' });
  }
});
router.put('/shopalize/settings', ...adminOnly, async (req, res) => {
  try {
    const result = await callService('shopalize', '/internal/admin/settings', {
      method: 'PUT',
      body: req.body,
    });
    res.json(result);
  } catch (error) {
    console.error('Shopalize proxy settings update error:', error.message);
    res.status(500).json({ message: 'Failed to update shopalize settings' });
  }
});

export default router;
