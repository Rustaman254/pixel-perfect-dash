import { Router } from 'express';
import * as ctrl from './publicController.js';

const router = Router();

router.get('/store/:slug', ctrl.getStoreBySlug);
router.get('/store/:slug/products/:id', ctrl.getStoreProduct);

export default router;
