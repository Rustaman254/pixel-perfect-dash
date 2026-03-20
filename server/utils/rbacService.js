import { getDb } from '../config/db.js';

/**
 * RBAC Service to handle roles, permissions, and audit logging.
 */
const rbacService = {
    // Permission Checks
    async userHasPermission(userId, resource, action, scopeId = 'global') {
        const permissions = await this.getUserPermissions(userId, scopeId);
        return permissions.includes(`${resource}:${action}`);
    },

    async getUserPermissions(userId, scopeId = 'global') {
        const db = getDb();
        
        // 1. Fetch all active role assignments for the user
        const assignments = await db.all(
            `SELECT ur.role_id 
             FROM user_roles ur
             JOIN roles r ON ur.role_id = r.id
             WHERE ur.user_id = ? 
             AND (ur.scope_id = ? OR ur.scope_id = 'global')
             AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
             AND r.is_deprecated = 0`,
            [userId, scopeId]
        );

        const effectivePermissions = new Set();
        
        // 2. Resolve permissions for each role recursively (inheritance)
        for (const asgn of assignments) {
            await this.aggregatePermissions(asgn.role_id, effectivePermissions);
        }

        return Array.from(effectivePermissions);
    },

    async aggregatePermissions(roleId, permissionSet) {
        const db = getDb();
        
        // Get direct permissions
        const perms = await db.all(
            `SELECT p.resource, p.action 
             FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ? AND p.is_deprecated = 0`,
            [roleId]
        );
        
        perms.forEach(p => permissionSet.add(`${p.resource}:${p.action}`));

        // Traverse up inheritance tree
        const role = await db.get(`SELECT parent_role_id FROM roles WHERE id = ?`, [roleId]);
        if (role?.parent_role_id) {
            await this.aggregatePermissions(role.parent_role_id, permissionSet);
        }
    },

    // Role Management
    async createRole(name, description, isSystem = false, parentRoleId = null, tenantId = 'global') {
        const db = getDb();
        const result = await db.run(
            `INSERT INTO roles (name, description, is_system, parent_role_id, tenant_id) VALUES (?, ?, ?, ?, ?)`,
            [name, description, isSystem ? 1 : 0, parentRoleId, tenantId]
        );
        return result.lastID;
    },

    async assignRoleToUser({ userId, roleId, scopeId = 'global', scopeType = 'platform', expiresAt = null, assignedBy = null }) {
        const db = getDb();
        await db.run(
            `INSERT OR REPLACE INTO user_roles (user_id, role_id, scope_id, scope_type, expires_at, assigned_by) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, roleId, scopeId, scopeType, expiresAt, assignedBy]
        );
    },

    async removeRoleFromUser(userId, roleId, scopeId = 'global') {
        const db = getDb();
        await db.run(
            `DELETE FROM user_roles WHERE user_id = ? AND role_id = ? AND scope_id = ?`,
            [userId, roleId, scopeId]
        );
    },

    // Permission Management
    async createPermission(resource, action, description, category = 'general') {
        const db = getDb();
        const result = await db.run(
            `INSERT OR IGNORE INTO permissions (resource, action, description, category) VALUES (?, ?, ?, ?)`,
            [resource, action, description, category]
        );
        return result.lastID;
    },

    async linkPermissionToRole(roleId, permissionId) {
        const db = getDb();
        await db.run(
            `INSERT OR REPLACE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            [roleId, permissionId]
        );
    },

    // Audit Logging
    async logAction(userId, action, entityType, entityId, changes, ipAddress = '', userAgent = '', tenantId = 'global') {
        const db = getDb();
        await db.run(
            `INSERT INTO admin_audit_logs (actor_id, action, target_type, target_id, changes, ip_address, user_agent, tenant_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, entityType, entityId, JSON.stringify(changes), ipAddress, userAgent, tenantId]
        );
    }
};

export default rbacService;
