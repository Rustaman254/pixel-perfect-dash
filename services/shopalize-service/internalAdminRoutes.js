import { Router } from 'express';
import { internalAuth } from '../shared/auth.js';
import * as ctrl from './internalAdminController.js';

const router = Router();

const adminAuth = [internalAuth];

// Stores
router.get('/internal/admin/stores', ...adminAuth, ctrl.getAllStores);
router.get('/internal/admin/stores/:id', ...adminAuth, ctrl.getStoreDetail);
router.put('/internal/admin/stores/:id', ...adminAuth, ctrl.updateStore);
router.delete('/internal/admin/stores/:id', ...adminAuth, ctrl.deleteStore);

// Orders
router.get('/internal/admin/orders', ...adminAuth, ctrl.getAllOrders);
router.put('/internal/admin/orders/:id', ...adminAuth, ctrl.updateOrder);

// Products
router.get('/internal/admin/products', ...adminAuth, ctrl.getAllProducts);
router.put('/internal/admin/products/:id', ...adminAuth, ctrl.updateProduct);
router.delete('/internal/admin/products/:id', ...adminAuth, ctrl.deleteProduct);

// Customers
router.get('/internal/admin/customers', ...adminAuth, ctrl.getAllCustomers);

// Analytics
router.get('/internal/admin/analytics', ...adminAuth, ctrl.getAnalytics);

// Settings
router.get('/internal/admin/settings', ...adminAuth, ctrl.getSettings);
router.put('/internal/admin/settings', ...adminAuth, ctrl.updateSettings);

// Feature flags
router.get('/internal/admin/feature-flags', ...adminAuth, ctrl.getFeatureFlags);
router.post('/internal/admin/feature-flags', ...adminAuth, ctrl.createFeatureFlag);
router.put('/internal/admin/feature-flags/:id', ...adminAuth, ctrl.updateFeatureFlag);
router.delete('/internal/admin/feature-flags/:id', ...adminAuth, ctrl.deleteFeatureFlag);

export default router;
