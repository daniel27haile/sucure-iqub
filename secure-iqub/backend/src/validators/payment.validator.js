'use strict';

const Joi = require('joi');

const submitPaymentSchema = Joi.object({
  memberId: Joi.string().required(),
  monthNumber: Joi.number().integer().min(1).max(12).required(),
  submittedAmount: Joi.number().min(1).required(),
  proofUrl: Joi.string().uri().optional(),
  proofFileName: Joi.string().optional(),
  notes: Joi.string().max(500).optional(),
});

const approvePaymentSchema = Joi.object({
  adminNotes: Joi.string().max(500).optional(),
});

const rejectPaymentSchema = Joi.object({
  rejectionReason: Joi.string().max(500).required(),
});

const waivePenaltySchema = Joi.object({
  reason: Joi.string().max(500).required(),
});

module.exports = {
  submitPaymentSchema,
  approvePaymentSchema,
  rejectPaymentSchema,
  waivePenaltySchema,
};
