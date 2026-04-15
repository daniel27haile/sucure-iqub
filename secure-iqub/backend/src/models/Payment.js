'use strict';

const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_TIMELINESS } = require('../config/constants');

/**
 * Payment model.
 * Records a single member's monthly contribution payment for a given cycle month.
 *
 * One Payment document = one member's monthly contribution for one month.
 * A slot is considered "fully funded" for a given month when all member
 * payments inside that slot have been APPROVED and their sum equals $2,000.
 */
const paymentSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    monthlyCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyCycle', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    monthNumber: { type: Number, required: true },
    // Amount this member owes for the month (from SlotMemberContribution.monthlyAmount)
    expectedAmount: { type: Number, required: true },
    // Amount actually submitted
    submittedAmount: { type: Number },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    timeliness: {
      type: String,
      enum: Object.values(PAYMENT_TIMELINESS),
      default: PAYMENT_TIMELINESS.UNPAID,
    },
    daysLate: { type: Number, default: 0 },
    penaltyAmount: { type: Number, default: 0 },
    penaltyWaived: { type: Boolean, default: false },
    penaltyWaivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    penaltyWaivedReason: String,
    paidAt: Date,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    // Payment proof / receipt metadata
    proofUrl: String,
    proofFileName: String,
    notes: String,
    // Admin internal notes
    adminNotes: String,
  },
  { timestamps: true }
);

// Unique: one payment record per member per month per group
paymentSchema.index({ group: 1, member: 1, monthNumber: 1 }, { unique: true });
paymentSchema.index({ slot: 1, monthNumber: 1 });
paymentSchema.index({ group: 1, monthNumber: 1 });
paymentSchema.index({ member: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
