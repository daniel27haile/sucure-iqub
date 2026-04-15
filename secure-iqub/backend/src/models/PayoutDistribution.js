'use strict';

const mongoose = require('mongoose');

/**
 * PayoutDistribution model.
 * Records how the winning slot's payout is split among its members.
 * One document per member per winning spin.
 *
 * Default rule (proportional):
 *   memberPayout = (memberMonthlyContribution / 2000) × 24000
 *
 * Example:
 *   Member A: $500/month → 25% → $6,000
 *   Member B: $1,500/month → 75% → $18,000
 *   Total: $24,000 ✓
 */
const payoutDistributionSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    spinResult: { type: mongoose.Schema.Types.ObjectId, ref: 'SpinResult', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    monthNumber: { type: Number, required: true },
    memberMonthlyContribution: { type: Number, required: true },
    sharePercent: { type: Number, required: true },
    payoutAmount: { type: Number, required: true },
    splitStrategy: { type: String, enum: ['proportional', 'custom'], default: 'proportional' },
    // Payout disbursement tracking
    disbursed: { type: Boolean, default: false },
    disbursedAt: Date,
    disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    disbursementNotes: String,
  },
  { timestamps: true }
);

payoutDistributionSchema.index({ spinResult: 1, member: 1 }, { unique: true });
payoutDistributionSchema.index({ group: 1, member: 1 });

module.exports = mongoose.model('PayoutDistribution', payoutDistributionSchema);
