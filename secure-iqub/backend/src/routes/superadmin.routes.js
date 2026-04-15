'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/superadmin.controller');
const { authenticate } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/roleGuard');

router.use(authenticate, isSuperAdmin);

router.get('/analytics', ctrl.getPlatformAnalytics);
router.post('/admins', ctrl.createAdmin);
router.get('/admins', ctrl.listAdmins);
router.patch('/admins/:adminId/toggle-status', ctrl.toggleAdminStatus);
router.get('/groups', ctrl.listAllGroups);
router.patch('/groups/:groupId/suspend', ctrl.suspendGroup);
router.get('/settings', ctrl.getPlatformSettings);
router.put('/settings', ctrl.updatePlatformSettings);
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
