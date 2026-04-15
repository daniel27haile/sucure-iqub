'use strict';

const mongoose = require('mongoose');

/**
 * SlotMemberContribution model.
 *
 * Maps a member (User) to a Slot and records that member's
 * monthly contribution share inside that slot.
 *
 * Rules:
 *   - All SlotMemberContribution.monthlyAmount records for the same slot
 *     must sum to exactly $2,000 (the slot's requiredMonthlyAmount).
 *   - By default a member may only belong to ONE slot per cycle,
 *     unless allowMultiSlotMembership is enabled on the Group.
 *   - Records are LOCKED once the cycle is activated. Changes after
 *     activation require super-admin override and are fully audit-logged.
 *
 * Example — shared slot:
 *   Slot 3 (Group: "Haile Family Iqub")
 *     Member A  →  $500/month   (25% share → $6,000 if slot wins)
 *     Member B  →  $1,500/month (75% share → $18,000 if slot wins)
 *     Total     →  $2,000/month ✓
 */
const slotMemberContributionSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // This member's monthly contribution inside the slot (e.g. 500, 1000, 1500, 2000)
    monthlyAmount: {
      type: Number,
      required: true,
      min: [1, 'Monthly contribution must be at least $1'],
    },
    // Computed share percentage = monthlyAmount / slot.requiredMonthlyAmount
    sharePercent: {
      type: Number, // stored for auditability, recomputed on save
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-compute sharePercent before save
slotMemberContributionSchema.pre('save', function (next) {
  // requiredMonthlyAmount is always 2000; compute share
  this.sharePercent = parseFloat(((this.monthlyAmount / 2000) * 100).toFixed(4));
  next();
});

// Unique: one contribution record per member per slot
slotMemberContributionSchema.index({ slot: 1, member: 1 }, { unique: true });
slotMemberContributionSchema.index({ group: 1, member: 1 });
slotMemberContributionSchema.index({ slot: 1 });

module.exports = mongoose.model('SlotMemberContribution', slotMemberContributionSchema);
