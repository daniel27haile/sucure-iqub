'use strict';

const mongoose = require('mongoose');

/**
 * SpinResult model.
 * Stores the immutable result of a monthly lucky spin.
 *
 * Every field is written once and should NEVER be modified afterwards
 * (the spin is final and auditable).
 */
const spinResultSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    monthlyCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyCycle', required: true },
    monthNumber: { type: Number, required: true },
    calendarYear: { type: Number, required: true },
    calendarMonth: { type: Number, required: true },

    // Snapshot of all eligible slots at spin time (for audit)
    eligibleSlots: [
      {
        slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
        slotNumber: Number,
        label: String,
        members: [
          {
            member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: String,
            monthlyAmount: Number,
            sharePercent: Number,
          },
        ],
      },
    ],

    // The winning slot
    winnerSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    winnerSlotNumber: Number,
    winnerSlotLabel: String,

    // Winner slot members at time of spin (snapshot)
    winnerMembers: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        monthlyAmount: Number,
        sharePercent: Number,
        payoutAmount: Number, // actual payout for this member
      },
    ],

    totalPayoutAmount: { type: Number, required: true }, // always 24000 for full cycle
    payoutSplitStrategy: { type: String, enum: ['proportional', 'custom'] },

    // Randomization metadata for auditability
    randomSeed: String,         // UUID used as random seed
    randomAlgorithm: String,    // e.g. "Math.random with UUID seed"
    eligibleSlotCount: Number,

    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    confirmedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate spin for same group+month
spinResultSchema.index({ group: 1, monthNumber: 1 }, { unique: true });

module.exports = mongoose.model('SpinResult', spinResultSchema);
