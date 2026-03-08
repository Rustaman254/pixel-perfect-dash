import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import {
    getPlatformStats, getAllUsers, deleteUser, updatePlatformStatus,
    getApiKeys, createApiKey, deleteApiKey
} from '../controllers/adminController.js';

const router = express.Router();

// Admin Stats
router.get('/stats', protect, admin, getPlatformStats);

// User Management
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);
router.patch('/users/:id/status', protect, admin, updatePlatformStatus);

// API Key Management
router.get('/api-keys', protect, admin, getApiKeys);
router.post('/api-keys', protect, admin, createApiKey);
router.delete('/api-keys/:id', protect, admin, deleteApiKey);

export default router;
