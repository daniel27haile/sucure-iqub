'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/superadmin.controller');
const { authenticate } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/roleGuard');

router.use(authenticate, isSuperAdmin);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', ctrl.getPlatformAnalytics);

// ── Admin management ──────────────────────────────────────────────────────────
router.post('/admins', ctrl.createAdmin);
router.get('/admins', ctrl.listAdmins);
router.get('/admins/:adminId', ctrl.getAdminDetail);
router.patch('/admins/:adminId/toggle-status', ctrl.toggleAdminStatus);
router.patch('/admins/:adminId', ctrl.updateAdmin);
router.delete('/admins/:adminId', ctrl.deleteAdmin);

// ── Leader / admin request management ────────────────────────────────────────
router.get('/admin-requests/counts', ctrl.getAdminRequestCounts);
router.get('/admin-requests', ctrl.listAdminRequests);
router.get('/admin-requests/:requestId', ctrl.getAdminRequest);
router.patch('/admin-requests/:requestId/status', ctrl.updateAdminRequestStatus);
router.post('/admin-requests/:requestId/approve', ctrl.approveAdminRequest);
router.post('/admin-requests/:requestId/reject', ctrl.rejectAdminRequest);
router.post('/admin-requests/:requestId/send-welcome-email', ctrl.resendWelcomeEmail);

// ── Groups ────────────────────────────────────────────────────────────────────
router.get('/groups', ctrl.listAllGroups);
router.patch('/groups/:groupId/suspend', ctrl.suspendGroup);
router.patch('/groups/:groupId/reactivate', ctrl.reactivateGroup);

// ── Platform settings ─────────────────────────────────────────────────────────
router.get('/settings', ctrl.getPlatformSettings);
router.put('/settings', ctrl.updatePlatformSettings);

// ── Audit logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
