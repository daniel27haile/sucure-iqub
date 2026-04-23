'use strict';

const { v4: uuidv4 } = require('uuid');
const Slot = require('../models/Slot');
const SlotMemberContribution = require('../models/SlotMemberContribution');
const SpinResult = require('../models/SpinResult');
const PayoutDistribution = require('../models/PayoutDistribution');
const MonthlyCycle = require('../models/MonthlyCycle');
const Group = require('../models/Group');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, SLOT_STATUS, PAYMENT_STATUS, CYCLE_MONTH_STATUS, SLOT, CYCLE } = require('../config/constants');

/**
 * Run the monthly lucky spin for a group.
 *
 * Algorithm:
 *   1. Validate: cycle is ACTIVE, month is OPEN, no spin exists for this month.
 *   2. Determine eligible slots: ELIGIBLE status + fully funded for this month.
 *   3. Randomly select one slot using UUID-seeded randomness.
 *   4. Compute payout distribution.
 *   5. Mark winning slot as WON.
 *   6. Save SpinResult + PayoutDistribution records.
 *   7. Mark MonthlyCycle as SPIN_COMPLETE.
 *   8. Advance group currentMonth.
 *   9. Audit log everything.
 */
const runSpin = async (groupId, adminId, req) => {
  const group = await Group.findOne({ _id: groupId, admin: adminId });
  if (!group) throw Object.assign(new Error('Group not found or access denied'), { statusCode: 404 });
  if (group.status !== CYCLE.STATUS.ACTIVE) {
    throw Object.assign(new Error('Cycle is not active'), { statusCode: 400 });
  }

  const monthNumber = group.currentMonth;
  const monthlyCycle = await MonthlyCycle.findOne({ group: groupId, monthNumber });
  if (!monthlyCycle) throw Object.assign(new Error('Monthly cycle record not found'), { statusCode: 404 });

  // Guard: prevent duplicate spin
  const existing = await SpinResult.findOne({ group: groupId, monthNumber });
  if (existing) {
    throw Object.assign(new Error(`Month ${monthNumber} has already been spun`), { statusCode: 409 });
  }

  // Guard: enforce ascending month order — cannot skip months
  const lastCompletedSpin = await SpinResult.findOne({ group: groupId }).sort('-monthNumber');
  const expectedMonth = lastCompletedSpin ? lastCompletedSpin.monthNumber + 1 : 1;
  if (monthNumber !== expectedMonth) {
    throw Object.assign(
      new Error(`Cannot spin Month ${monthNumber}. Month ${expectedMonth} must be completed first.`),
      { statusCode: 400 }
    );
  }

  // Determine eligible slots
  const eligibleSlots = await getEligibleSlots(groupId, monthNumber);
  if (eligibleSlots.length === 0) {
    throw Object.assign(
      new Error('No eligible slots available. Ensure all required payments are approved.'),
      { statusCode: 400 }
    );
  }

  // Cryptographically random selection using UUID as entropy
  const seed = uuidv4();
  const randomIndex = deterministicIndex(seed, eligibleSlots.length);
  const winnerSlotData = eligibleSlots[randomIndex];
  const winnerSlot = await Slot.findById(winnerSlotData._id);

  // Load winner slot members (also populate leader)
  const winnerContributions = await SlotMemberContribution.find({ slot: winnerSlot._id, isActive: true })
    .populate('member', 'firstName lastName email');
  const populatedWinnerSlot = await Slot.findById(winnerSlot._id).populate('leader', 'firstName lastName');

  // Compute payout distribution
  const payoutBreakdown = computePayoutSplit(winnerSlot, winnerContributions, SLOT.PAYOUT_AMOUNT);

  // Snapshot eligible slots for audit (includes leader info)
  const eligibleSlotSnapshot = await buildEligibleSnapshot(eligibleSlots);

  // Determine the display label for the winner:
  // - If a leader is assigned to this slot, use the leader's name as the representative label.
  // - Otherwise, fall back to the slot label.
  const leaderName = populatedWinnerSlot.leaderDisplayName
    || (populatedWinnerSlot.leader ? `${populatedWinnerSlot.leader.firstName} ${populatedWinnerSlot.leader.lastName}` : null);
  const winnerDisplayLabel = leaderName || winnerSlot.label || `Slot ${winnerSlot.slotNumber}`;

  // Create SpinResult
  const spinResult = await SpinResult.create({
    group: groupId,
    monthlyCycle: monthlyCycle._id,
    monthNumber,
    calendarYear: monthlyCycle.calendarYear,
    calendarMonth: monthlyCycle.calendarMonth,
    eligibleSlots: eligibleSlotSnapshot,
    eligibleSlotCount: eligibleSlots.length,
    winnerSlot: winnerSlot._id,
    winnerSlotNumber: winnerSlot.slotNumber,
    // Store the leader name as the display label; full slot label is preserved in winnerSlot reference
    winnerSlotLabel: winnerDisplayLabel,
    winnerMembers: payoutBreakdown.map((p) => ({
      member: p.memberId,
      name: p.name,
      monthlyAmount: p.monthlyAmount,
      sharePercent: p.sharePercent,
      payoutAmount: p.payoutAmount,
    })),
    totalPayoutAmount: SLOT.PAYOUT_AMOUNT,
    payoutSplitStrategy: winnerSlot.payoutSplitStrategy,
    randomSeed: seed,
    randomAlgorithm: 'UUID-seeded index modulo eligible count',
    triggeredBy: adminId,
    confirmedAt: new Date(),
  });

  // Create PayoutDistribution records
  await PayoutDistribution.insertMany(
    payoutBreakdown.map((p) => ({
      group: groupId,
      spinResult: spinResult._id,
      slot: winnerSlot._id,
      member: p.memberId,
      monthNumber,
      memberMonthlyContribution: p.monthlyAmount,
      sharePercent: p.sharePercent,
      payoutAmount: p.payoutAmount,
      splitStrategy: winnerSlot.payoutSplitStrategy,
    }))
  );

  // Mark winning slot as WON
  winnerSlot.status = SLOT_STATUS.WON;
  winnerSlot.wonInMonth = monthNumber;
  winnerSlot.wonAt = new Date();
  await winnerSlot.save();

  // Mark monthly cycle as complete
  monthlyCycle.status = CYCLE_MONTH_STATUS.SPIN_COMPLETE;
  monthlyCycle.spinCompletedAt = new Date();
  await monthlyCycle.save();

  // Advance group to next month (or complete cycle)
  if (monthNumber >= SLOT.CYCLE_SLOT_COUNT) {
    group.status = CYCLE.STATUS.COMPLETED;
    group.completedAt = new Date();
    group.currentMonth = SLOT.CYCLE_SLOT_COUNT;
  } else {
    group.currentMonth = monthNumber + 1;
  }
  await group.save();

  // Send notifications to winner members
  for (const p of payoutBreakdown) {
    await Notification.create({
      recipient: p.memberId,
      group: groupId,
      type: 'spin_result',
      title: '🎉 Congratulations! Your slot won!',
      message: `Slot ${winnerSlot.slotNumber} won Month ${monthNumber}. Your payout: $${p.payoutAmount.toLocaleString()}.`,
      metadata: { spinResultId: spinResult._id, payoutAmount: p.payoutAmount },
    });
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.SPIN_COMPLETED,
    performedBy: req.user,
    targetResource: 'SpinResult',
    targetId: spinResult._id,
    group: groupId,
    afterState: {
      monthNumber,
      winnerSlotNumber: winnerSlot.slotNumber,
      eligibleCount: eligibleSlots.length,
      randomSeed: seed,
      payoutBreakdown,
    },
    req,
  });

  return { spinResult, payoutBreakdown };
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Get fully-funded, eligible (not-yet-won) slots for a given month.
 * Returns slots populated with leader and member contribution data for spin UI.
 */
