'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const Slot = require('../models/Slot');
const SlotMemberContribution = require('../models/SlotMemberContribution');
const MonthlyCycle = require('../models/MonthlyCycle');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, SLOT_STATUS, CYCLE, SLOT } = require('../config/constants');

// ── Group CRUD ─────────────────────────────────────────────────────────────────

const createGroup = async (adminId, data, req) => {
  const group = await Group.create({
    ...data,
    admin: adminId,
    createdBy: adminId,
    monthlyPool: SLOT.CYCLE_SLOT_COUNT * SLOT.FULL_AMOUNT,
    slotPayout: SLOT.PAYOUT_AMOUNT,
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.GROUP_CREATED,
    performedBy: req.user,
    targetResource: 'Group',
    targetId: group._id,
    afterState: group.toObject(),
    req,
  });

  return group;
};

const updateGroup = async (groupId, adminId, data, req) => {
  const group = await getGroupOrThrow(groupId, adminId);
  if (group.status !== CYCLE.STATUS.DRAFT) {
    throw Object.assign(new Error('Cannot edit group after cycle has started'), { statusCode: 400 });
  }

  const before = group.toObject();
  Object.assign(group, data);
  await group.save();

  await createAuditLog({
    action: AUDIT_ACTIONS.GROUP_UPDATED,
    performedBy: req.user,
    targetResource: 'Group',
    targetId: group._id,
    beforeState: before,
    afterState: group.toObject(),
    req,
  });

  return group;
};

// ── Slot management ───────────────────────────────────────────────────────────

const createSlot = async (groupId, adminId, data, req) => {
  const group = await getGroupOrThrow(groupId, adminId);
  if (group.status !== CYCLE.STATUS.DRAFT) {
    throw Object.assign(new Error('Cannot add slots after cycle is activated'), { statusCode: 400 });
  }

  const existing = await Slot.countDocuments({ group: groupId });
  if (existing >= SLOT.CYCLE_SLOT_COUNT) {
    throw Object.assign(new Error(`Maximum of ${SLOT.CYCLE_SLOT_COUNT} slots allowed per cycle`), { statusCode: 400 });
  }

  const slot = await Slot.create({
    group: groupId,
    label: data.label || `Slot ${data.slotNumber}`,
    slotNumber: data.slotNumber,
    requiredMonthlyAmount: SLOT.FULL_AMOUNT,
    payoutSplitStrategy: data.payoutSplitStrategy || 'proportional',
    payoutAmount: SLOT.PAYOUT_AMOUNT,
    createdBy: adminId,
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.SLOT_CREATED,
    performedBy: req.user,
    targetResource: 'Slot',
    targetId: slot._id,
    group: groupId,
    afterState: slot.toObject(),
    req,
  });

  return slot;
};

const assignMemberToSlot = async (groupId, slotId, adminId, { memberId, monthlyAmount, notes }, req) => {
  const group = await getGroupOrThrow(groupId, adminId);
  if (group.status !== CYCLE.STATUS.DRAFT) {
    throw Object.assign(new Error('Cannot modify slots after cycle is activated'), { statusCode: 400 });
  }

  const slot = await Slot.findOne({ _id: slotId, group: groupId });
  if (!slot) throw Object.assign(new Error('Slot not found'), { statusCode: 404 });

  const member = await User.findById(memberId);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  // Check if adding this amount would exceed $2,000
  if (slot.assignedMonthlyAmount + monthlyAmount > SLOT.FULL_AMOUNT) {
    throw Object.assign(
      new Error(`Adding $${monthlyAmount} would exceed the slot limit of $${SLOT.FULL_AMOUNT}. Current: $${slot.assignedMonthlyAmount}`),
      { statusCode: 400 }
    );
  }

  // Check if member is already in another slot (unless multi-slot enabled)
  if (!group.allowMultiSlotMembership) {
    const alreadyInSlot = await SlotMemberContribution.findOne({
      group: groupId,
      member: memberId,
      isActive: true,
    });
    if (alreadyInSlot) {
      throw Object.assign(
        new Error('Member is already assigned to a slot in this group. Multi-slot membership is not enabled.'),
        { statusCode: 409 }
      );
    }
  }

  // Create or update the contribution
  const contribution = await SlotMemberContribution.findOneAndUpdate(
    { slot: slotId, member: memberId },
    { group: groupId, slot: slotId, member: memberId, monthlyAmount, notes, isActive: true, createdBy: adminId },
    { upsert: true, new: true, runValidators: true }
  );

  // Recalculate slot assigned amount
  await recalculateSlotAmount(slot);

  await createAuditLog({
    action: AUDIT_ACTIONS.SLOT_MEMBER_ASSIGNED,
    performedBy: req.user,
    targetResource: 'Slot',
    targetId: slot._id,
    group: groupId,
    metadata: { memberId, monthlyAmount, slotNumber: slot.slotNumber },
    req,
  });

  return { slot: await Slot.findById(slotId), contribution };
};

