'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    type: {
      type: String,
      enum: [
        'payment_due',
        'payment_late',
        'payment_approved',
        'payment_rejected',
        'spin_scheduled',
        'spin_result',
        'payout_disbursed',
        'cycle_started',
        'cycle_completed',
        'penalty_applied',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