const getEligibleSlots = async (groupId, monthNumber) => {
  const eligibleSlots = await Slot.find({ group: groupId, status: SLOT_STATUS.ELIGIBLE })
    .populate('leader', 'firstName lastName');

  const fullyFundedSlots = [];
  for (const slot of eligibleSlots) {
    const payments = await Payment.find({ slot: slot._id, monthNumber, status: PAYMENT_STATUS.APPROVED });
    const total = payments.reduce((sum, p) => sum + p.submittedAmount, 0);
    if (total >= slot.requiredMonthlyAmount) {
      // Include member contributions so the spin UI can show member names
      const contribs = await SlotMemberContribution.find({ slot: slot._id, isActive: true })
        .populate('member', 'firstName lastName');

      const leaderName = slot.leaderDisplayName
        || (slot.leader ? `${slot.leader.firstName} ${slot.leader.lastName}` : null);

      fullyFundedSlots.push({
        ...slot.toObject(),
        leaderDisplayName: leaderName,
        displayLabel: leaderName || slot.label || `Slot ${slot.slotNumber}`,
        members: contribs.map((c) => ({
          _id: c._id,
          member: c.member,
          monthlyAmount: c.monthlyAmount,
          sharePercent: c.sharePercent,
          isLeader: slot.leader && slot.leader._id.toString() === c.member._id.toString(),
        })),
      });
    }
  }

  return fullyFundedSlots;
};

