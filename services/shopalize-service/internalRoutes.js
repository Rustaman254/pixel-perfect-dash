import { Router } from 'express';
import { internalAuth } from '../shared/auth.js';
import * as ctrl from './internalController.js';
import * as adminCtrl from './adminController.js';

const router = Router();

router.get('/internal/stores', internalAuth, ctrl.getStores);
router.get('/internal/stats', internalAuth, ctrl.getStoreStats);

// Internal admin routes
router.get('/internal/admin/stats', internalAuth, adminCtrl.getStats);
router.get('/internal/admin/analytics', internalAuth, adminCtrl.getAnalytics);
router.get('/internal/admin/projects', internalAuth, adminCtrl.getProjects);
router.get('/internal/admin/orders', internalAuth, adminCtrl.getOrders);
router.get('/internal/admin/settings', internalAuth, adminCtrl.getSettings);
router.put('/internal/admin/settings', internalAuth, adminCtrl.updateSettings);

export default router;
