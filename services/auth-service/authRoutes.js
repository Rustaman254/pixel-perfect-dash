import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protectJwt, internalAuth } from '../shared/auth.js';
import * as auth from './authController.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, try again later' },
});

// Public routes
router.post('/register', auth.register);
router.post('/login', loginLimiter, auth.login);
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
router.get('/internal/users', internalAuth, auth.internalGetUsers);
router.get('/internal/settings', internalAuth, auth.internalGetSettings);
router.get('/internal/currencies', internalAuth, auth.internalGetCurrencies);
router.get('/internal/features/:userId', internalAuth, auth.internalGetUserFeatures);
router.post('/internal/validate-key', internalAuth, auth.internalValidateKey);
router.get('/internal/stats', internalAuth, auth.internalGetStats);

export default router;
