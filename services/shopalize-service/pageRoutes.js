import { Router } from 'express';
import { protectJwt } from '../shared/auth.js';
import * as ctrl from './pageController.js';

const router = Router();

router.post('/', protectJwt, ctrl.createPage);
router.get('/', protectJwt, ctrl.getPages);
router.get('/:id', protectJwt, ctrl.getPage);
router.put('/:id', protectJwt, ctrl.updatePage);
router.delete('/:id', protectJwt, ctrl.deletePage);

export default router;
