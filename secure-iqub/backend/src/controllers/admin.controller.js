'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const Group = require('../models/Group');
const Slot = require('../models/Slot');
const SlotMemberContribution = require('../models/SlotMemberContribution');
const Payment = require('../models/Payment');
const groupService = require('../services/group.service');
const paymentService = require('../services/payment.service');
const spinService = require('../services/spin.service');
const analyticsService = require('../services/analytics.service');
const { createAuditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, PAYMENT_STATUS, ROLES } = require('../config/constants');
const { success, created, notFound, paginated } = require('../utils/response');

// ── Group management ──────────────────────────────────────────────────────────

const createGroup = async (req, res, next) => {
  try {
    const group = await groupService.createGroup(req.user._id, req.body, req);
    return created(res, group, 'Group created successfully');
  } catch (err) { next(err); }
};

const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ admin: req.user._id }).sort('-createdAt');
    return success(res, groups);
  } catch (err) { next(err); }
};

const getGroupDetails = async (req, res, next) => {
  try {
    const data = await groupService.getGroupWithSlots(req.params.groupId);
    return success(res, data);
  } catch (err) { next(err); }
};

const updateGroup = async (req, res, next) => {
  try {
    const group = await groupService.updateGroup(req.params.groupId, req.user._id, req.body, req);
    return success(res, group, 'Group updated');
  } catch (err) { next(err); }
};

const activateCycle = async (req, res, next) => {
  try {
    const group = await groupService.activateCycle(req.params.groupId, req.user._id, req.body, req);
    return success(res, group, 'Cycle activated successfully');
  } catch (err) { next(err); }
};

// ── Slot management ───────────────────────────────────────────────────────────

const createSlot = async (req, res, next) => {
  try {
    const slot = await groupService.createSlot(req.params.groupId, req.user._id, req.body, req);
    return created(res, slot, 'Slot created');
  } catch (err) { next(err); }
};

const assignMemberToSlot = async (req, res, next) => {
  try {
    const result = await groupService.assignMemberToSlot(
      req.params.groupId,
      req.params.slotId,
      req.user._id,
      req.body,
      req
    );
    return success(res, result, 'Member assigned to slot');
  } catch (err) { next(err); }
};

const removeMemberFromSlot = async (req, res, next) => {
  try {
    const result = await groupService.removeMemberFromSlot(
      req.params.groupId,
      req.params.slotId,
      req.params.memberId,
      req.user._id,
      req
    );
    return success(res, result);
  } catch (err) { next(err); }
};

const getSlotDetails = async (req, res, next) => {
  try {
    const slot = await Slot.findOne({ _id: req.params.slotId, group: req.params.groupId });
    if (!slot) return notFound(res, 'Slot not found');
    const contributions = await SlotMemberContribution.find({ slot: slot._id, isActive: true })
      .populate('member', 'firstName lastName email phone');
    return success(res, { slot, contributions });
  } catch (err) { next(err); }
};

// ── Member management ─────────────────────────────────────────────────────────

const inviteMember = async (req, res, next) => {
  try {
    const { email, firstName, lastName, phone } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');
      user = await User.create({
        email,
        firstName: firstName || 'Invited',
        lastName: lastName || 'Member',
        phone,
        role: ROLES.MEMBER,
        password: crypto.randomBytes(16).toString('hex'), // temporary
        inviteToken: hashedToken,
        inviteTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        createdBy: req.user._id,
      });

      await createAuditLog({
        action: AUDIT_ACTIONS.MEMBER_INVITED,
        performedBy: req.user,
        targetResource: 'User',
        targetId: user._id,
        metadata: { email, invitedBy: req.user.email },
        req,
      });

      // In production: send email with invite link containing inviteToken
      return created(res, { user: user.toSafeObject(), devInviteToken: inviteToken }, 'Member invited');
    }

    return success(res, { user: user.toSafeObject() }, 'Member already exists in the system');
  } catch (err) { next(err); }
};

const listGroupMembers = async (req, res, next) => {
  try {
    const contribs = await SlotMemberContribution.find({ group: req.params.groupId, isActive: true })
      .populate('member', 'firstName lastName email phone isActive')
      .populate('slot', 'slotNumber label status');
    return success(res, contribs);
  } catch (err) { next(err); }
};

// ── Payment management ────────────────────────────────────────────────────────

const submitPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.submitPayment(req.params.groupId, req.user._id, req.body, req);
    return created(res, payment, 'Payment submitted');
  } catch (err) { next(err); }
};

const approvePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.approvePayment(req.params.paymentId, req.user._id, req.body, req);
    return success(res, payment, 'Payment approved');
  } catch (err) { next(err); }
};

const rejectPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.rejectPayment(req.params.paymentId, req.user._id, req.body, req);
    return success(res, payment, 'Payment rejected');
  } catch (err) { next(err); }
};

const getMonthlyPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { monthNumber, page = 1, limit = 50 } = req.query;

    const query = { group: groupId };
    if (monthNumber) query.monthNumber = parseInt(monthNumber);

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('member', 'firstName lastName email')
      .populate('slot', 'slotNumber label')
      .sort({ monthNumber: 1, createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginated(res, payments, page, limit, total);
  } catch (err) { next(err); }
};

// ── Spin ──────────────────────────────────────────────────────────────────────

const runSpin = async (req, res, next) => {
  try {
    const result = await spinService.runSpin(req.params.groupId, req.user._id, req);
    return success(res, result, '🎉 Spin complete!');
  } catch (err) { next(err); }
};

const getSpinHistory = async (req, res, next) => {
  try {
    const history = await spinService.getSpinHistory(req.params.groupId);
    return success(res, history);
  } catch (err) { next(err); }
};

const getEligibleSlots = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findOne({ _id: groupId, admin: req.user._id });
    if (!group) return notFound(res, 'Group not found');
    const slots = await spinService.getEligibleSlots(groupId, group.currentMonth);
    return success(res, { slots, monthNumber: group.currentMonth });
  } catch (err) { next(err); }
};

// ── Analytics ─────────────────────────────────────────────────────────────────

const getGroupAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAdminGroupAnalytics(req.params.groupId);
    return success(res, analytics);
  } catch (err) { next(err); }
};

const getOnTimeLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await analyticsService.getOnTimeLeaderboard(req.params.groupId);
    return success(res, leaderboard);
  } catch (err) { next(err); }
};

module.exports = {
  createGroup, getMyGroups, getGroupDetails, updateGroup, activateCycle,
  createSlot, assignMemberToSlot, removeMemberFromSlot, getSlotDetails,
  inviteMember, listGroupMembers,
  submitPayment, approvePayment, rejectPayment, getMonthlyPayments,
  runSpin, getSpinHistory, getEligibleSlots,
  getGroupAnalytics, getOnTimeLeaderboard,
};
