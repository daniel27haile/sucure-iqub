'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

/**
 * User model.
 * A user may be a super_admin, admin, or member.
 * Members are typically invited by an admin and assigned to a slot.
 */
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.MEMBER,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    inviteToken: String,
    inviteTokenExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLoginAt: Date,
    // For on-time payment awards at cycle end
    awardBadges: [
      {
        cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
        badge: String,
        awardedAt: Date,
      },
    ],
    // True on first login after being created by Super Admin.
    // The admin dashboard shows a welcome onboarding card until this is dismissed.
    firstLogin: {
      type: Boolean,
      default: true,
    },
    // Whether the welcome email has been sent to this user
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
    // If this admin was created from a leader/admin application, link back to it
    sourceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminRequest',
      default: null,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Soft delete — deleted admins cannot log in and are hidden from normal lists.
    // We keep the document so groups / audit logs / payment records remain intact.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save: hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: safe JSON (no password)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.inviteToken;
  delete obj.passwordResetToken;
  return obj;
};

// Index for fast lookup (email index is already created by unique:true above)
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
