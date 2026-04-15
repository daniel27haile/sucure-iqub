'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const Group = require('../models/Group');
const AuditLog = require('../models/AuditLog');
const PlatformSetting = require('../models/PlatformSetting');
const { createAuditLog } = require('../middleware/auditLogger');
const analyticsService = require('../services/analytics.service');
const { AUDIT_ACTIONS, ROLES, CYCLE } = require('../config/constants');
const { success, created, notFound, paginated } = require('../utils/response');

const getPlatformAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getPlatformAnalytics();
    return success(res, analytics);
  } catch (err) { next(err); }
};

const createAdmin = async (req, res, next) => {
  try {
    const { email, firstName, lastName, phone, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const admin = await User.create({
      email, firstName, lastName, phone,
      password: password || crypto.randomBytes(16).toString('hex'),
      role: ROLES.ADMIN,
      createdBy: req.user._id,
    });

    await createAuditLog({
      action: AUDIT_ACTIONS.ADMIN_CREATED,
      performedBy: req.user,
      targetResource: 'User',
      targetId: admin._id,
      metadata: { email, role: ROLES.ADMIN },
      req,
    });

    return created(res, admin.toSafeObject(), 'Admin created');
  } catch (err) { next(err); }
};

const listAdmins = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await User.countDocuments({ role: ROLES.ADMIN });
    const admins = await User.find({ role: ROLES.ADMIN })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginated(res, admins.map((a) => a.toSafeObject()), page, limit, total);
  } catch (err) { next(err); }
};

const toggleAdminStatus = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.adminId, role: ROLES.ADMIN });
    if (!admin) return notFound(res, 'Admin not found');
    admin.isActive = !admin.isActive;
    await admin.save();
    return success(res, admin.toSafeObject(), `Admin ${admin.isActive ? 'activated' : 'suspended'}`);
  } catch (err) { next(err); }
};

const listAllGroups = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const total = await Group.countDocuments(query);
    const groups = await Group.find(query)
      .populate('admin', 'firstName lastName email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginated(res, groups, page, limit, total);
  } catch (err) { next(err); }
};

const suspendGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return notFound(res, 'Group not found');
    const before = group.toObject();
    group.status = CYCLE.STATUS.SUSPENDED;
    group.suspendedAt = new Date();
    group.suspendReason = req.body.reason || 'Suspended by super admin';
    await group.save();
    await createAuditLog({
      action: AUDIT_ACTIONS.GROUP_SUSPENDED,
      performedBy: req.user,
      targetResource: 'Group',
      targetId: group._id,
      beforeState: before,
      afterState: group.toObject(),
      metadata: { reason: group.suspendReason },
      req,
    });
    return success(res, group, 'Group suspended');
  } catch (err) { next(err); }
};

const getPlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSetting.findOne({ key: 'global' });
    if (!settings) settings = await PlatformSetting.create({ key: 'global' });
    return success(res, settings);
  } catch (err) { next(err); }
};

const updatePlatformSettings = async (req, res, next) => {
  try {
    const allowed = ['penaltyPerDay', 'platformFeePercent', 'awardBadgeEnabled', 'awardThresholdOnTimePercent', 'spinEligibilityRule'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updatedBy = req.user._id;

    const settings = await PlatformSetting.findOneAndUpdate(
      { key: 'global' },
      updates,
      { upsert: true, new: true, runValidators: true }
    );

    await createAuditLog({
      action: AUDIT_ACTIONS.PLATFORM_SETTING_UPDATED,
      performedBy: req.user,
      afterState: updates,
      metadata: { updates },
      req,
    });

    return success(res, settings, 'Platform settings updated');
  } catch (err) { next(err); }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, groupId, userId } = req.query;
    const query = {};
    if (action) query.action = action;
    if (groupId) query.group = groupId;
    if (userId) query.performedBy = userId;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('performedBy', 'firstName lastName email role');

    return paginated(res, logs, page, limit, total);
  } catch (err) { next(err); }
};

module.exports = {
  getPlatformAnalytics, createAdmin, listAdmins, toggleAdminStatus,
  listAllGroups, suspendGroup,
  getPlatformSettings, updatePlatformSettings,
  getAuditLogs,
};
