import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import {
    getPlatformStats, getAllUsers, deleteUser, updatePlatformStatus,
    getApiKeys, createApiKey, deleteApiKey, updateApiKeyStatus,
    getSystemSettings, updateSystemSetting,
    getSupportedCurrencies, createSupportedCurrency, updateSupportedCurrency, deleteSupportedCurrency,
    getReferralCodes, createReferralCode, deleteReferralCode, toggleReferralCodeStatus
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
router.patch('/api-keys/:id/status', protect, admin, updateApiKeyStatus);

// System Settings
router.get('/settings', protect, admin, getSystemSettings);
router.put('/settings', protect, admin, updateSystemSetting);

// Supported Currencies
router.get('/currencies', protect, admin, getSupportedCurrencies);
router.post('/currencies', protect, admin, createSupportedCurrency);
router.put('/currencies/:code', protect, admin, updateSupportedCurrency);
router.delete('/currencies/:code', protect, admin, deleteSupportedCurrency);

// Referral Code Management
router.get('/referrals', protect, admin, getReferralCodes);
router.post('/referrals', protect, admin, createReferralCode);
router.delete('/referrals/:id', protect, admin, deleteReferralCode);
router.patch('/referrals/:id/status', protect, admin, toggleReferralCodeStatus);

export default router;
