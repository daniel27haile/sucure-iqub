'use strict';

const mongoose = require('mongoose');
const { CYCLE_MONTH_STATUS } = require('../config/constants');

/**
 * MonthlyCycle model.
 * Represents the state of a single month within a Group cycle.
 * One document is created per month when that month becomes active.
 */
const monthlyCycleSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    monthNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    // Actual calendar year/month this cycle month maps to
    calendarYear: { type: Number, required: true },
    calendarMonth: { type: Number, required: true, min: 1, max: 12 }, // 1=Jan
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(CYCLE_MONTH_STATUS),
      default: CYCLE_MONTH_STATUS.OPEN,
    },
    // Financial summary (updated as payments come in)
    expectedAmount: { type: Number, default: 24000 }, // 12 slots × $2,000
    collectedAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 24000 },
    totalPenalties: { type: Number, default: 0 },
    openedAt: Date,
    collectionCompletedAt: Date,
    spinCompletedAt: Date,
  },
  { timestamps: true }
);

monthlyCycleSchema.index({ group: 1, monthNumber: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyCycle', monthlyCycleSchema);
