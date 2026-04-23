'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const Group = require('../models/Group');
const Slot = require('../models/Slot');
const SlotMemberContribution = require('../models/SlotMemberContribution');
const AuditLog = require('../models/AuditLog');
const PlatformSetting = require('../models/PlatformSetting');
const { createAuditLog } = require('../middleware/auditLogger');
const analyticsService = require('../services/analytics.service');
const adminRequestService = require('../services/adminRequest.service');
const emailService = require('../services/email.service');
const { AUDIT_ACTIONS, ROLES, CYCLE, ADMIN_REQUEST_STATUS } = require('../config/constants');
const { success, created, notFound, paginated, badRequest } = require('../utils/response');

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
    const { page = 1, limit = 20, search, status } = req.query;
    // Exclude soft-deleted admins from the default list
    const query = { role: ROLES.ADMIN, isDeleted: { $ne: true } };
    if (status === 'active') query.isActive = true;
    if (status === 'suspended') query.isActive = false;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ firstName: re }, { lastName: re }, { email: re }];
    }

    const total = await User.countDocuments(query);
    const admins = await User.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Attach counts for members and groups per admin
    const adminsWithCounts = await Promise.all(
      admins.map(async (admin) => {
        const obj = admin.toSafeObject();
        const adminGroups = await Group.find({ admin: admin._id }).select('_id');
        const adminGroupIds = adminGroups.map((g) => g._id);
        const [groupCount, memberCount, activeGroupCount] = await Promise.all([
          Promise.resolve(adminGroups.length),
          SlotMemberContribution.distinct('member', { group: { $in: adminGroupIds } }).then((ids) => ids.length),
          Group.countDocuments({ admin: admin._id, status: CYCLE.STATUS.ACTIVE }),
        ]);
        return { ...obj, stats: { totalGroups: groupCount, totalMembers: memberCount, activeGroups: activeGroupCount } };
      })
    );

    return paginated(res, adminsWithCounts, page, limit, total);
  } catch (err) { next(err); }
};

const getAdminDetail = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.adminId, role: ROLES.ADMIN });
    if (!admin) return notFound(res, 'Admin not found');

    const groups = await Group.find({ admin: admin._id });
    const gIds = groups.map((g) => g._id);
    const memberIds = await SlotMemberContribution.distinct('member', { group: { $in: gIds } });
    const slotCount = await Slot.countDocuments({ group: { $in: gIds } });

    return success(res, {
      admin: admin.toSafeObject(),
      stats: {
        totalGroups: groups.length,
        activeGroups: groups.filter((g) => g.status === CYCLE.STATUS.ACTIVE).length,
        totalMembers: memberIds.length,
        totalSlots: slotCount,
      },
      groups,
    });
  } catch (err) { next(err); }
};

const toggleAdminStatus = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.adminId, role: ROLES.ADMIN, isDeleted: { $ne: true } });
    if (!admin) return notFound(res, 'Admin not found');

    const before = admin.toSafeObject();
    admin.isActive = !admin.isActive;
    await admin.save();

    // Cascade to the admin's groups
    if (!admin.isActive) {
      await Group.updateMany(
        { admin: admin._id, status: CYCLE.STATUS.ACTIVE },
        { status: CYCLE.STATUS.SUSPENDED, suspendedAt: new Date(), suspendReason: 'Admin account suspended by Super Admin' }
      );
    } else {
      await Group.updateMany(
        { admin: admin._id, status: CYCLE.STATUS.SUSPENDED },
        { $set: { status: CYCLE.STATUS.ACTIVE }, $unset: { suspendedAt: '', suspendReason: '' } }
      );
    }

    const action = admin.isActive ? 'admin_reactivated' : 'admin_suspended';
    await createAuditLog({
      action,
      performedBy: req.user,
      targetResource: 'User',
      targetId: admin._id,
      beforeState: before,
      afterState: admin.toSafeObject(),
      metadata: { isActive: admin.isActive },
      req,
    });

    return success(res, admin.toSafeObject(), `Admin ${admin.isActive ? 'activated' : 'suspended'}`);
  } catch (err) { next(err); }
};

/**
 * PATCH /super-admin/admins/:adminId
 * Edit an admin's basic profile (name, email, phone).
 */
const updateAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.adminId, role: ROLES.ADMIN, isDeleted: { $ne: true } });
    if (!admin) return notFound(res, 'Admin not found');

    const { firstName, lastName, email, phone } = req.body;

    // Validate email uniqueness if changed
    if (email && email.toLowerCase() !== admin.email) {
      const conflict = await User.findOne({ email: email.toLowerCase(), _id: { $ne: admin._id } });
      if (conflict) {
        return res.status(409).json({ success: false, message: 'Email already in use by another account' });
      }
    }

    const before = admin.toSafeObject();
    if (firstName) admin.firstName = firstName.trim();
    if (lastName)  admin.lastName  = lastName.trim();
    if (email)     admin.email     = email.toLowerCase().trim();
    if (phone !== undefined) admin.phone = phone ? phone.trim() : undefined;

    await admin.save();

    await createAuditLog({
      action: AUDIT_ACTIONS.ADMIN_UPDATED,
      performedBy: req.user,
      targetResource: 'User',
      targetId: admin._id,
      beforeState: before,
      afterState: admin.toSafeObject(),
      metadata: { fields: Object.keys(req.body) },
      req,
    });

    return success(res, admin.toSafeObject(), 'Admin updated');
  } catch (err) { next(err); }
};

