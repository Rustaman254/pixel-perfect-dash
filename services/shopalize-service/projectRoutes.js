import { Router } from 'express';
import { protectJwt } from '../shared/auth.js';
import * as ctrl from './projectController.js';
import { upgradeToPremium } from './premiumController.js';

const router = Router();

router.post('/', protectJwt, ctrl.createProject);
router.get('/', protectJwt, ctrl.getMyProjects);
router.get('/:id', protectJwt, ctrl.getProject);
router.put('/:id', protectJwt, ctrl.updateProject);
router.delete('/:id', protectJwt, ctrl.deleteProject);
router.post('/:id/publish', protectJwt, ctrl.publishProject);
router.post('/:id/unpublish', protectJwt, ctrl.unpublishProject);
router.post('/:id/upgrade', protectJwt, upgradeToPremium);

export default router;
