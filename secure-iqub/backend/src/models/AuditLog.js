'use strict';

const mongoose = require('mongoose');

/**
 * AuditLog model.
 * Immutable append-only log of every critical action in the system.
 * Never deleted, never updated. Only created.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },         // e.g. 'spin_completed'
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByEmail: String,                          // snapshot for historical accuracy
    performedByRole: String,
    targetResource: String,                            // e.g. 'Group', 'Slot', 'Payment'
    targetId: mongoose.Schema.Types.ObjectId,
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    // Before/after snapshots for critical mutations
    beforeState: mongoose.Schema.Types.Mixed,
    afterState: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,             // extra context
    ipAddress: String,
    userAgent: String,
    isOverride: { type: Boolean, default: false },     // super-admin override action
    overrideReason: String,
  },
  {
    timestamps: true,
    // Prevent accidental updates
    strict: true,
  }
);

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ group: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
