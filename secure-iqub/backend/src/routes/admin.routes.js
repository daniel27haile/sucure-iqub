'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const { createGroupSchema, updateGroupSchema, createSlotSchema, assignSlotMemberSchema, activateCycleSchema } = require('../validators/group.validator');
const { submitPaymentSchema, approvePaymentSchema, rejectPaymentSchema } = require('../validators/payment.validator');

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// ── Groups ────────────────────────────────────────────────────────────────────
router.post('/groups', validate(createGroupSchema), ctrl.createGroup);
router.get('/groups', ctrl.getMyGroups);
router.get('/groups/:groupId', ctrl.getGroupDetails);
router.put('/groups/:groupId', validate(updateGroupSchema), ctrl.updateGroup);
router.post('/groups/:groupId/activate', validate(activateCycleSchema), ctrl.activateCycle);
router.get('/groups/:groupId/analytics', ctrl.getGroupAnalytics);
router.get('/groups/:groupId/leaderboard', ctrl.getOnTimeLeaderboard);

// ── Slots ─────────────────────────────────────────────────────────────────────
router.post('/groups/:groupId/slots', validate(createSlotSchema), ctrl.createSlot);
router.get('/groups/:groupId/slots/:slotId', ctrl.getSlotDetails);
router.post('/groups/:groupId/slots/:slotId/members', validate(assignSlotMemberSchema), ctrl.assignMemberToSlot);
router.delete('/groups/:groupId/slots/:slotId/members/:memberId', ctrl.removeMemberFromSlot);

// ── Members ───────────────────────────────────────────────────────────────────
router.post('/members/invite', ctrl.inviteMember);
router.get('/groups/:groupId/members', ctrl.listGroupMembers);

// ── Payments ──────────────────────────────────────────────────────────────────
router.post('/groups/:groupId/payments', validate(submitPaymentSchema), ctrl.submitPayment);
router.get('/groups/:groupId/payments', ctrl.getMonthlyPayments);
router.patch('/payments/:paymentId/approve', validate(approvePaymentSchema), ctrl.approvePayment);
router.patch('/payments/:paymentId/reject', validate(rejectPaymentSchema), ctrl.rejectPayment);

// ── Spin ──────────────────────────────────────────────────────────────────────
router.post('/groups/:groupId/spin', ctrl.runSpin);
router.get('/groups/:groupId/spin-history', ctrl.getSpinHistory);
router.get('/groups/:groupId/eligible-slots', ctrl.getEligibleSlots);

module.exports = router;
