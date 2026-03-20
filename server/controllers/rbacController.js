import { getDb } from '../config/db.js';
import rbacService from '../utils/rbacService.js';

const rbacController = {
    // Roles
    getRoles: async (req, res) => {
        const db = getDb();
        const { tenantId } = req.query;
        let query = `SELECT * FROM roles WHERE is_deprecated = 0`;
        const params = [];
        if (tenantId) {
            query += ` AND (tenant_id = ? OR tenant_id = 'global')`;
            params.push(tenantId);
        }
        const roles = await db.all(query, params);
        res.json(roles);
    },

    getRolePermissions: async (req, res) => {
        const db = getDb();
        const { id } = req.params;
        const perms = await db.all(
            `SELECT permission_id FROM role_permissions WHERE role_id = ?`,
            [id]
        );
        res.json(perms.map(p => p.permission_id));
    },

    createRole: async (req, res) => {
        const { name, description, isSystem, parentRoleId, tenantId } = req.body;
        const roleId = await rbacService.createRole(name, description, isSystem, parentRoleId, tenantId);
        await rbacService.logAction(req.user.id, 'CREATE_ROLE', 'role', roleId, { name, description, parentRoleId }, req.ip, req.headers['user-agent']);
        res.status(201).json({ id: roleId, message: "Role created successfully" });
    },

    deleteRole: async (req, res) => {
        const db = getDb();
        const { id } = req.params;
        const role = await db.get(`SELECT * FROM roles WHERE id = ?`, id);
        
        if (!role) return res.status(404).json({ message: "Role not found" });
        if (role.is_system) return res.status(403).json({ message: "Cannot delete system roles" });

        // Soft delete for enterprise
        await db.run(`UPDATE roles SET is_deprecated = 1 WHERE id = ?`, id);
        await rbacService.logAction(req.user.id, 'DEPRECATE_ROLE', 'role', id, { role }, req.ip, req.headers['user-agent']);
        res.json({ message: "Role deprecated successfully" });
    },

    // Permissions
    getPermissions: async (req, res) => {
        const db = getDb();
        const permissions = await db.all(`SELECT * FROM permissions WHERE is_deprecated = 0 ORDER BY category ASC`);
        res.json(permissions);
    },

    syncRolePermissions: async (req, res) => {
        const { id: roleId } = req.params;
        const { permissionIds } = req.body;
        const db = getDb();

        await db.run(`DELETE FROM role_permissions WHERE role_id = ?`, roleId);
        for (const pId of permissionIds) {
            await rbacService.linkPermissionToRole(roleId, pId);
        }

        await rbacService.logAction(req.user.id, 'SYNC_ROLE_PERMS', 'role', roleId, { permissionIds }, req.ip, req.headers['user-agent']);
        res.json({ message: "Role permissions synchronized" });
    },

    // User Roles
    assignUserRole: async (req, res) => {
        const { userId } = req.params;
        const { roleId, scopeId, scopeType, expiresAt } = req.body;
        await rbacService.assignRoleToUser({
            userId, 
            roleId, 
            scopeId: scopeId || 'global', 
            scopeType: scopeType || 'platform',
            expiresAt,
            assignedBy: req.user.id
        });
        await rbacService.logAction(req.user.id, 'ASSIGN_USER_ROLE', 'user', userId, { roleId, scopeId, expiresAt }, req.ip, req.headers['user-agent']);
        res.json({ message: "Role assigned to user" });
    },

    removeUserRole: async (req, res) => {
        const { userId, roleId } = req.params;
        const { scopeId } = req.query;
        await rbacService.removeRoleFromUser(userId, roleId, scopeId || 'global');
        await rbacService.logAction(req.user.id, 'REMOVE_USER_ROLE', 'user', userId, { roleId, scopeId }, req.ip, req.headers['user-agent']);
        res.json({ message: "Role removed from user" });
    },

    bulkAssignRole: async (req, res) => {
        const { roleId } = req.params;
        const { userIds, scopeId, scopeType } = req.body;
        
        for (const userId of userIds) {
            await rbacService.assignRoleToUser({
                userId,
                roleId,
                scopeId: scopeId || 'global',
                scopeType: scopeType || 'platform',
                assignedBy: req.user.id
            });
        }
        
        await rbacService.logAction(req.user.id, 'BULK_ASSIGN_ROLE', 'role', roleId, { userCount: userIds.length, scopeId }, req.ip, req.headers['user-agent']);
        res.json({ message: `Role assigned to ${userIds.length} users successfully` });
    },

    getUserEffectivePermissions: async (req, res) => {
        const { userId } = req.params;
        const { scopeId } = req.query;
        // Optimization: Admins can view anyone's, users can only view their own
        if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ message: "Unauthorized to view these permissions" });
        }
        const permissions = await rbacService.getUserPermissions(userId, scopeId || 'global');
        res.json(permissions);
    },

    getAuditLogs: async (req, res) => {
        const db = getDb();
        const { actorId, targetId, action, startDate, endDate } = req.query;
        let query = `SELECT * FROM admin_audit_logs WHERE 1=1`;
        const params = [];

        if (actorId) { query += ` AND actor_id = ?`; params.push(actorId); }
        if (targetId) { query += ` AND target_id = ?`; params.push(targetId); }
        if (action) { query += ` AND action = ?`; params.push(action); }
        if (startDate) { query += ` AND created_at >= ?`; params.push(startDate); }
        if (endDate) { query += ` AND created_at <= ?`; params.push(endDate); }

        query += ` ORDER BY created_at DESC LIMIT 100`;
        const logs = await db.all(query, params);
        res.json(logs);
    },

    // Auth Check
    checkPermission: async (req, res) => {
        const { resource, action, scopeId } = req.query;
        const allowed = await rbacService.userHasPermission(req.user.id, resource, action, scopeId || 'global');
        res.json({ allowed });
    }
};

export default rbacController;
