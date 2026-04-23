'use strict';

/**
 * AdminRequest Service — Secure Iqub
 *
 * Handles the full lifecycle of leader/admin applications:
 *   submit → review → approve/reject → create admin → send welcome email
 */

const crypto = require('crypto');
const AdminRequest = require('../models/AdminRequest');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');
const emailService = require('./email.service');
const { ADMIN_REQUEST_STATUS, AUDIT_ACTIONS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');

// ── Submit application (public, no auth) ──────────────────────────────────────

/**
 * Create a new leader/admin application from the landing page.
 * Prevents duplicate pending applications from the same email.
 */
const submitApplication = async (data) => {
  const { fullName, email, phone, location, message, preferredContactMethod } = data;

  // Block duplicate pending/new/contacted requests from same email
  const existing = await AdminRequest.findOne({
    email: email.toLowerCase(),
    status: { $in: [ADMIN_REQUEST_STATUS.NEW, ADMIN_REQUEST_STATUS.CONTACTED] },
  });
  if (existing) {
    throw Object.assign(
      new Error('A pending application already exists for this email address.'),
      { statusCode: 409 }
    );
  }

  const request = await AdminRequest.create({
    fullName,
    email,
    phone,
    location,
    message,
    preferredContactMethod: preferredContactMethod || 'email',
  });

  // Send confirmation email (fire-and-forget; don't fail the request if email fails)
  emailService.sendApplicationConfirmation({ to: email, fullName }).catch((err) => {
    logger.warn(`Failed to send application confirmation to ${email}: ${err.message}`);
  });

  return request;
};

// ── List all requests (super admin) ───────────────────────────────────────────

const listRequests = async ({ page = 1, limit = 20, status, search } = {}) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    const re = new RegExp(search, 'i');
    query.$or = [{ fullName: re }, { email: re }, { phone: re }];
  }

  const total = await AdminRequest.countDocuments(query);
  const requests = await AdminRequest.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('contactedBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .populate('convertedAdminId', 'firstName lastName email isActive');

  return { requests, total };
};

// ── Get single request ────────────────────────────────────────────────────────

const getRequest = async (id) => {
  const request = await AdminRequest.findById(id)
    .populate('contactedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .populate('rejectedBy', 'firstName lastName email')
    .populate('convertedAdminId', 'firstName lastName email isActive createdAt');
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  return request;
};

// ── Update status / add notes ─────────────────────────────────────────────────

const updateRequestStatus = async (id, actorUser, { status, notes, rejectionReason }, req) => {
  const request = await AdminRequest.findById(id);
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });

  const before = request.toObject();
  const previousStatus = request.status;

  if (status) {
    // Guard: can't change status of an already-converted request
    if (request.status === ADMIN_REQUEST_STATUS.CONVERTED) {
      throw Object.assign(new Error('This request has already been converted to an admin account.'), { statusCode: 409 });
    }
    request.status = status;

    if (status === ADMIN_REQUEST_STATUS.CONTACTED && !request.contactedAt) {
      request.contactedAt = new Date();
      request.contactedBy = actorUser._id;
    }
    if (status === ADMIN_REQUEST_STATUS.REJECTED) {
      request.rejectedAt = new Date();
      request.rejectedBy = actorUser._id;
      if (rejectionReason) request.rejectionReason = rejectionReason;
    }
  }

  if (notes !== undefined) request.notes = notes;
  await request.save();

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_REQUEST_STATUS_CHANGED,
    performedBy: actorUser,
    targetResource: 'AdminRequest',
    targetId: request._id,
    beforeState: before,
    afterState: request.toObject(),
    metadata: { previousStatus, newStatus: status },
    req,
  });

  return request;
};

// ── Approve: create admin account ─────────────────────────────────────────────

/**
 * Approve a request and create the admin account.
 * Returns the new admin user and the plain-text temporary password.
 */
