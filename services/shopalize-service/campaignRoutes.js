import { Router } from 'express';
import { protectJwt } from '../shared/auth.js';
import * as ctrl from './campaignController.js';

const router = Router();

router.get('/', protectJwt, ctrl.getCampaigns);
router.post('/', protectJwt, ctrl.createCampaign);
router.put('/:id', protectJwt, ctrl.updateCampaign);
router.delete('/:id', protectJwt, ctrl.deleteCampaign);
router.post('/:id/send', protectJwt, ctrl.sendCampaign);

export default router;
