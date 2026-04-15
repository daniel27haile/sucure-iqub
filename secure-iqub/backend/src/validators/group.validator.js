'use strict';

const Joi = require('joi');

const createGroupSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(500).optional(),
  dueDay: Joi.number().integer().min(1).max(28).default(1),
  startDate: Joi.date().iso().optional(),
  platformFeePercent: Joi.number().min(0).max(100).default(0),
  allowMultiSlotMembership: Joi.boolean().default(false),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().max(500).optional(),
  dueDay: Joi.number().integer().min(1).max(28).optional(),
  startDate: Joi.date().iso().optional(),
  allowMultiSlotMembership: Joi.boolean().optional(),
}).min(1);

const createSlotSchema = Joi.object({
  slotNumber: Joi.number().integer().min(1).max(12).required(),
  label: Joi.string().trim().max(100).optional(),
  payoutSplitStrategy: Joi.string().valid('proportional', 'custom').default('proportional'),
});

const assignSlotMemberSchema = Joi.object({
  memberId: Joi.string().required(),
  monthlyAmount: Joi.number().min(1).max(2000).required(),
  notes: Joi.string().max(500).optional(),
});

const activateCycleSchema = Joi.object({
  startDate: Joi.date().iso().required(),
});

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  createSlotSchema,
  assignSlotMemberSchema,
  activateCycleSchema,
};
