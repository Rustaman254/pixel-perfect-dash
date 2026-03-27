import bcrypt from 'bcryptjs';
import { createConnection } from '../shared/db.js';
import { generateToken, internalAuth } from '../shared/auth.js';
import emailService from '../shared/emailService.js';

const db = () => createConnection('auth_db');

// Helper: generate API key
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'rf_';
  for (let i = 0; i < 40; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
};

// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, businessName, referralCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await db()('users').where({ email: email.toLowerCase() }).first();
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [user] = await db()('users')
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName: fullName || '',
        phone: phone || '',
        businessName: businessName || '',
      })
      .returning('*');

    // Auto-create API key for sellers
    if (user.role === 'seller') {
      await db()('api_keys').insert({
        userId: user.id,
        key: generateApiKey(),
        name: 'Default API Key',
        status: 'Active',
      });
    }

    // Process referral code
    if (referralCode) {
      const ref = await db()('referral_codes').where({ code: referralCode, isActive: true }).first();
      if (ref && (ref.maxUses === -1 || ref.currentUses < ref.maxUses)) {
        await db()('referral_usage').insert({
          referralCodeId: ref.id,
          code: referralCode,
          referrerId: ref.userId,
          referredUserId: user.id,
          pointsAwarded: ref.pointsPerReferral,
        });
        await db()('referral_codes').where({ id: ref.id }).increment('currentUses', 1);
        if (ref.userId) {
          await db()('users').where({ id: ref.userId }).increment('referralPoints', ref.pointsPerReferral);
        }
      }
    }

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user).catch(() => {});

    const token = generateToken(user.id, user.email, user.role);

    const { password: _, pin: __, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await db()('users').where({ email: email.toLowerCase() }).first();
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ message: 'Your account has been disabled. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email, user.role);

    const { password: _, pin: __, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await db()('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, pin, ...safeUser } = user;

    // Get user features
    const globalFeatures = await db()('feature_flags').select('key', 'isEnabled');
    const overrides = await db()('user_feature_overrides').where({ userId: user.id });

    const features = {};
    for (const f of globalFeatures) {
      const override = overrides.find(o => o.featureKey === f.key);
      features[f.key] = override ? override.isEnabled : f.isEnabled;
    }

    res.json({ ...safeUser, features });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, businessName, businessLogo, location, idType, idNumber } = req.body;

    const [user] = await db()('users')
      .where({ id: req.user.id })
      .update({
        fullName: fullName ?? undefined,
        phone: phone ?? undefined,
        businessName: businessName ?? undefined,
        businessLogo: businessLogo ?? undefined,
        location: location ?? undefined,
        idType: idType ?? undefined,
        idNumber: idNumber ?? undefined,
      })
      .returning('*');

    const { password, pin, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// POST /api/auth/send-otp
export const sendOTP = async (req, res) => {
  try {
    const { email, phone, type } = req.body;
    const target = email || phone;

    if (!target) return res.status(400).json({ message: 'Email or phone is required' });

    const otp = generateOTP();

    await db()('otps').insert({
      email: email || null,
      phone: phone || null,
      otp,
    });

    if (email) {
      await emailService.sendOTPEmail(email, otp, type || 'verification');
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('SendOTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    const target = email || phone;

    if (!target || !otp) return res.status(400).json({ message: 'Target and OTP are required' });

    const query = email ? { email } : { phone };
    const record = await db()('otps')
      .where(query)
      .where({ otp })
      .orderBy('createdAt', 'desc')
      .first();

    if (!record) return res.status(400).json({ message: 'Invalid OTP' });

    // OTP is valid (15 min expiry)
    const age = Date.now() - new Date(record.createdAt).getTime();
    if (age > 15 * 60 * 1000) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Mark user as verified
    if (email) {
      await db()('users').where({ email }).update({ isVerified: true });
    }

    // Clean up used OTP
    await db()('otps').where({ id: record.id }).delete();

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('VerifyOTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await db()('users').where({ email: email.toLowerCase() }).first();
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists, a reset code has been sent' });
    }

    const otp = generateOTP();
    await db()('otps').insert({ email, otp });
    await emailService.sendPasswordResetEmail(email, otp);

    res.json({ message: 'If an account exists, a reset code has been sent' });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const record = await db()('otps').where({ email, otp }).orderBy('createdAt', 'desc').first();
    if (!record) return res.status(400).json({ message: 'Invalid OTP' });

    const age = Date.now() - new Date(record.createdAt).getTime();
    if (age > 15 * 60 * 1000) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db()('users').where({ email }).update({ password: hashedPassword });
    await db()('otps').where({ id: record.id }).delete();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// POST /api/auth/set-pin
export const setPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4) return res.status(400).json({ message: 'PIN must be 4 digits' });

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    await db()('users').where({ id: req.user.id }).update({ pin: hashedPin });
    res.json({ message: 'PIN set successfully' });
  } catch (error) {
    console.error('SetPin error:', error);
    res.status(500).json({ message: 'Failed to set PIN' });
  }
};

// POST /api/auth/verify-pin
export const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ message: 'PIN is required' });

    const user = await db()('users').where({ id: req.user.id }).first();
    if (!user.pin) return res.status(400).json({ message: 'No PIN set' });

    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) return res.status(401).json({ message: 'Invalid PIN' });

    res.json({ message: 'PIN verified' });
  } catch (error) {
    console.error('VerifyPin error:', error);
    res.status(500).json({ message: 'Failed to verify PIN' });
  }
};

