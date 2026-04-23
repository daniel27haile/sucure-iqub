'use strict';

const mongoose = require('mongoose');

/**
 * PlatformSetting model.
 * Singleton-style collection. Only one document (key = "global") should exist.
 * Super Admin manages these settings.
 */
const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    penaltyPerDay: { type: Number, default: 20 },          // $20/day late fee
    platformFeePercent: { type: Number, default: 0 },       // % deducted before payout
    awardBadgeEnabled: { type: Boolean, default: true },
    awardThresholdOnTimePercent: { type: Number, default: 100 }, // 100% on-time to earn award
    defaultSlotAmount: { type: Number, default: 2000 },
    defaultCycleLength: { type: Number, default: 12 },
    defaultDueDay: { type: Number, default: 1 },
    collectionWindowDays: { type: Number, default: 3 }, // days 1-N of each month are "on-time"
    // Configurable spin eligibility rule:
    // 'all_approved' = all slot member payments must be APPROVED for slot to spin
    // 'slot_funded' = slot total collected must equal $2,000 (more lenient)
    spinEligibilityRule: {
      type: String,
      enum: ['all_approved', 'slot_funded'],
      default: 'all_approved',
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
