import { Router } from 'express';
import * as ctrl from './templateController.js';

const router = Router();

router.get('/', ctrl.getTemplates);
router.get('/:slug', ctrl.getTemplate);

export default router;
