'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async ({ firstName, lastName, email, password, phone, role = 'member', createdBy = null }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ firstName, lastName, email, password, phone, role, createdBy });
  return user.toSafeObject();
};

const login = async ({ email, password }, req) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (user.isDeleted) {
    const err = new Error('This account has been deleted. Please contact Super Admin.');
    err.statusCode = 403;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Your account has been suspended. Please contact Super Admin.');
    err.statusCode = 403;
    throw err;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);

  await createAuditLog({
    action: AUDIT_ACTIONS.USER_LOGIN,
    performedBy: user,
    metadata: { email: user.email, role: user.role },
    req,
  });

  return { token, user: user.toSafeObject() };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Always return success to prevent email enumeration
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // In production: send email with resetToken
  // For MVP: return token in response (development only)
  return { message: 'If that email exists, a reset link has been sent.', devResetToken: resetToken };
};

const resetPassword = async ({ token, password }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error('Token is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { message: 'Password reset successful' };
};

const acceptInvite = async ({ inviteToken, firstName, lastName, password, phone }) => {
  const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');
  const user = await User.findOne({
    inviteToken: hashedToken,
    inviteTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error('Invite token is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.password = password;
  user.phone = phone;
  user.isEmailVerified = true;
  user.inviteToken = undefined;
  user.inviteTokenExpires = undefined;
  await user.save();

  const token = generateToken(user._id);
  return { token, user: user.toSafeObject() };
};

module.exports = { register, login, forgotPassword, resetPassword, acceptInvite, generateToken };
