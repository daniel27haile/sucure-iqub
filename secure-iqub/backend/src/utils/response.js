'use strict';

/**
 * Standardized API response helpers.
 * All responses follow: { success, message, data?, meta? }
 */

const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const created = (res, data = null, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Access denied') => {
  return error(res, message, 403);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const paginated = (res, data, page, limit, total, message = 'Success') => {
  return success(res, data, message, 200, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, created, error, notFound, unauthorized, forbidden, badRequest, paginated };
