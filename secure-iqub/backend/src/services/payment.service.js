'use strict';

const Payment = require('../models/Payment');
const MonthlyCycle = require('../models/MonthlyCycle');
const Slot = require('../models/Slot');
const SlotMemberContribution = require('../models/SlotMemberContribution');
const PlatformSetting = require('../models/PlatformSetting');
const Notification = require('../models/Notification');
const { createAuditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, PAYMENT_STATUS, CYCLE_MONTH_STATUS, SLOT_STATUS } = require('../config/constants');
const { getPaymentTimeliness, calculatePenalty } = require('../utils/dateUtils');

/**
 * Submit a payment for a member for the current month.
 * Called by Admin on behalf of a member.
 */
const submitPayment = async (groupId, adminId, data, req) => {
  const { memberId, monthNumber, submittedAmount, proofUrl, proofFileName, notes } = data;

  const monthlyCycle = await MonthlyCycle.findOne({ group: groupId, monthNumber });
  if (!monthlyCycle) throw Object.assign(new Error('Monthly cycle not found'), { statusCode: 404 });
  if (monthlyCycle.status === CYCLE_MONTH_STATUS.SPIN_COMPLETE) {
    throw Object.assign(new Error('Spin already completed for this month'), { statusCode: 400 });
  }

  // Find the member's contribution record
  const contribution = await SlotMemberContribution.findOne({ group: groupId, member: memberId, isActive: true });
  if (!contribution) throw Object.assign(new Error('Member is not assigned to any slot in this group'), { statusCode: 404 });

  // Get or create payment record
  let payment = await Payment.findOne({ group: groupId, member: memberId, monthNumber });
  if (payment && payment.status === PAYMENT_STATUS.APPROVED) {
    throw Object.assign(new Error('Payment already approved for this month'), { statusCode: 409 });
  }

  // Calculate timeliness and penalty
  const settings = await getPlatformSettings();
  const now = new Date();
  const { timeliness, daysLate } = getPaymentTimeliness(
    now,
    monthlyCycle.dueDate.getDate(),
    monthlyCycle.calendarYear,
    monthlyCycle.calendarMonth
  );
  const penaltyAmount = calculatePenalty(daysLate, settings.penaltyPerDay);

  const paymentData = {
    group: groupId,
    monthlyCycle: monthlyCycle._id,
    slot: contribution.slot,
    member: memberId,
    monthNumber,
    expectedAmount: contribution.monthlyAmount,
    submittedAmount,
    status: PAYMENT_STATUS.SUBMITTED,
    timeliness,
    daysLate,
    penaltyAmount,
    paidAt: now,
    proofUrl,
    proofFileName,
    notes,
  };

  if (payment) {
    Object.assign(payment, paymentData);
    await payment.save();
  } else {
    payment = await Payment.create(paymentData);
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.PAYMENT_SUBMITTED,
    performedBy: req.user,
    targetResource: 'Payment',
    targetId: payment._id,
    group: groupId,
    metadata: { memberId, monthNumber, submittedAmount, timeliness, daysLate, penaltyAmount },
    req,
  });

  return payment;
};

const approvePayment = async (paymentId, adminId, { adminNotes }, req) => {
  const payment = await Payment.findById(paymentId).populate('group');
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  if (payment.group.admin.toString() !== adminId.toString()) {
    throw Object.assign(new Error('Access denied'), { statusCode: 403 });
  }
  if (payment.status === PAYMENT_STATUS.APPROVED) {
    throw Object.assign(new Error('Payment already approved'), { statusCode: 409 });
  }

  const before = payment.toObject();
  payment.status = PAYMENT_STATUS.APPROVED;
  payment.approvedAt = new Date();
  payment.approvedBy = adminId;
  if (adminNotes) payment.adminNotes = adminNotes;
  await payment.save();

  // Update monthly cycle collected amount
  await updateCycleCollectedAmount(payment.group._id, payment.monthNumber);

  // Notify member
  await Notification.create({
    recipient: payment.member,
    group: payment.group._id,
    type: 'payment_approved',
    title: 'Payment Approved',
    message: `Your payment of $${payment.submittedAmount} for Month ${payment.monthNumber} has been approved.`,
    metadata: { paymentId: payment._id },
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.PAYMENT_APPROVED,
    performedBy: req.user,
    targetResource: 'Payment',
    targetId: payment._id,
    group: payment.group._id,
    beforeState: before,
    afterState: payment.toObject(),
    req,
  });

  return payment;
};

const rejectPayment = async (paymentId, adminId, { rejectionReason }, req) => {
  const payment = await Payment.findById(paymentId).populate('group');
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  if (payment.group.admin.toString() !== adminId.toString()) {
    throw Object.assign(new Error('Access denied'), { statusCode: 403 });
  }

  const before = payment.toObject();
  payment.status = PAYMENT_STATUS.REJECTED;
  payment.rejectedAt = new Date();
  payment.rejectedBy = adminId;
  payment.rejectionReason = rejectionReason;
  await payment.save();

  await Notification.create({
    recipient: payment.member,
    group: payment.group._id,
    type: 'payment_rejected',
    title: 'Payment Rejected',
    message: `Your payment for Month ${payment.monthNumber} was rejected. Reason: ${rejectionReason}`,
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.PAYMENT_REJECTED,
    performedBy: req.user,
    targetResource: 'Payment',
    targetId: payment._id,
    group: payment.group._id,
    beforeState: before,
    metadata: { rejectionReason },
    req,
  });

  return payment;
};

/**
 * Check if a slot is "fully funded" for a given month:
 * all member payments for that slot are APPROVED and sum to $2,000.
 */
const isSlotFullyFunded = async (slotId, monthNumber) => {
  const payments = await Payment.find({ slot: slotId, monthNumber, status: PAYMENT_STATUS.APPROVED });
  const total = payments.reduce((sum, p) => sum + p.submittedAmount, 0);
  const slot = await Slot.findById(slotId);
  return total >= slot.requiredMonthlyAmount;
};

/**
 * Get monthly collection summary for a group month.
 */
const getMonthlyCollectionSummary = async (groupId, monthNumber) => {
  const payments = await Payment.find({ group: groupId, monthNumber })
    .populate('member', 'firstName lastName email')
    .populate('slot', 'slotNumber label');

  const monthlyCycle = await MonthlyCycle.findOne({ group: groupId, monthNumber });

  return { payments, monthlyCycle };
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const updateCycleCollectedAmount = async (groupId, monthNumber) => {
  const approvedPayments = await Payment.find({ group: groupId, monthNumber, status: PAYMENT_STATUS.APPROVED });
  const collected = approvedPayments.reduce((sum, p) => sum + p.submittedAmount, 0);
  const penalties = approvedPayments.reduce((sum, p) => sum + (p.penaltyWaived ? 0 : p.penaltyAmount), 0);

  await MonthlyCycle.findOneAndUpdate(
    { group: groupId, monthNumber },
    { collectedAmount: collected, remainingAmount: 24000 - collected, totalPenalties: penalties }
  );
};

const getPlatformSettings = async () => {
  let settings = await PlatformSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await PlatformSetting.create({ key: 'global' });
  }
  return settings;
};

module.exports = {
  submitPayment,
  approvePayment,
  rejectPayment,
  isSlotFullyFunded,
  getMonthlyCollectionSummary,
  getPlatformSettings,
};