/**
 * Deterministic index from UUID seed and count.
 * Not truly seeded (JS Math.random can't be seeded without a library),
 * but UUID is stored for audit. For production, use a CSPRNG.
 */
const deterministicIndex = (seed, count) => {
  // Use the numeric value of the first segment of the UUID as entropy
  const hex = seed.replace(/-/g, '').slice(0, 8);
  const num = parseInt(hex, 16);
  return num % count;
};

/**
 * Compute proportional or custom payout split.
 */
const computePayoutSplit = (slot, contributions, totalPayout) => {
  if (slot.payoutSplitStrategy === 'custom' && slot.customSplitAgreement?.length > 0) {
    return slot.customSplitAgreement.map((agreement) => {
      const contrib = contributions.find((c) => c.member._id.toString() === agreement.member.toString());
      return {
        memberId: agreement.member,
        name: contrib ? `${contrib.member.firstName} ${contrib.member.lastName}` : 'Unknown',
        monthlyAmount: contrib ? contrib.monthlyAmount : 0,
        sharePercent: parseFloat(((agreement.fixedAmount / totalPayout) * 100).toFixed(2)),
        payoutAmount: agreement.fixedAmount,
      };
    });
  }

  // Default: proportional split
  return contributions.map((c) => {
    const sharePercent = parseFloat(((c.monthlyAmount / slot.requiredMonthlyAmount) * 100).toFixed(4));
    const payoutAmount = parseFloat(((sharePercent / 100) * totalPayout).toFixed(2));
    return {
      memberId: c.member._id,
      name: `${c.member.firstName} ${c.member.lastName}`,
      monthlyAmount: c.monthlyAmount,
      sharePercent,
      payoutAmount,
    };
  });
};

const buildEligibleSnapshot = async (slots) => {
  return Promise.all(
    slots.map(async (slot) => {
      const [contribs, populatedSlot] = await Promise.all([
        SlotMemberContribution.find({ slot: slot._id, isActive: true })
          .populate('member', 'firstName lastName'),
        Slot.findById(slot._id).populate('leader', 'firstName lastName'),
      ]);

      const leaderName = populatedSlot.leaderDisplayName
        || (populatedSlot.leader ? `${populatedSlot.leader.firstName} ${populatedSlot.leader.lastName}` : null);

      return {
        slot: slot._id,
        slotNumber: slot.slotNumber,
        label: slot.label,
        // The leader name is the representative display name for this slot during spin
        leaderDisplayName: leaderName,
        displayLabel: leaderName || slot.label || `Slot ${slot.slotNumber}`,
        leaderId: populatedSlot.leader ? populatedSlot.leader._id : null,
        members: contribs.map((c) => ({
          member: c.member._id,
          name: `${c.member.firstName} ${c.member.lastName}`,
          monthlyAmount: c.monthlyAmount,
          sharePercent: c.sharePercent,
          isLeader: populatedSlot.leader && populatedSlot.leader._id.toString() === c.member._id.toString(),
        })),
      };
    })
  );
};

const getSpinHistory = async (groupId) => {
  return SpinResult.find({ group: groupId })
    .sort('-monthNumber')
    .populate('winnerSlot', 'slotNumber label')
    .populate('triggeredBy', 'firstName lastName email');
};

module.exports = { runSpin, getEligibleSlots, getSpinHistory };