/**
 * DELETE /super-admin/admins/:adminId
 * Soft-delete an admin account.
 * - Cannot delete a super_admin.
 * - Cannot delete yourself.
 * - Sets isDeleted=true, isActive=false so they cannot log in.
 * - All related groups, members, audit logs are preserved.
 */
const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({ _id: req.params.adminId, role: ROLES.ADMIN, isDeleted: { $ne: true } });
    if (!admin) return notFound(res, 'Admin not found');

    // Prevent deleting yourself (in case a super admin is also listed as admin role)
    if (admin._id.toString() === req.user._id.toString()) {
      return badRequest(res, 'You cannot delete your own account');
    }

    const before = admin.toSafeObject();
    admin.isDeleted = true;
    admin.deletedAt = new Date();
    admin.deletedBy = req.user._id;
    admin.isActive = false; // block login via isActive check too
    await admin.save();

    // Suspend all active groups owned by this admin so their data is preserved but inactive
    await Group.updateMany(
      { admin: admin._id, status: CYCLE.STATUS.ACTIVE },
      { status: CYCLE.STATUS.SUSPENDED, suspendedAt: new Date(), suspendReason: 'Admin account deleted by Super Admin' }
    );

    await createAuditLog({
      action: AUDIT_ACTIONS.ADMIN_DELETED,
      performedBy: req.user,
      targetResource: 'User',
      targetId: admin._id,
      beforeState: before,
      metadata: { email: admin.email, deletedAt: admin.deletedAt },
      req,
    });

    return success(res, null, 'Admin deleted');
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

const reactivateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return notFound(res, 'Group not found');
    if (group.status !== CYCLE.STATUS.SUSPENDED) {
      return badRequest(res, 'Group is not suspended');
    }
    const before = group.toObject();
    group.status = CYCLE.STATUS.ACTIVE;
    group.suspendedAt = undefined;
    group.suspendReason = undefined;
    await group.save();
    await createAuditLog({
      action: AUDIT_ACTIONS.GROUP_REACTIVATED,
      performedBy: req.user,
      targetResource: 'Group',
      targetId: group._id,
      beforeState: before,
      afterState: group.toObject(),
      req,
    });
    return success(res, group, 'Group reactivated');
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

// ── Admin request management ──────────────────────────────────────────────────

const listAdminRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const { requests, total } = await adminRequestService.listRequests({ page, limit, status, search });
    return paginated(res, requests, page, limit, total);
  } catch (err) { next(err); }
};

const getAdminRequest = async (req, res, next) => {
  try {
    const request = await adminRequestService.getRequest(req.params.requestId);
    return success(res, request);
  } catch (err) { next(err); }
};

const updateAdminRequestStatus = async (req, res, next) => {
  try {
    const { status, notes, rejectionReason } = req.body;
    const request = await adminRequestService.updateRequestStatus(
      req.params.requestId, req.user, { status, notes, rejectionReason }, req
    );
    return success(res, request, 'Request updated');
  } catch (err) { next(err); }
};

const approveAdminRequest = async (req, res, next) => {
  try {
    const { admin, temporaryPassword, request } = await adminRequestService.approveAndCreateAdmin(
      req.params.requestId, req.user, req
    );

    // Send welcome email immediately after approval
    const approverName = `${req.user.firstName} ${req.user.lastName}`;
    const emailResult = await emailService.sendAdminWelcomeEmail({
      to: admin.email,
      fullName: `${admin.firstName} ${admin.lastName}`,
      email: admin.email,
      temporaryPassword,
      approvedBy: approverName,
    });

    if (emailResult.success) {
      request.emailSent = true;
      request.emailSentAt = new Date();
      await request.save();
      admin.welcomeEmailSent = true;
      await admin.save();
    }

    return created(res, {
      admin: admin.toSafeObject(),
      request,
      emailSent: emailResult.success,
      // Only returned once — not stored in DB for security
      temporaryPassword,
    }, 'Admin account created and welcome email sent');
  } catch (err) { next(err); }
};

const rejectAdminRequest = async (req, res, next) => {
  try {
    const { rejectionReason, notes } = req.body;
    const request = await adminRequestService.updateRequestStatus(
      req.params.requestId,
      req.user,
      { status: ADMIN_REQUEST_STATUS.REJECTED, notes, rejectionReason },
      req
    );
    return success(res, request, 'Request rejected');
  } catch (err) { next(err); }
};

const resendWelcomeEmail = async (req, res, next) => {
  try {
    const result = await adminRequestService.sendWelcomeEmail(req.params.requestId, req.user, req);
    return success(res, result, result.success ? 'Email sent' : 'Email send failed');
  } catch (err) { next(err); }
};

const getAdminRequestCounts = async (req, res, next) => {
  try {
    const counts = await adminRequestService.getRequestCounts();
    return success(res, counts);
  } catch (err) { next(err); }
};

module.exports = {
  getPlatformAnalytics, createAdmin, listAdmins, getAdminDetail, toggleAdminStatus,
  updateAdmin, deleteAdmin,
  listAllGroups, suspendGroup, reactivateGroup,
  getPlatformSettings, updatePlatformSettings,
  getAuditLogs,
  listAdminRequests, getAdminRequest, updateAdminRequestStatus,
  approveAdminRequest, rejectAdminRequest, resendWelcomeEmail, getAdminRequestCounts,
};
