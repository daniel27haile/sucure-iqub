'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/member.controller');
const { authenticate } = require('../middleware/auth');
const { isMember } = require('../middleware/roleGuard');

router.use(authenticate, isMember);

router.get('/dashboard', ctrl.getDashboard);
router.get('/payments', ctrl.getMyPayments);
router.get('/slot', ctrl.getMySlot);
router.get('/penalties', ctrl.getMyPenalties);
router.get('/payout-status', ctrl.getMyPayoutStatus);
router.get('/groups/:groupId/winner-history', ctrl.getWinnerHistory);
router.get('/notifications', ctrl.getNotifications);
router.patch('/notifications/:notificationId/read', ctrl.markNotificationRead);

module.exports = router;
