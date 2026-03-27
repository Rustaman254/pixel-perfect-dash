import { Router } from 'express';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as ctrl from './linkController.js';

const router = Router();

// Protected routes
router.post('/', protectJwt, ctrl.createLink);
router.get('/my', protectJwt, ctrl.getMyLinks);
router.put('/:id/status', protectJwt, ctrl.updateLinkStatus);
router.delete('/:id', protectJwt, ctrl.deleteLink);

// Public routes
router.get('/slug/:slug', ctrl.getLinkBySlug);
router.post('/:slug/click', ctrl.incrementClicks);
router.post('/:slug/confirm', ctrl.confirmPayment);
router.post('/:slug/dispute', ctrl.disputePayment);

// Internal routes
router.get('/internal/links', internalAuth, ctrl.internalGetLinks);

export default router;
