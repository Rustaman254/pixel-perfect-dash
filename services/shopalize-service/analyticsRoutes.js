import { Router } from 'express';
import { protectJwt } from '../shared/auth.js';
import * as ctrl from './analyticsController.js';

const router = Router();

router.get('/overview', protectJwt, ctrl.getOverview);
router.post('/track', ctrl.trackEvent); // public - for store visitors

export default router;
