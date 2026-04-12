import { getDb } from '../config/db.js';

/**
 * Middleware to check if a feature is enabled globally AND not overridden for the user.
 * Use: requireFeature('payment_links') on routes that map to a feature flag key.
 */
export const requireFeature = (featureKey) => {
    return async (req, res, next) => {
        try {
            // Admin bypass - admins can always access everything
            if (req.user && req.user.role === 'admin') {
                return next();
            }

            const db = getDb();

            // Check per-user override first
            if (req.user?.id) {
                const userOverride = await db.get(
                    `SELECT "isEnabled" FROM "user_feature_overrides" WHERE "userId" = ? AND "featureKey" = ?`,
                    req.user.id, featureKey
                );
                if (userOverride && !userOverride.isEnabled) {
                    return res.status(403).json({
                        message: `The "${featureKey}" feature has been disabled for your account.`,
                        featureDisabled: true,
                        userDisabled: true
                    });
                }
            }

            // Check global feature flag - use the correct table and column names
            const flag = await db.get(`SELECT "isEnabled" FROM "feature_flags" WHERE "key" = ?`, featureKey);

            // If no flag exists, allow by default
            if (!flag) return next();

            if (!flag.isEnabled) {
                return res.status(403).json({
                    message: `The "${featureKey}" feature is currently disabled by the platform administrator.`,
                    featureDisabled: true
                });
            }

            next();
        } catch (error) {
            // On error, fail open to avoid breaking the platform
            console.error(`Feature check error for ${featureKey}:`, error.message);
            next();
        }
    };
};

/**
 * Middleware to check if an unverified user/business has limited access.
 * Unverified users can only access basic features (notifications, support, settings).
 * Verified users get full access.
 */
export const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    // Admin bypass
    if (req.user.role === 'admin') return next();

    // Verified users get full access
    if (req.user.isVerified) return next();

    // Unverified users can only access certain endpoints
    const allowedForUnverified = [
        '/api/auth/me',
        '/api/auth/profile',
        '/api/notifications',
        '/api/support',
    ];

    const path = req.originalUrl || req.url;
    const isAllowed = allowedForUnverified.some(allowed => path.startsWith(allowed));

    if (!isAllowed) {
        return res.status(403).json({
            message: `Your account is not verified. Transaction limit: KES ${(req.user.transactionLimit || 1000).toLocaleString()}. Complete KYC verification in Settings to unlock full access.`,
            unverified: true,
            transactionLimit: req.user.transactionLimit || 1000
        });
    }

    next();
};

/**
 * Check both: user not disabled AND not suspended
 */
export const enforceUserStatus = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    // Disabled users cannot do anything except support/help center
    if (req.user.isDisabled || req.user.accountStatus === 'disabled') {
        const path = req.originalUrl || req.url;
        const allowedForDisabled = ['/api/support', '/api/auth/me', '/api/notifications'];
        const isAllowed = allowedForDisabled.some(a => path.startsWith(a));

        if (!isAllowed) {
            return res.status(403).json({
                message: "Your account has been disabled. You can only contact support via the Help Center or email.",
                accountDisabled: true,
                accountStatus: 'disabled'
            });
        }
    }

    // Suspended users cannot do anything except support/help center
    if (req.user.isSuspended || req.user.accountStatus === 'suspended') {
        const path = req.originalUrl || req.url;
        const allowedForSuspended = ['/api/support', '/api/auth/me', '/api/notifications'];
        const isAllowed = allowedForSuspended.some(a => path.startsWith(a));

        if (!isAllowed) {
            return res.status(403).json({
                message: req.user.suspendReason
                    ? `Account suspended: ${req.user.suspendReason}. Contact support to resolve.`
                    : "Your account has been suspended. Contact support to resolve.",
                accountSuspended: true,
                accountStatus: 'suspended',
                reason: req.user.suspendReason || null
            });
        }
    }

    next();
};
