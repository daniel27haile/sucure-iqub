'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { unauthorized } = require('../utils/response');

/**
 * Authenticate the incoming request via JWT Bearer token.
 * Attaches req.user on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return unauthorized(res, 'User no longer exists.');
    if (!user.isActive) return unauthorized(res, 'Your account has been deactivated. Contact support.');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Session expired. Please log in again.');
    if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token. Please log in again.');
    next(err);
  }
};

module.exports = { authenticate };
