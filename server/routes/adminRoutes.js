import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';


const router = express.Router();

// Admin Stats
router.get('/stats', protect, admin, adminController.getPlatformStats);

// Company Stats
router.get('/companies', protect, admin, adminController.getCompanyStats);

// Payout Management
router.get('/payouts', protect, admin, adminController.getAllPayouts);
router.put('/payouts/:id', protect, admin, adminController.updatePayoutStatus);


// User Management
router.get('/users', protect, admin, adminController.getAllUsers);
router.post('/users', protect, admin, adminController.createUser);
router.delete('/users/:id', protect, admin, adminController.deleteUser);
router.patch('/users/:id/status', protect, admin, adminController.updatePlatformStatus);

// API Key Management
router.get('/api-keys', protect, admin, adminController.getApiKeys);
router.post('/api-keys', protect, admin, adminController.createApiKey);
router.delete('/api-keys/:id', protect, admin, adminController.deleteApiKey);
router.patch('/api-keys/:id/status', protect, admin, adminController.updateApiKeyStatus);

// System Settings
router.get('/settings', protect, admin, adminController.getSystemSettings);
router.put('/settings', protect, admin, adminController.updateSystemSetting);

// Supported Currencies
router.get('/currencies', protect, admin, adminController.getSupportedCurrencies);
router.post('/currencies', protect, admin, adminController.createSupportedCurrency);
router.put('/currencies/:code', protect, admin, adminController.updateSupportedCurrency);
router.delete('/currencies/:code', protect, admin, adminController.deleteSupportedCurrency);

// Referral Code Management
router.get('/referrals', protect, admin, adminController.getReferralCodes);
router.post('/referrals', protect, admin, adminController.createReferralCode);
router.delete('/referrals/:id', protect, admin, adminController.deleteReferralCode);
router.patch('/referrals/:id/status', protect, admin, adminController.toggleReferralCodeStatus);

export default router;
