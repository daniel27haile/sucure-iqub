'use strict';

const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().trim().max(50).required(),
  lastName: Joi.string().trim().max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, and one number',
    }),
  phone: Joi.string().trim().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
});

const acceptInviteSchema = Joi.object({
  inviteToken: Joi.string().required(),
  firstName: Joi.string().trim().max(50).required(),
  lastName: Joi.string().trim().max(50).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
  phone: Joi.string().trim().optional(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, acceptInviteSchema };