const removeMemberFromSlot = async (groupId, slotId, memberId, adminId, req) => {
  const group = await getGroupOrThrow(groupId, adminId);
  if (group.status !== CYCLE.STATUS.DRAFT) {
    throw Object.assign(new Error('Cannot modify slots after cycle is activated'), { statusCode: 400 });
  }

  const contribution = await SlotMemberContribution.findOneAndDelete({ slot: slotId, member: memberId, group: groupId });
  if (!contribution) throw Object.assign(new Error('Member not found in slot'), { statusCode: 404 });

  const slot = await Slot.findById(slotId);
  await recalculateSlotAmount(slot);

  return { message: 'Member removed from slot' };
};

// ── Cycle activation ──────────────────────────────────────────────────────────

/**
 * Validate and activate the cycle.
 * Pre-activation checks:
 *   1. Exactly 12 slots exist.
 *   2. Every slot has assignedMonthlyAmount === $2,000.
 *   3. No orphan partial slots.
 */
const activateCycle = async (groupId, adminId, { startDate }, req) => {
  const group = await getGroupOrThrow(groupId, adminId);

  if (group.status !== CYCLE.STATUS.DRAFT) {
    throw Object.assign(new Error('Cycle is not in draft state'), { statusCode: 400 });
  }

  // Validation
  const slots = await Slot.find({ group: groupId });
  if (slots.length !== SLOT.CYCLE_SLOT_COUNT) {
    throw Object.assign(
      new Error(`Cycle requires exactly ${SLOT.CYCLE_SLOT_COUNT} slots. Currently has ${slots.length}.`),
      { statusCode: 400 }
    );
  }

  const invalidSlots = slots.filter((s) => s.assignedMonthlyAmount !== SLOT.FULL_AMOUNT);
  if (invalidSlots.length > 0) {
    const details = invalidSlots.map((s) => `Slot ${s.slotNumber} ($${s.assignedMonthlyAmount}/$${SLOT.FULL_AMOUNT})`).join(', ');
    throw Object.assign(
      new Error(`The following slots do not have the required $${SLOT.FULL_AMOUNT}/month: ${details}`),
      { statusCode: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + SLOT.CYCLE_SLOT_COUNT);

  // Mark all slots as eligible
  await Slot.updateMany({ group: groupId }, { status: SLOT_STATUS.ELIGIBLE, isLocked: true });

  // Create MonthlyCycle documents for all 12 months
  const monthlyDocs = [];
  for (let i = 0; i < SLOT.CYCLE_SLOT_COUNT; i++) {
    const cycleDate = new Date(start);
    cycleDate.setMonth(cycleDate.getMonth() + i);
    const dueDate = new Date(cycleDate.getFullYear(), cycleDate.getMonth(), group.dueDay);

    monthlyDocs.push({
      group: groupId,
      monthNumber: i + 1,
      calendarYear: cycleDate.getFullYear(),
      calendarMonth: cycleDate.getMonth() + 1,
      dueDate,
      expectedAmount: SLOT.PAYOUT_AMOUNT, // 12 × $2,000 = $24,000
    });
  }
  await MonthlyCycle.insertMany(monthlyDocs);

  // Activate the group
  group.status = CYCLE.STATUS.ACTIVE;
  group.startDate = start;
  group.endDate = end;
  group.currentMonth = 1;
  group.activatedAt = new Date();
  await group.save();

  await createAuditLog({
    action: AUDIT_ACTIONS.GROUP_ACTIVATED,
    performedBy: req.user,
    targetResource: 'Group',
    targetId: group._id,
    afterState: { status: group.status, startDate, slotCount: slots.length },
    req,
  });

  return group;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getGroupOrThrow = async (groupId, adminId = null) => {
  const query = { _id: groupId };
  if (adminId) query.admin = adminId;
  const group = await Group.findOne(query);
  if (!group) throw Object.assign(new Error('Group not found or access denied'), { statusCode: 404 });
  return group;
};

const recalculateSlotAmount = async (slot) => {
  const contributions = await SlotMemberContribution.find({ slot: slot._id, isActive: true });
  const total = contributions.reduce((sum, c) => sum + c.monthlyAmount, 0);
  slot.assignedMonthlyAmount = total;
  slot.status = total === SLOT.FULL_AMOUNT ? SLOT_STATUS.VALID : total === 0 ? SLOT_STATUS.PENDING : SLOT_STATUS.INVALID;
  await slot.save();
  return slot;
};

const getGroupWithSlots = async (groupId) => {
  const group = await Group.findById(groupId).populate('admin', 'firstName lastName email');
  if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });

  const slots = await Slot.find({ group: groupId }).sort('slotNumber');
  const contributions = await SlotMemberContribution.find({ group: groupId, isActive: true })
    .populate('member', 'firstName lastName email phone');

  const slotsWithMembers = slots.map((slot) => {
    const slotContribs = contributions.filter((c) => c.slot.toString() === slot._id.toString());
    return { ...slot.toObject(), members: slotContribs };
  });

  return { group, slots: slotsWithMembers };
};

module.exports = {
  createGroup,
  updateGroup,
  createSlot,
  assignMemberToSlot,
  removeMemberFromSlot,
  activateCycle,
  getGroupOrThrow,
  getGroupWithSlots,
  recalculateSlotAmount,
};
