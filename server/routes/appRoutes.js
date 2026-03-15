import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import {
    getApps,
    getActiveApps,
    createApp,
    updateApp,
    deleteApp,
    toggleAppStatus
} from '../controllers/appController.js';

const router = express.Router();

router.route('/active').get(getActiveApps);
router.route('/').get(protect, admin, getApps).post(protect, admin, createApp);
router.route('/:id').put(protect, admin, updateApp).delete(protect, admin, deleteApp);
router.route('/:id/status').put(protect, admin, toggleAppStatus);

export default router;