// GET /api/auth/pin-status
export const getPinStatus = async (req, res) => {
  const user = await db()('users').where({ id: req.user.id }).select('pin').first();
  res.json({ hasPin: !!user?.pin });
};

// GET /api/auth/features
export const getFeatures = async (req, res) => {
  try {
    const globalFeatures = await db()('feature_flags').select('key', 'isEnabled');
    const overrides = req.user
      ? await db()('user_feature_overrides').where({ userId: req.user.id })
      : [];

    const features = {};
    for (const f of globalFeatures) {
      const override = overrides.find(o => o.featureKey === f.key);
      features[f.key] = override ? override.isEnabled : f.isEnabled;
    }

    res.json(features);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get features' });
  }
};

// GET /api/auth/fees
export const getFees = async (req, res) => {
  try {
    const fees = await db()('system_settings').where('key', 'like', '%fee%');
    const feeTiers = await db()('fee_tiers').orderBy('minAmount', 'asc');
    const result = {};
    for (const f of fees) result[f.key] = parseFloat(f.value);
    result.feeTiers = feeTiers;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get fees' });
  }
};

// GET /api/auth/validate-referral/:code
export const validateReferral = async (req, res) => {
  try {
    const ref = await db()('referral_codes').where({ code: req.params.code, isActive: true }).first();
    if (!ref) return res.status(404).json({ message: 'Invalid referral code' });
    if (ref.maxUses !== -1 && ref.currentUses >= ref.maxUses) {
      return res.status(400).json({ message: 'Referral code has reached max uses' });
    }
    res.json({ valid: true, discount: ref.discount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate referral' });
  }
};

// INTERNAL: GET /internal/users/:id
export const internalGetUser = async (req, res) => {
  try {
    const user = await db()('users').where({ id: req.params.id }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, pin, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' });
  }
};

// INTERNAL: GET /internal/users
export const internalGetUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    let query = db()('users').select('id', 'email', 'fullName', 'role', 'businessName', 'isVerified', 'isDisabled', 'isSuspended', 'accountStatus', 'createdAt');

    if (search) {
      query = query.where(function() {
        this.where('email', 'ilike', `%${search}%`)
          .orWhere('fullName', 'ilike', `%${search}%`)
          .orWhere('businessName', 'ilike', `%${search}%`);
      });
    }
    if (role) query = query.where({ role });

    const total = await query.clone().count('id as count').first();
    const users = await query.orderBy('createdAt', 'desc').limit(limit).offset((page - 1) * limit);

    res.json({ users, total: parseInt(total.count), page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// INTERNAL: GET /internal/settings
export const internalGetSettings = async (req, res) => {
  try {
    const settings = await db()('system_settings');
    const result = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get settings' });
  }
};

// INTERNAL: GET /internal/currencies
export const internalGetCurrencies = async (req, res) => {
  try {
    const currencies = await db()('supported_currencies').where({ enabled: true });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get currencies' });
  }
};

// INTERNAL: GET /internal/features/:userId
export const internalGetUserFeatures = async (req, res) => {
  try {
    const globalFeatures = await db()('feature_flags').select('key', 'isEnabled');
    const overrides = await db()('user_feature_overrides').where({ userId: req.params.userId });

    const features = {};
    for (const f of globalFeatures) {
      const override = overrides.find(o => o.featureKey === f.key);
      features[f.key] = override ? override.isEnabled : f.isEnabled;
    }
    res.json(features);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get features' });
  }
};

// INTERNAL: POST /internal/validate-key
export const internalValidateKey = async (req, res) => {
  try {
    const { key } = req.body;
    const apiKey = await db()('api_keys').where({ key, status: 'Active' }).first();
    if (!apiKey) return res.status(404).json({ valid: false });
    res.json({ valid: true, userId: apiKey.userId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate key' });
  }
};

// INTERNAL: GET /internal/stats
export const internalGetStats = async (req, res) => {
  try {
    const totalUsers = await db()('users').count('id as count').first();
    const activeUsers = await db()('users').where({ isDisabled: false, isSuspended: false }).count('id as count').first();
    const todaySignups = await db()('users').whereRaw('"createdAt" >= CURRENT_DATE').count('id as count').first();

    res.json({
      totalUsers: parseInt(totalUsers.count),
      activeUsers: parseInt(activeUsers.count),
      todaySignups: parseInt(todaySignups.count),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stats' });
  }
};

export default {
  register, login, getMe, updateProfile,
  sendOTP, verifyOTP, forgotPassword, resetPassword,
  setPin, verifyPin, getPinStatus, getFeatures, getFees, validateReferral,
  internalGetUser, internalGetUsers, internalGetSettings,
  internalGetCurrencies, internalGetUserFeatures, internalValidateKey, internalGetStats,
};
