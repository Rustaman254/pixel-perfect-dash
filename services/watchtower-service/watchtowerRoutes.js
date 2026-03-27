import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './watchtowerController.js';

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

export default router;
