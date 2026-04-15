'use strict';

const { forbidden } = require('../utils/response');
const { ROLES } = require('../config/constants');

/**
 * Role-based access control middleware factory.
 * Usage: roleGuard('super_admin') or roleGuard('admin', 'super_admin')
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Authentication required.');
    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, `Access denied. Required role: ${allowedRoles.join(' or ')}.`);
    }
    next();
  };
};

// Convenience guards
const isSuperAdmin = roleGuard(ROLES.SUPER_ADMIN);
const isAdmin = roleGuard(ROLES.ADMIN, ROLES.SUPER_ADMIN);
const isAdminOnly = roleGuard(ROLES.ADMIN);
const isMember = roleGuard(ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN);

module.exports = { roleGuard, isSuperAdmin, isAdmin, isAdminOnly, isMember };
