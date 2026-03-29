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
    safeUser.isSuperAdmin = safeUser.id === 4;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' });
  }
};

// INTERNAL: GET /internal/users
export const internalGetUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const role = req.query.role;

    let baseQuery = db()('users');

    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('email', 'ilike', `%${search}%`)
          .orWhere('fullName', 'ilike', `%${search}%`)
          .orWhere('businessName', 'ilike', `%${search}%`);
      });
    }
    if (role) baseQuery = baseQuery.where({ role });

    const countResult = await baseQuery.clone().count('* as count').first();
    const total = parseInt(countResult.count);

    const users = await baseQuery
      .select('id', 'email', 'fullName', 'role', 'businessName', 'phone', 'kycStatus', 'kybStatus', 'isVerified', 'isDisabled', 'isSuspended', 'accountStatus', 'createdAt')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    // Attach rbac roles to each user
    const userIds = users.map(u => u.id);
    if (userIds.length > 0) {
      const userRoles = await db()('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .whereIn('user_roles.user_id', userIds)
        .select('user_roles.user_id', 'roles.name');
      const rolesByUser = {};
      for (const ur of userRoles) {
        if (!rolesByUser[ur.user_id]) rolesByUser[ur.user_id] = [];
        rolesByUser[ur.user_id].push(ur.name);
      }
      for (const u of users) {
        u.rbacRoles = rolesByUser[u.id] ? rolesByUser[u.id].join(',') : null;
        u.isSuperAdmin = u.id === 4;
      }
    }

    res.json({ users, total, page, limit });
  } catch (error) {
    console.error('InternalGetUsers error:', error.message);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
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
    const globalFeatures = await db()('feature_flags').select('*').orderBy('category').orderBy('name');
    const overrides = await db()('user_feature_overrides').where({ userId: req.params.userId });

    const features = globalFeatures.map(f => {
      const override = overrides.find(o => o.featureKey === f.key);
      return {
        ...f,
        userOverride: !!override,
        effectiveIsEnabled: override ? !!override.isEnabled : !!f.isEnabled,
        overrideReason: override?.reason || '',
      };
    });
    res.json(features);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get features' });
  }
};

// INTERNAL: PUT /internal/features/:userId
export const internalUpdateUserFeature = async (req, res) => {
  try {
    const { userId } = req.params;
    const { featureKey, isEnabled, reason } = req.body;

    const existing = await db()('user_feature_overrides').where({ userId, featureKey }).first();
    if (existing) {
      await db()('user_feature_overrides').where({ userId, featureKey }).update({
        isEnabled: isEnabled ? 1 : 0,
        reason: reason || '',
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db()('user_feature_overrides').insert({
        userId,
        featureKey,
        isEnabled: isEnabled ? 1 : 0,
        reason: reason || '',
      });
    }
    res.json({ message: 'Feature override updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user feature' });
  }
};

// INTERNAL: GET /internal/features
export const internalGetAllFeatureFlags = async (req, res) => {
  try {
    const flags = await db()('feature_flags').select('*').orderBy('category').orderBy('name');
    res.json(flags);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get feature flags' });
  }
};

// INTERNAL: PATCH /internal/features/:id/toggle
export const internalToggleFeatureFlag = async (req, res) => {
  try {
    const { isEnabled } = req.body;
    await db()('feature_flags').where({ id: req.params.id }).update({ isEnabled: isEnabled ? 1 : 0, updatedAt: new Date().toISOString() });
    res.json({ message: `Feature ${isEnabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle feature flag' });
  }
};

// INTERNAL: DELETE /internal/features/:id
export const internalDeleteFeatureFlag = async (req, res) => {
  try {
    await db()('feature_flags').where({ id: req.params.id }).del();
    res.json({ message: 'Feature flag deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete feature flag' });
  }
};

// INTERNAL: PUT /internal/features/:id
export const internalUpdateFeatureFlag = async (req, res) => {
  try {
    const { name, description, category, isEnabled } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (isEnabled !== undefined) updates.isEnabled = isEnabled;
    updates.updatedAt = new Date().toISOString();
    await db()('feature_flags').where({ id: req.params.id }).update(updates);
    const flag = await db()('feature_flags').where({ id: req.params.id }).first();
    res.json(flag);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update feature flag' });
  }
};

// INTERNAL: POST /internal/features
export const internalCreateFeatureFlag = async (req, res) => {
  try {
    const { key, name, description, category } = req.body;
    const [id] = await db()('feature_flags').insert({ key, name, description: description || '', category: category || 'general' });
    const flag = await db()('feature_flags').where({ id }).first();
    res.status(201).json(flag);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create feature flag' });
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

// INTERNAL: DELETE /internal/users/:id
export const internalDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db()('users').where({ id }).delete();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// INTERNAL: PATCH /internal/users/:id
export const internalUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, businessName, location, payoutMethod, kycStatus, kybStatus, transactionLimit } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (businessName !== undefined) updates.businessName = businessName;
    if (location !== undefined) updates.location = location;
    if (payoutMethod !== undefined) updates.payoutMethod = payoutMethod;
    if (kycStatus !== undefined) updates.kycStatus = kycStatus;
    if (kybStatus !== undefined) updates.kybStatus = kybStatus;
    if (transactionLimit !== undefined) updates.transactionLimit = transactionLimit;
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'No fields to update' });
    await db()('users').where({ id }).update(updates);

    // Sync KYC/KYB to user's stores
    if (kycStatus !== undefined || kybStatus !== undefined) {
      const storeUpdates = {};
      if (kycStatus !== undefined) storeUpdates.kycStatus = kycStatus;
      if (kybStatus !== undefined) storeUpdates.kybStatus = kybStatus;
      storeUpdates.updatedAt = new Date().toISOString();
      await db()('stores').where({ userId: id }).update(storeUpdates);
    }

    const user = await db()('users').where({ id }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, pin, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// INTERNAL: PUT /internal/users/:id/status
export const internalUpdateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDisabled, isSuspended, suspendReason, isVerified } = req.body;
    
    const updateData = {};
    if (typeof isDisabled === 'boolean') updateData.isDisabled = isDisabled;
    if (typeof isSuspended === 'boolean') updateData.isSuspended = isSuspended;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    if (suspendReason !== undefined) updateData.suspendReason = suspendReason;
    if (isDisabled) updateData.accountStatus = 'disabled';
    else if (isSuspended) updateData.accountStatus = 'suspended';
    else updateData.accountStatus = 'active';

    await db()('users').where({ id }).update(updateData);
    res.json({ message: 'User status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// INTERNAL: GET /internal/roles
export const internalGetRoles = async (req, res) => {
  try {
    const roles = await db()('roles').where({ is_deprecated: false });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get roles' });
  }
};

// INTERNAL: POST /internal/roles
export const internalCreateRole = async (req, res) => {
  try {
    const { name, description, isSystem, parentRoleId, tenantId } = req.body;
    const [role] = await db()('roles').insert({
      name,
      description: description || '',
      is_system: isSystem || false,
      parent_role_id: parentRoleId || null,
      tenant_id: tenantId || 'global',
      is_deprecated: false,
    }).returning('*');
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create role' });
  }
};

// INTERNAL: POST /internal/roles/assign
export const internalAssignRole = async (req, res) => {
  try {
    const { userId, roleId, scopeId, scopeType, expiresAt } = req.body;
    await db()('user_roles').insert({
      user_id: userId,
      role_id: roleId,
      scope_id: scopeId || 'global',
      scope_type: scopeType || 'platform',
      expires_at: expiresAt || null,
    }).onConflict(['user_id', 'role_id', 'scope_id']).merge();
    res.json({ message: 'Role assigned' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign role' });
  }
};

// INTERNAL: GET /internal/permissions
export const internalGetPermissions = async (req, res) => {
  try {
    const permissions = await db()('permissions').where({ is_deprecated: false });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get permissions' });
  }
};

// INTERNAL: GET /internal/api-keys
export const internalGetApiKeys = async (req, res) => {
  try {
    const keys = await db()('api_keys').select('*').orderBy('createdAt', 'desc');
    res.json(keys || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get API keys' });
  }
};

// INTERNAL: POST /internal/api-keys
export const internalCreateApiKey = async (req, res) => {
  try {
    const { name, userId } = req.body;
    const key = `rf_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const [created] = await db()('api_keys').insert({
      userId: userId || 1,
      name: name || 'API Key',
      key,
      status: 'Active',
      createdAt: new Date(),
    }).returning('*');
    res.json(created);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create API key' });
  }
};

// INTERNAL: DELETE /internal/api-keys/:id
export const internalDeleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    await db()('api_keys').where({ id }).delete();
    res.json({ message: 'API key deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete API key' });
  }
};

// INTERNAL: GET /internal/stores
export const internalGetStores = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = db()('stores').orderBy('createdAt', 'desc');
    if (userId) query = query.where({ userId: parseInt(userId) });
    const stores = await query;
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stores' });
  }
};

