import { Router } from 'express';
import { internalAuth } from '../shared/auth.js';
import * as ctrl from './internalController.js';

const router = Router();

router.get('/internal/stores', internalAuth, ctrl.getStores);
router.get('/internal/stats', internalAuth, ctrl.getStoreStats);

export default router;
