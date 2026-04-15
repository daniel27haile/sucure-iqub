'use strict';

const mongoose = require('mongoose');
const { CYCLE } = require('../config/constants');

/**
 * Group / IqubCycle model.
 *
 * Represents one Secure-Iqub savings cycle.
 *
 * Payout logic:
 *   - A cycle MUST have exactly 12 valid full slots before activation.
 *   - Each slot contributes $2,000/month → monthly pool = 12 × $2,000 = $24,000.
 *   - Each winning slot receives the full $24,000 payout.
 *   - Cycle runs for 12 months; one slot wins per month.
 *   - Total paid in = 12 months × $24,000 = $288,000.
 *   - Total paid out = 12 slots × $24,000 = $288,000.
 *   - The system is perfectly balanced — no shortfall possible.
 */
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Group must have an admin'],
    },
    status: {
      type: String,
      enum: Object.values(CYCLE.STATUS),
      default: CYCLE.STATUS.DRAFT,
    },
    // Cycle parameters
    cycleLength: {
      type: Number,
      default: 12, // months
    },
    slotCount: {
      type: Number,
      default: 12,
    },
    slotAmount: {
      type: Number,
      default: 2000, // USD per month per full slot
    },
    // Monthly payout = slotCount × slotAmount = 12 × 2000 = $24,000
    monthlyPool: {
      type: Number,
      default: 24000,
    },
    // Per-slot payout = cycleLength × slotAmount = 12 × 2000 = $24,000
    slotPayout: {
      type: Number,
      default: 24000,
    },
    dueDay: {
      type: Number,
      default: 1, // 1st of every month
      min: 1,
      max: 28,
    },
    startDate: Date,
    endDate: Date,
    currentMonth: {
      type: Number,
      default: 0, // 0 = not started, 1-12 = active month number
    },
    // Platform fee (taken off the top before payout, if configured)
    platformFeePercent: {
      type: Number,
      default: 0,
    },
    // Allow a member to belong to more than one slot (super-admin override)
    allowMultiSlotMembership: {
      type: Boolean,
      default: false,
    },
    activatedAt: Date,
    completedAt: Date,
    suspendedAt: Date,
    suspendReason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: computed monthly pool
groupSchema.virtual('computedMonthlyPool').get(function () {
  return this.slotCount * this.slotAmount;
});

groupSchema.index({ admin: 1 });
groupSchema.index({ status: 1 });

module.exports = mongoose.model('Group', groupSchema);