// INTERNAL: POST /internal/stores
export const internalCreateStore = async (req, res) => {
  try {
    const { userId, name, description, logo, location, phone, email, category } = req.body;
    if (!userId || !name) return res.status(400).json({ message: 'userId and name are required' });
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = slugify(name);
    const existing = await db()('stores').where({ slug }).first();
    if (existing) slug = `${slug}-${Date.now()}`;
    const [id] = await db()('stores').insert({ userId, name, slug, description: description || '', logo: logo || '', location: location || '', phone: phone || '', email: email || '', category: category || 'general' });
    const store = await db()('stores').where({ id }).first();
    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create store' });
  }
};

// INTERNAL: PUT /internal/stores/:id
export const internalUpdateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logo, location, phone, email, category, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (logo !== undefined) updates.logo = logo;
    if (location !== undefined) updates.location = location;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (category !== undefined) updates.category = category;
    if (isActive !== undefined) updates.isActive = isActive;
    updates.updatedAt = new Date().toISOString();
    await db()('stores').where({ id }).update(updates);
    const store = await db()('stores').where({ id }).first();
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store' });
  }
};

// INTERNAL: DELETE /internal/stores/:id
export const internalDeleteStore = async (req, res) => {
  try {
    await db()('stores').where({ id: req.params.id }).del();
    res.json({ message: 'Store deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete store' });
  }
};

export default {
  register, login, getMe, updateProfile,
  sendOTP, verifyOTP, forgotPassword, resetPassword,
  setPin, verifyPin, getPinStatus, getFeatures, getFees, validateReferral,
  internalGetUser, internalGetUsers, internalUpdateUser, internalGetSettings,
  internalGetCurrencies, internalGetUserFeatures, internalUpdateUserFeature, internalGetAllFeatureFlags,
  internalToggleFeatureFlag, internalDeleteFeatureFlag, internalUpdateFeatureFlag, internalCreateFeatureFlag,
  internalValidateKey, internalGetStats,
  internalDeleteUser, internalUpdateUserStatus, internalGetRoles, internalCreateRole, internalAssignRole, internalGetPermissions,
  internalGetApiKeys, internalCreateApiKey, internalDeleteApiKey,
  internalGetStores, internalCreateStore, internalUpdateStore, internalDeleteStore,
};
