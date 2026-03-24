import { getDb } from '../config/db.js';

/**
 * Middleware to check if a feature is enabled globally.
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
            const flag = await db.get(`SELECT isEnabled FROM feature_flags WHERE key = ?`, featureKey);

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
            message: "Your account is not verified. Complete verification to access this feature.",
            unverified: true
        });
    }

    next();
};

/**
 * Check both: user not disabled AND feature enabled
 */
export const enforceUserStatus = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.isDisabled) {
        return res.status(403).json({
            message: "Your account has been disabled. Contact support for assistance.",
            accountDisabled: true
        });
    }

    next();
};
