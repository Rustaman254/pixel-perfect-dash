import express from 'express';
import rbacController from '../controllers/rbacController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

// Role Management (Admin only)
router.get('/roles', protect, admin, rbacController.getRoles);
router.post('/roles', protect, admin, rbacController.createRole);
router.get('/roles/:id/permissions', protect, admin, rbacController.getRolePermissions);
router.delete('/roles/:id', protect, admin, rbacController.deleteRole);
router.post('/roles/:id/permissions', protect, admin, rbacController.syncRolePermissions);

// Permission Management
router.get('/permissions', protect, admin, rbacController.getPermissions);

// User Role Assignment
router.post('/users/:userId/roles', protect, admin, rbacController.assignUserRole);
router.delete('/users/:userId/roles/:roleId', protect, admin, rbacController.removeUserRole);
router.post('/roles/:roleId/users/bulk', protect, admin, rbacController.bulkAssignRole);
router.get('/users/:userId/permissions', protect, rbacController.getUserEffectivePermissions);

// Audit & Monitoring
router.get('/audit-logs', protect, admin, rbacController.getAuditLogs);

// Permission Check Endpoint
router.get('/check', protect, rbacController.checkPermission);

export default router;
