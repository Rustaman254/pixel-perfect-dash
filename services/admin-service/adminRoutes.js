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
router.patch('/users/:id', ...adminOnly, ctrl.updateUser);
router.get('/users/:id/roles', ...adminOnly, ctrl.getUserRoles);
router.get('/users/:id/features', ...adminOnly, ctrl.getUserFeatureOverrides);
router.put('/users/:id/features', ...adminOnly, ctrl.updateUserFeatureOverrides);
router.put('/users/:id/status', ...adminOnly, ctrl.updateUserStatus);
router.patch('/users/:id/status', ...adminOnly, ctrl.updateUserStatus);
router.delete('/users/:id', ...adminOnly, ctrl.deleteUser);

// Companies
router.get('/companies', ...adminOnly, ctrl.getCompanies);
router.post('/companies', ...adminOnly, ctrl.createCompany);
router.put('/companies/:id', ...adminOnly, ctrl.updateCompany);
router.delete('/companies/:id', ...adminOnly, ctrl.deleteCompany);

// Permissions
router.get('/permissions', ...adminOnly, ctrl.getPermissions);

// API Keys
router.get('/api-keys', ...adminOnly, ctrl.getApiKeys);
router.post('/api-keys', ...adminOnly, ctrl.createApiKey);
router.delete('/api-keys/:id', ...adminOnly, ctrl.deleteApiKey);

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

// Feature Flags (also accessible as /feature-flags)
router.get('/features', ...adminOnly, ctrl.getFeatureFlags);
router.put('/features/:key', ...adminOnly, ctrl.updateFeatureFlag);
router.get('/feature-flags', ...adminOnly, ctrl.getFeatureFlags);
router.post('/feature-flags', ...adminOnly, ctrl.createFeatureFlag);
router.put('/feature-flags/:id', ...adminOnly, ctrl.updateFeatureFlag);
router.patch('/feature-flags/:id/toggle', ...adminOnly, ctrl.toggleFeatureFlag);
router.delete('/feature-flags/:id', ...adminOnly, ctrl.deleteFeatureFlag);

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
router.put('/notifications/read-all', ...adminOnly, ctrl.markAllNotificationsRead);
router.put('/notifications/:id/read', ...adminOnly, ctrl.markNotificationRead);
router.delete('/notifications/:id', ...adminOnly, ctrl.deleteNotification);

// Ripplify proxy routes
router.get('/ripplify/stats', ...adminOnly, ctrl.getRipplifyStats);
router.get('/ripplify/analytics', ...adminOnly, ctrl.getRipplifyAnalytics);

// Support
router.get('/support', ...adminOnly, ctrl.getSupportTickets);
router.put('/support/:id', ...adminOnly, ctrl.updateSupportTicket);

// ===== SHOPIFY-LIKE SHOPIZE ADMIN ROUTES =====
// Stores
router.get('/shopalize/stores', ...adminOnly, ctrl.getShopalizeStores);
router.get('/shopalize/stores/:id', ...adminOnly, ctrl.getShopalizeStoreDetail);
router.put('/shopalize/stores/:id', ...adminOnly, ctrl.updateShopalizeStore);
router.delete('/shopalize/stores/:id', ...adminOnly, ctrl.deleteShopalizeStore);
router.get('/shopalize/stats', ...adminOnly, ctrl.getShopalizeAdminStats);

// Orders
router.get('/shopalize/orders', ...adminOnly, ctrl.getShopalizeOrders);
router.put('/shopalize/orders/:id', ...adminOnly, ctrl.updateShopalizeOrder);

// Products
router.get('/shopalize/products', ...adminOnly, ctrl.getShopalizeProducts);
router.put('/shopalize/products/:id', ...adminOnly, ctrl.updateShopalizeProduct);
router.delete('/shopalize/products/:id', ...adminOnly, ctrl.deleteShopalizeProduct);

// Customers
router.get('/shopalize/customers', ...adminOnly, ctrl.getShopalizeCustomers);

// Analytics
router.get('/shopalize/analytics', ...adminOnly, ctrl.getShopalizeAnalytics);

// Settings
router.get('/shopalize/settings', ...adminOnly, ctrl.getShopalizeSettings);
router.put('/shopalize/settings', ...adminOnly, ctrl.updateShopalizeSettings);

// Feature Flags
router.get('/shopalize/feature-flags', ...adminOnly, ctrl.getShopalizeFeatureFlags);
router.post('/shopalize/feature-flags', ...adminOnly, ctrl.createShopalizeFeatureFlag);
router.put('/shopalize/feature-flags/:id', ...adminOnly, ctrl.updateShopalizeFeatureFlag);
router.delete('/shopalize/feature-flags/:id', ...adminOnly, ctrl.deleteShopalizeFeatureFlag);

export default router;
