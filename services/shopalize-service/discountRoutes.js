import { Router } from 'express';
import { protectJwt } from '../shared/auth.js';
import * as ctrl from './discountController.js';

const router = Router();

router.get('/', protectJwt, ctrl.getDiscounts);
router.post('/', protectJwt, ctrl.createDiscount);
router.post('/validate', protectJwt, ctrl.validateDiscount);
router.get('/:id', protectJwt, ctrl.getDiscount);
router.put('/:id', protectJwt, ctrl.updateDiscount);
router.delete('/:id', protectJwt, ctrl.deleteDiscount);

export default router;
