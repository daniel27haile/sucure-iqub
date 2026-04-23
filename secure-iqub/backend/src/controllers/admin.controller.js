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
const { AUDIT_ACTIONS, PAYMENT_STATUS, ROLES, CYCLE } = require('../config/constants');
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
    // Self-heal: if this admin's account is active, restore any groups that were
    // suspended solely because the admin account was suspended (via the cascade in
    // toggleAdminStatus). Groups suspended independently by the super admin for other
    // reasons are identified by a different suspendReason and are NOT touched here.
    if (req.user.isActive) {
      await Group.updateMany(
        {
          admin: req.user._id,
          status: CYCLE.STATUS.SUSPENDED,
          suspendReason: 'Admin account suspended by Super Admin',
        },
        { $set: { status: CYCLE.STATUS.ACTIVE }, $unset: { suspendedAt: '', suspendReason: '' } }
      );
    }

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

/**
 * GET /admin/members
 * Returns all active members in the platform so admins can assign them to slots.
 */
const listAllMembers = async (req, res, next) => {
  try {
    const members = await User.find({ role: ROLES.MEMBER, isActive: true })
      .select('firstName lastName email phone')
      .sort('firstName');
    return success(res, members);
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

// ── Shared slot leader management ─────────────────────────────────────────────

/**
 * PATCH /admin/groups/:groupId/slots/:slotId/leader
 * Assign a designated leader to a shared slot.
 * The leader must be one of the members already assigned to the slot.
 * Leader is the representative label shown during the Lucky Spin.
 */
const setSlotLeader = async (req, res, next) => {
  try {
    const { groupId, slotId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'memberId is required' });
    }

    const slot = await Slot.findOne({ _id: slotId, group: groupId });
    if (!slot) return notFound(res, 'Slot not found');

    // Verify the member actually belongs to this slot
    const contrib = await SlotMemberContribution.findOne({ slot: slotId, member: memberId, isActive: true })
      .populate('member', 'firstName lastName');
    if (!contrib) {
      return res.status(400).json({ success: false, message: 'The selected member is not assigned to this slot.' });
    }

    const leaderName = `${contrib.member.firstName} ${contrib.member.lastName}`;
    slot.leader = memberId;
    slot.leaderDisplayName = leaderName;
    await slot.save();

    await createAuditLog({
      action: AUDIT_ACTIONS.SLOT_LEADER_ASSIGNED,
      performedBy: req.user,
      targetResource: 'Slot',
      targetId: slot._id,
      group: groupId,
      metadata: { leaderId: memberId, leaderName, slotNumber: slot.slotNumber },
      req,
    });

    return success(res, { slot, leaderName }, `Leader set to ${leaderName}`);
  } catch (err) { next(err); }
};

/**
 * GET /admin/groups/:groupId/slots/:slotId/payout-preview
 * Returns projected payout breakdown for a shared slot.
 * Formula: memberMonthlyAmount × cycleLength = projectedPayout
 */
const getSlotPayoutPreview = async (req, res, next) => {
  try {
    const { groupId, slotId } = req.params;

    const [slot, group, contributions] = await Promise.all([
      Slot.findOne({ _id: slotId, group: groupId }).populate('leader', 'firstName lastName'),
      require('../models/Group').findById(groupId),
      SlotMemberContribution.find({ slot: slotId, isActive: true })
        .populate('member', 'firstName lastName email phone'),
    ]);

    if (!slot) return notFound(res, 'Slot not found');
    if (!group) return notFound(res, 'Group not found');

    const cycleLength = group.cycleLength || 12;
    const totalMonthly = contributions.reduce((s, c) => s + c.monthlyAmount, 0);
    const projectedTotal = slot.payoutAmount || totalMonthly * cycleLength;

    const breakdown = contributions.map((c) => ({
      memberId: c.member._id,
      fullName: `${c.member.firstName} ${c.member.lastName}`,
      email: c.member.email,
      monthlyContribution: c.monthlyAmount,
      sharePercent: c.sharePercent,
      projectedPayout: c.monthlyAmount * cycleLength,
      isLeader: slot.leader && slot.leader._id.toString() === c.member._id.toString(),
    }));

    return success(res, {
      slotNumber: slot.slotNumber,
      label: slot.label,
      leader: slot.leader ? {
        _id: slot.leader._id,
        name: slot.leaderDisplayName || `${slot.leader.firstName} ${slot.leader.lastName}`,
      } : null,
      totalMonthlyContribution: totalMonthly,
      isSlotValid: totalMonthly === 2000,
      remainingToReach2000: Math.max(0, 2000 - totalMonthly),
      cycleLength,
      projectedTotalPayout: projectedTotal,
      members: breakdown,
    });
  } catch (err) { next(err); }
};

