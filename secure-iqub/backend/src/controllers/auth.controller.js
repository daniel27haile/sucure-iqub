'use strict';

const authService = require('../services/auth.service');
const { success, created, badRequest } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return created(res, user, 'Account created successfully');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, req);
    return success(res, result, 'Login successful');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return success(res, result, result.message);
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return success(res, null, result.message);
  } catch (err) { next(err); }
};

const acceptInvite = async (req, res, next) => {
  try {
    const result = await authService.acceptInvite(req.body);
    return success(res, result, 'Account activated successfully');
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    return success(res, req.user.toSafeObject ? req.user.toSafeObject() : req.user, 'Profile retrieved');
  } catch (err) { next(err); }
};

module.exports = { register, login, forgotPassword, resetPassword, acceptInvite, getProfile };
