import { Router } from 'express';
// import rateLimit from 'express-rate-limit';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as auth from './authController.js';

const router = Router();

// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   message: { message: 'Too many login attempts, try again later' },
// });

// Public routes
router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/send-otp', auth.sendOTP);
router.post('/verify-otp', auth.verifyOTP);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.get('/validate-referral/:code', auth.validateReferral);

// Protected routes (JWT required)
router.get('/me', protectJwt, auth.getMe);
router.put('/profile', protectJwt, auth.updateProfile);
router.post('/set-pin', protectJwt, auth.setPin);
router.post('/verify-pin', protectJwt, auth.verifyPin);
router.get('/pin-status', protectJwt, auth.getPinStatus);
router.get('/features', protectJwt, auth.getFeatures);
router.get('/fees', protectJwt, auth.getFees);

// Internal service-to-service routes
router.get('/internal/users/:id', internalAuth, auth.internalGetUser);
router.patch('/internal/users/:id', internalAuth, auth.internalUpdateUser);
router.get('/internal/users', internalAuth, auth.internalGetUsers);
router.delete('/internal/users/:id', internalAuth, auth.internalDeleteUser);
router.put('/internal/users/:id/status', internalAuth, auth.internalUpdateUserStatus);
router.get('/internal/settings', internalAuth, auth.internalGetSettings);
router.get('/internal/currencies', internalAuth, auth.internalGetCurrencies);
router.get('/internal/features', internalAuth, auth.internalGetAllFeatureFlags);
router.post('/internal/features', internalAuth, auth.internalCreateFeatureFlag);
router.put('/internal/features/:id', internalAuth, auth.internalUpdateFeatureFlag);
router.patch('/internal/features/:id/toggle', internalAuth, auth.internalToggleFeatureFlag);
router.delete('/internal/features/:id', internalAuth, auth.internalDeleteFeatureFlag);
router.get('/internal/features/:userId', internalAuth, auth.internalGetUserFeatures);
router.put('/internal/features/:userId', internalAuth, auth.internalUpdateUserFeature);
router.post('/internal/validate-key', internalAuth, auth.internalValidateKey);
router.get('/internal/stats', internalAuth, auth.internalGetStats);
router.get('/internal/roles', internalAuth, auth.internalGetRoles);
router.post('/internal/roles', internalAuth, auth.internalCreateRole);
router.post('/internal/roles/assign', internalAuth, auth.internalAssignRole);
router.get('/internal/permissions', internalAuth, auth.internalGetPermissions);
router.get('/internal/api-keys', internalAuth, auth.internalGetApiKeys);
router.post('/internal/api-keys', internalAuth, auth.internalCreateApiKey);
router.delete('/internal/api-keys/:id', internalAuth, auth.internalDeleteApiKey);

// Stores
router.get('/internal/stores', internalAuth, auth.internalGetStores);
router.post('/internal/stores', internalAuth, auth.internalCreateStore);
router.put('/internal/stores/:id', internalAuth, auth.internalUpdateStore);
router.delete('/internal/stores/:id', internalAuth, auth.internalDeleteStore);

export default router;
