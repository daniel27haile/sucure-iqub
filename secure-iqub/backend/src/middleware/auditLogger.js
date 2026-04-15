'use strict';

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * createAuditLog — service function to write an audit entry.
 * Called explicitly from controllers for critical actions.
 */
const createAuditLog = async ({
  action,
  performedBy,
  targetResource = null,
  targetId = null,
  group = null,
  beforeState = null,
  afterState = null,
  metadata = null,
  req = null,
  isOverride = false,
  overrideReason = null,
}) => {
  try {
    const entry = {
      action,
      performedBy: performedBy?._id || performedBy,
      performedByEmail: performedBy?.email,
      performedByRole: performedBy?.role,
      targetResource,
      targetId,
      group,
      beforeState,
      afterState,
      metadata,
      isOverride,
      overrideReason,
    };

    if (req) {
      entry.ipAddress = req.ip || req.headers['x-forwarded-for'];
      entry.userAgent = req.headers['user-agent'];
    }

    await AuditLog.create(entry);
  } catch (err) {
    // Audit log failure should not break the main flow
    logger.error('Failed to write audit log:', err.message);
  }
};

module.exports = { createAuditLog };