const approveAndCreateAdmin = async (id, actorUser, req) => {
  const request = await AdminRequest.findById(id);
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });

  if (request.status === ADMIN_REQUEST_STATUS.CONVERTED) {
    throw Object.assign(new Error('Admin account already created from this request.'), { statusCode: 409 });
  }
  if (request.status === ADMIN_REQUEST_STATUS.REJECTED) {
    throw Object.assign(new Error('This request has been rejected. Update status before approving.'), { statusCode: 409 });
  }

  // Guard: don't create duplicate admin for same email
  const existing = await User.findOne({ email: request.email });
  if (existing) {
    throw Object.assign(
      new Error(`An account with email ${request.email} already exists.`),
      { statusCode: 409 }
    );
  }

  // Generate a secure temporary password
  const temporaryPassword = crypto.randomBytes(6).toString('hex').toUpperCase() + '@1';

  // Split fullName into firstName / lastName
  const nameParts = request.fullName.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || 'Leader';

  const admin = await User.create({
    firstName,
    lastName,
    email: request.email,
    phone: request.phone,
    password: temporaryPassword,   // will be hashed by pre-save hook
    role: ROLES.ADMIN,
    isActive: true,
    isEmailVerified: true,
    firstLogin: true,              // triggers welcome card in dashboard
    sourceRequestId: request._id,
    createdBy: actorUser._id,
  });

  // Update the request record
  request.status = ADMIN_REQUEST_STATUS.CONVERTED;
  request.approvedAt = new Date();
  request.approvedBy = actorUser._id;
  request.convertedAdminId = admin._id;
  await request.save();

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_REQUEST_APPROVED,
    performedBy: actorUser,
    targetResource: 'AdminRequest',
    targetId: request._id,
    metadata: { adminId: admin._id, email: admin.email },
    req,
  });

  await createAuditLog({
    action: AUDIT_ACTIONS.ADMIN_CREATED,
    performedBy: actorUser,
    targetResource: 'User',
    targetId: admin._id,
    metadata: { email: admin.email, sourceRequest: request._id },
    req,
  });

  return { admin, temporaryPassword, request };
};

// ── Send welcome email ────────────────────────────────────────────────────────

/**
 * Send the welcome email to an approved admin.
 * Can be called at approval time or separately (resend).
 */
const sendWelcomeEmail = async (requestId, actorUser, req) => {
  const request = await AdminRequest.findById(requestId).populate('convertedAdminId');
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  if (!request.convertedAdminId) {
    throw Object.assign(new Error('No admin account linked to this request yet.'), { statusCode: 400 });
  }

  const admin = request.convertedAdminId;
  const approverName = actorUser ? `${actorUser.firstName} ${actorUser.lastName}` : 'Super Admin';

  // For resends we don't have the temporary password stored (by design, for security).
  // Super Admin will need to reset the password manually if re-sending.
  const result = await emailService.sendAdminWelcomeEmail({
    to: admin.email,
    fullName: `${admin.firstName} ${admin.lastName}`,
    email: admin.email,
    temporaryPassword: '(See your original email or ask the admin to reset your password)',
    approvedBy: approverName,
  });

  request.emailSent = result.success;
  request.emailSentAt = result.success ? new Date() : request.emailSentAt;
  if (!result.success) request.emailError = result.error;
  await request.save();

  if (result.success) {
    admin.welcomeEmailSent = true;
    await admin.save();
  }

  await createAuditLog({
    action: AUDIT_ACTIONS.WELCOME_EMAIL_SENT,
    performedBy: actorUser,
    targetResource: 'AdminRequest',
    targetId: request._id,
    metadata: { to: admin.email, success: result.success },
    req,
  });

  return result;
};

// ── Get counts for super admin dashboard ──────────────────────────────────────

const getRequestCounts = async () => {
  const [total, newCount, approvedCount, rejectedCount, convertedCount] = await Promise.all([
    AdminRequest.countDocuments(),
    AdminRequest.countDocuments({ status: ADMIN_REQUEST_STATUS.NEW }),
    AdminRequest.countDocuments({ status: ADMIN_REQUEST_STATUS.APPROVED }),
    AdminRequest.countDocuments({ status: ADMIN_REQUEST_STATUS.REJECTED }),
    AdminRequest.countDocuments({ status: ADMIN_REQUEST_STATUS.CONVERTED }),
  ]);
  return { total, new: newCount, approved: approvedCount, rejected: rejectedCount, converted: convertedCount };
};

module.exports = {
  submitApplication,
  listRequests,
  getRequest,
  updateRequestStatus,
  approveAndCreateAdmin,
  sendWelcomeEmail,
  getRequestCounts,
};
