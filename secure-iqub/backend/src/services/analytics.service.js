'use strict';

const Group = require('../models/Group');
const Slot = require('../models/Slot');
const User = require('../models/User');
const Payment = require('../models/Payment');
const SpinResult = require('../models/SpinResult');
const PayoutDistribution = require('../models/PayoutDistribution');
const { PAYMENT_STATUS, PAYMENT_TIMELINESS, CYCLE, SLOT_STATUS, ROLES } = require('../config/constants');

// ── Super Admin analytics ─────────────────────────────────────────────────────

const getPlatformAnalytics = async () => {
  const [
    totalGroups,
    activeGroups,
    totalMembers,
    totalAdmins,
    totalSlots,
    collectedThisMonth,
    totalPenalties,
    completedPayouts,
    latePaymentsThisMonth,
  ] = await Promise.all([
    Group.countDocuments(),
    Group.countDocuments({ status: CYCLE.STATUS.ACTIVE }),
    User.countDocuments({ role: ROLES.MEMBER }),
    User.countDocuments({ role: ROLES.ADMIN }),
    Slot.countDocuments(),
    getTotalCollectedThisMonth(),
    getTotalPenalties(),
    PayoutDistribution.countDocuments({ disbursed: true }),
    Payment.countDocuments({ timeliness: PAYMENT_TIMELINESS.LATE }),
  ]);

  return {
    totalGroups,
    activeGroups,
    totalMembers,
    totalAdmins,
    totalSlots,
    collectedThisMonth,
    totalPenalties,
    completedPayouts,
    latePaymentsThisMonth,
  };
};

// ── Admin dashboard analytics ─────────────────────────────────────────────────

const getAdminGroupAnalytics = async (groupId) => {
  const group = await Group.findById(groupId);
  if (!group) return null;

  const monthNumber = group.currentMonth;

  const [slots, payments, spinResults] = await Promise.all([
    Slot.find({ group: groupId }),
    Payment.find({ group: groupId, monthNumber }),
    SpinResult.find({ group: groupId }).sort('-monthNumber').limit(5),
  ]);

  const eligibleSlots = slots.filter((s) => s.status === SLOT_STATUS.ELIGIBLE).length;
  const wonSlots = slots.filter((s) => s.status === SLOT_STATUS.WON).length;
  const approvedPayments = payments.filter((p) => p.status === PAYMENT_STATUS.APPROVED);
  const collectedThisMonth = approvedPayments.reduce((s, p) => s + p.submittedAmount, 0);
  const lateMembers = payments.filter((p) => p.timeliness === PAYMENT_TIMELINESS.LATE).length;
  const totalPenalties = payments.reduce((s, p) => s + (p.penaltyWaived ? 0 : p.penaltyAmount), 0);

  return {
    groupName: group.name,
    status: group.status,
    currentMonth: monthNumber,
    cycleLength: group.cycleLength,
    eligibleSlots,
    wonSlots,
    expectedThisMonth: group.monthlyPool,
    collectedThisMonth,
    remainingThisMonth: group.monthlyPool - collectedThisMonth,
    lateMembers,
    totalPenalties,
    recentWinners: spinResults,
    completionPercent: Math.round((wonSlots / group.slotCount) * 100),
  };
};

// ── Member analytics ──────────────────────────────────────────────────────────

const getMemberDashboard = async (memberId) => {
  const SlotMemberContribution = require('../models/SlotMemberContribution');
  const MonthlyCycle = require('../models/MonthlyCycle');

  const contributions = await SlotMemberContribution.find({ member: memberId, isActive: true })
    .populate('group', 'name status currentMonth startDate')
    .populate('slot', 'slotNumber label status wonInMonth payoutAmount');

  const result = await Promise.all(
    contributions.map(async (c) => {
      const payments = await Payment.find({ member: memberId, group: c.group._id });
      const totalPaid = payments.filter((p) => p.status === PAYMENT_STATUS.APPROVED).reduce((s, p) => s + p.submittedAmount, 0);
      const totalPenalties = payments.reduce((s, p) => s + (p.penaltyWaived ? 0 : p.penaltyAmount), 0);
      const onTimeCount = payments.filter((p) => p.timeliness === PAYMENT_TIMELINESS.ON_TIME).length;

      const slotWon = c.slot.status === SLOT_STATUS.WON;
      const payoutDistrib = slotWon
        ? await PayoutDistribution.findOne({ member: memberId, slot: c.slot._id })
        : null;

      return {
        group: c.group,
        slot: c.slot,
        myMonthlyContribution: c.monthlyAmount,
        sharePercent: c.sharePercent,
        expectedTotalPayout: payoutDistrib ? payoutDistrib.payoutAmount : (c.sharePercent / 100) * 24000,
        totalPaid,
        totalPenalties,
        onTimePayments: onTimeCount,
        totalPayments: payments.length,
        slotWon,
        wonInMonth: c.slot.wonInMonth,
        actualPayout: payoutDistrib ? payoutDistrib.payoutAmount : null,
        disbursed: payoutDistrib ? payoutDistrib.disbursed : null,
      };
    })
  );

  return result;
};

// ── On-time leaderboard ───────────────────────────────────────────────────────

const getOnTimeLeaderboard = async (groupId) => {
  const payments = await Payment.find({ group: groupId, status: PAYMENT_STATUS.APPROVED })
    .populate('member', 'firstName lastName email');

  const memberMap = {};
  for (const p of payments) {
    const id = p.member._id.toString();
    if (!memberMap[id]) {
      memberMap[id] = {
        member: p.member,
        total: 0,
        onTime: 0,
        late: 0,
        penalties: 0,
      };
    }
    memberMap[id].total++;
    if (p.timeliness === PAYMENT_TIMELINESS.ON_TIME) memberMap[id].onTime++;
    if (p.timeliness === PAYMENT_TIMELINESS.LATE) memberMap[id].late++;
    memberMap[id].penalties += p.penaltyWaived ? 0 : p.penaltyAmount;
  }

  return Object.values(memberMap)
    .map((m) => ({ ...m, onTimePercent: m.total > 0 ? Math.round((m.onTime / m.total) * 100) : 0 }))
    .sort((a, b) => b.onTimePercent - a.onTimePercent);
};

// ── Internal ──────────────────────────────────────────────────────────────────

const getTotalCollectedThisMonth = async () => {
  const now = new Date();
  const payments = await Payment.find({
    status: PAYMENT_STATUS.APPROVED,
    paidAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
  });
  return payments.reduce((s, p) => s + p.submittedAmount, 0);
};

const getTotalPenalties = async () => {
  const payments = await Payment.find({ penaltyAmount: { $gt: 0 }, penaltyWaived: false });
  return payments.reduce((s, p) => s + p.penaltyAmount, 0);
};

module.exports = {
  getPlatformAnalytics,
  getAdminGroupAnalytics,
  getMemberDashboard,
  getOnTimeLeaderboard,
};
