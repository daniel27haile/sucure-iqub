'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  acceptInviteSchema,
} = require('../validators/auth.validator');

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);
router.post('/accept-invite', validate(acceptInviteSchema), ctrl.acceptInvite);
router.get('/profile', authenticate, ctrl.getProfile);

module.exports = router;
