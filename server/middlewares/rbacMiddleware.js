import rbacService from '../utils/rbacService.js';

/**
 * Middleware factory to require a specific permission.
 * @param {string} resource - The resource name (e.g., 'payment_link')
 * @param {string} action - The action name (e.g., 'create')
 */
const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            // Assume req.user is populated by protect middleware
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: "Authentication required" });
            }

            const userId = req.user.id;
            const scopeId = req.headers['x-scope-id'] || 'global';

            const hasPermission = await rbacService.userHasPermission(userId, resource, action, scopeId);

            if (!hasPermission) {
                // Log unauthorized access attempt
                await rbacService.logAction(
                    userId, 
                    'DENIED_ACCESS', 
                    'permission', 
                    `${resource}:${action}`, 
                    { resource, action, scopeId }, 
                    req.ip
                );

                return res.status(403).json({ 
                    message: `Forbidden: You do not have permission to ${action} ${resource}` 
                });
            }

            next();
        } catch (error) {
            console.error(`RBAC Middleware Error: ${error.message}`);
            res.status(500).json({ message: "Internal server error during authorization" });
        }
    };
};

export { requirePermission };
