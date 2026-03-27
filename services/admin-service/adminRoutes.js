import { Router } from 'express';
import { protectJwt, admin } from '../shared/auth.js';
import * as ctrl from './adminController.js';

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

export default router;
