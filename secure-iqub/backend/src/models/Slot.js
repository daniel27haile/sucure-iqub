'use strict';

const mongoose = require('mongoose');
const { SLOT_STATUS } = require('../config/constants');

/**
 * Slot model.
 *
 * One full iqub slot = $2,000/month.
 * A slot can be owned by one person (single-owner) or
 * shared by two or more people whose monthly contributions sum to exactly $2,000.
 *
 * Spin eligibility:
 *   - Status must be ELIGIBLE (i.e., valid and has not yet won)
 *   - All member contributions for the current month must be APPROVED
 *
 * After winning:
 *   - Status changes to WON
 *   - Slot is excluded from all future spins in this cycle
 *
 * Slot payout = 12 × $2,000 = $24,000 (full cycle length × monthly slot amount)
 */
const slotSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    slotNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 100,
      // e.g. "Slot 1", "Team A", or a custom label set by admin
    },
    // Total required monthly contribution for this slot (must equal $2,000)
    requiredMonthlyAmount: {
      type: Number,
      default: 2000,
    },
    // Sum of all SlotMemberContribution.monthlyAmount for this slot.
    // Must equal requiredMonthlyAmount for the slot to be VALID.
    assignedMonthlyAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(SLOT_STATUS),
      default: SLOT_STATUS.PENDING,
    },
    // Month number (1-12) this slot won. Null = not yet won.
    wonInMonth: {
      type: Number,
      default: null,
    },
    wonAt: Date,
    payoutAmount: {
      type: Number,
      default: 24000,
    },
    // Payout distribution strategy: 'proportional' (default) or 'custom'
    payoutSplitStrategy: {
      type: String,
      enum: ['proportional', 'custom'],
      default: 'proportional',
    },
    // Custom split overrides (only used when payoutSplitStrategy === 'custom')
    // Array of { memberId, fixedAmount }
    customSplitAgreement: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        fixedAmount: Number,
        note: String,
      },
    ],
    isLocked: {
      type: Boolean,
      default: false, // locked once cycle is activated
    },
    // Designated leader for shared slots.
    // The leader must be one of the members in this slot.
    // During spin, the leader's name is shown as the representative label.
    // Payout is still distributed to ALL members based on contribution share.
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Cached leader display name for quick access (avoids extra populate)
    leaderDisplayName: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure slotNumber is unique per group
slotSchema.index({ group: 1, slotNumber: 1 }, { unique: true });
slotSchema.index({ group: 1, status: 1 });

module.exports = mongoose.model('Slot', slotSchema);
