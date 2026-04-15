'use strict';

const logger = require('../utils/logger');

/**
 * Centralized Express error handler.
 * All errors thrown with next(err) end up here.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors (handled in auth middleware, but catch here as fallback)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${err.message}`, err);
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
