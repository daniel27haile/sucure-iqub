'use strict';

module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MEMBER: 'member',
  },

  // One full iqub slot requires exactly $2,000/month.
  // 12 slots × $2,000 = $24,000 monthly pool.
  // The winning slot receives $24,000 as its payout.
  SLOT: {
    FULL_AMOUNT: 2000,           // USD per month per full slot
    CYCLE_SLOT_COUNT: 12,        // mandatory slots per cycle
    PAYOUT_AMOUNT: 24000,        // 12 months × $2,000 per slot = $24,000
  },

  CYCLE: {
    LENGTH_MONTHS: 12,
    STATUS: {
      DRAFT: 'draft',
      ACTIVE: 'active',
      COMPLETED: 'completed',
      SUSPENDED: 'suspended',
    },
  },

  SLOT_STATUS: {
    PENDING: 'pending',       // slot created but not fully configured
    VALID: 'valid',           // contributions sum to exactly $2,000
    INVALID: 'invalid',       // contributions do not sum to $2,000
    ELIGIBLE: 'eligible',     // valid and has not yet won
    WON: 'won',               // slot has received its payout
  },

  PAYMENT_STATUS: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  PAYMENT_TIMELINESS: {
    ON_TIME: 'on_time',             // paid on day 1
    YELLOW_WARNING: 'yellow_warning', // paid on day 2
    STRONG_WARNING: 'strong_warning', // paid on day 3
    LATE: 'late',                   // paid after day 3
    UNPAID: 'unpaid',
  },

  CYCLE_MONTH_STATUS: {
    OPEN: 'open',
    COLLECTION_COMPLETE: 'collection_complete',
    SPIN_COMPLETE: 'spin_complete',
  },

  AUDIT_ACTIONS: {
    USER_LOGIN: 'user_login',
    USER_REGISTER: 'user_register',
    PASSWORD_RESET: 'password_reset',
    GROUP_CREATED: 'group_created',
    GROUP_UPDATED: 'group_updated',
    GROUP_ACTIVATED: 'group_activated',
    GROUP_SUSPENDED: 'group_suspended',
    SLOT_CREATED: 'slot_created',
    SLOT_UPDATED: 'slot_updated',
    SLOT_MEMBER_ASSIGNED: 'slot_member_assigned',
    PAYMENT_SUBMITTED: 'payment_submitted',
    PAYMENT_APPROVED: 'payment_approved',
    PAYMENT_REJECTED: 'payment_rejected',
    SPIN_TRIGGERED: 'spin_triggered',
    SPIN_COMPLETED: 'spin_completed',
    PAYOUT_RECORDED: 'payout_recorded',
    PLATFORM_SETTING_UPDATED: 'platform_setting_updated',
    ADMIN_CREATED: 'admin_created',
    MEMBER_INVITED: 'member_invited',
    PENALTY_APPLIED: 'penalty_applied',
    OVERRIDE_ACTION: 'override_action',
  },

  PENALTY: {
    DEFAULT_PER_DAY: 20,   // $20 per day after due date
  },
};
