import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './watchtowerController.js';
import * as adminCtrl from './adminController.js';

const router = Router();

// Public routes
router.post('/ingest', ctrl.ingestData);

// Protected routes (JWT auth)
router.get('/overview', protectJwt, ctrl.getOverview);
router.get('/sessions', protectJwt, ctrl.getSessions);
router.get('/sessions/:id', protectJwt, ctrl.getSessionDetail);
router.get('/entity/:id', protectJwt, ctrl.getEntityAnalytics);
router.get('/products', protectJwt, ctrl.getProductInsights);
router.get('/dead-clicks', protectJwt, ctrl.getDeadClicks);
router.get('/rage-clicks', protectJwt, ctrl.getRageClicks);

// Internal routes (service-to-service auth)
router.get('/internal/platform-overview', internalAuth, ctrl.getPlatformOverview);
router.post('/internal/events', internalAuth, ctrl.pushEvent);
router.get('/internal/overview', internalAuth, ctrl.internalGetOverview);
router.get('/internal/sessions', internalAuth, ctrl.internalGetSessions);

// Internal admin routes (service-to-service auth)
router.get('/internal/admin/stats', internalAuth, adminCtrl.getStats);
router.get('/internal/admin/analytics', internalAuth, adminCtrl.getAnalytics);
router.get('/internal/admin/sessions', internalAuth, adminCtrl.getSessions);
router.get('/internal/admin/users', internalAuth, adminCtrl.getUsers);
router.get('/internal/admin/settings', internalAuth, adminCtrl.getSettings);
router.put('/internal/admin/settings', internalAuth, adminCtrl.updateSettings);

export default router;