// ── Payment summary (who paid / who is unpaid for a given month) ───────────────

/**
 * GET /admin/groups/:groupId/payment-summary?monthNumber=N
 *
 * Returns the per-month payment status broken down by member:
 *   - paid   → member has a payment record for this month
 *   - unpaid → member has NO payment record (drives the dropdown filter)
 *
 * This is the source of truth for:
 *   1. The "Record Payment" dropdown (shows only unpaid members)
 *   2. The "Waiting for Payment" list
 *   3. The "All payments recorded" success banner
 */
const getPaymentSummary = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const monthNumber = parseInt(req.query.monthNumber, 10) || 1;

    // Resolve slot IDs for this group first — avoids relying on the `group` field
    // stored on SlotMemberContribution (which can be miscast in replacement upserts).
    const slots = await Slot.find({ group: groupId }).select('_id');
    const slotIds = slots.map((s) => s._id);

    // All active contributions for this group's slots
    const contributions = slotIds.length
      ? await SlotMemberContribution.find({ slot: { $in: slotIds }, isActive: true })
          .populate('member', 'firstName lastName email')
          .populate('slot', 'slotNumber label')
      : [];

    // Total dollar amount expected this month (sum of each member's monthly share)
    const expectedTotal = contributions.reduce((sum, c) => sum + (c.monthlyAmount || 0), 0);

    // Payment records for this month (any status — submitted, approved, rejected)
    const monthPayments = await Payment.find({ group: groupId, monthNumber });

    // Index by member ID for O(1) lookup
    const paymentByMember = {};
    for (const p of monthPayments) {
      paymentByMember[p.member.toString()] = p;
    }

    const paid = [];
    const unpaid = [];

    for (const c of contributions) {
      if (!c.member) continue; // guard: skip if member document was deleted
      const p = paymentByMember[c.member._id.toString()];
      const base = {
        memberId: c.member._id,
        firstName: c.member.firstName,
        lastName: c.member.lastName,
        email: c.member.email,
        slotNumber: c.slot?.slotNumber,
        slotLabel: c.slot?.label,
        monthlyAmount: c.monthlyAmount,
      };
      if (p) {
        paid.push({
          ...base,
          payment: {
            _id: p._id,
            status: p.status,
            submittedAmount: p.submittedAmount,
            timeliness: p.timeliness,
            penaltyAmount: p.penaltyAmount,
            daysLate: p.daysLate,
          },
        });
      } else {
        unpaid.push(base);
      }
    }

    return success(res, {
      monthNumber,
      expectedTotal,           // dollar amount: sum of all monthly contributions
      totalExpected: contributions.length,  // member count: how many members should pay
      totalPaid: paid.length,
      totalUnpaid: unpaid.length,
      allPaid: contributions.length > 0 && unpaid.length === 0,
      paid,
      unpaid,
    });
  } catch (err) { next(err); }
};

// ── Admin dashboard summary ────────────────────────────────────────────────────

const getDashboardSummary = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const groups = await require('../models/Group').find({ admin: adminId });
    const gIds = groups.map((g) => g._id);

    const [totalMembers, totalSlots, validSlots, invalidSlots] = await Promise.all([
      SlotMemberContribution.distinct('member', { group: { $in: gIds } }).then((ids) => ids.length),
      Slot.countDocuments({ group: { $in: gIds } }),
      Slot.countDocuments({ group: { $in: gIds }, status: { $in: ['valid', 'eligible', 'won'] } }),
      Slot.countDocuments({ group: { $in: gIds }, status: { $in: ['pending', 'invalid'] } }),
    ]);

    return success(res, {
      totalGroups: groups.length,
      activeGroups: groups.filter((g) => g.status === 'active').length,
      totalMembers,
      totalSlots,
      validSlots,
      invalidSlots,
      firstLogin: req.user.firstLogin,
    });
  } catch (err) { next(err); }
};

// ── Dismiss first-login welcome card ──────────────────────────────────────────

const dismissWelcomeCard = async (req, res, next) => {
  try {
    await require('../models/User').findByIdAndUpdate(req.user._id, { firstLogin: false });
    return success(res, null, 'Welcome card dismissed');
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
  setSlotLeader, getSlotPayoutPreview,
  inviteMember, listGroupMembers, listAllMembers,
  submitPayment, approvePayment, rejectPayment, getMonthlyPayments,
  runSpin, getSpinHistory, getEligibleSlots,
  getGroupAnalytics, getOnTimeLeaderboard,
  getPaymentSummary,
  getDashboardSummary, dismissWelcomeCard,
};
