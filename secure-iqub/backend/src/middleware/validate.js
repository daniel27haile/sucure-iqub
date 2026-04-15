'use strict';

const Joi = require('joi');
const { badRequest } = require('../utils/response');

/**
 * Joi validation middleware factory.
 * Usage: validate(schema) where schema is a Joi object schema.
 * Validates req.body by default, or req.query / req.params if specified.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
return badRequest(res, 'Validation failed', errors);
    }

    req[source] = value; // replace with sanitized/coerced value
    next();
  };
};

module.exports = validate;
