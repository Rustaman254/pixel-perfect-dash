import { Router } from 'express';
import { protectJwt } from '../shared/auth.js';
import * as ctrl from './activityController.js';

const router = Router();

router.get('/', protectJwt, ctrl.getMyActivities);

export default router;
