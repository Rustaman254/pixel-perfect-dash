import { Router } from 'express';
import { protectJwt } from '../shared/auth.js';
import * as ctrl from './productController.js';

const router = Router();

router.post('/', protectJwt, ctrl.createProduct);
router.get('/', protectJwt, ctrl.getProducts);
router.get('/:id', protectJwt, ctrl.getProduct);
router.put('/:id', protectJwt, ctrl.updateProduct);
router.delete('/:id', protectJwt, ctrl.deleteProduct);

export default router;
