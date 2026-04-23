'use strict';

const mongoose = require('mongoose');
const { ADMIN_REQUEST_STATUS } = require('../config/constants');

/**
 * AdminRequest (Leader Application) model.
 *
 * Stores applications from people who want to become an Iqub leader/admin.
 * Submitted via the public landing page — no auth required.
 *
 * Workflow:
 *   1. Person submits application (status: new)
 *   2. Super Admin reviews and optionally contacts (status: contacted)
 *   3. Super Admin approves or rejects (status: approved | rejected)
 *   4. If approved, admin account is created and linked (status: converted)
 *   5. Welcome email is sent to the new admin
 */
const adminRequestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    // Optional: city or region where the applicant is based
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    // Free-text note / motivation from the applicant
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'text', ''],
      default: 'email',
    },
    status: {
      type: String,
      enum: Object.values(ADMIN_REQUEST_STATUS),
      default: ADMIN_REQUEST_STATUS.NEW,
    },
    // Internal notes added by super admin during review
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    // When/who first contacted the applicant
    contactedAt: Date,
    contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // When/who approved the request
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // When/who rejected the request
    rejectedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true },
    // Reference to the admin User account created after approval
    convertedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Email delivery tracking
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date,
    emailError: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

adminRequestSchema.index({ email: 1 });
adminRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AdminRequest', adminRequestSchema);
