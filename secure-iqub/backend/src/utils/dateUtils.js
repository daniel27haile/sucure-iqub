'use strict';

const { PAYMENT_TIMELINESS } = require('../config/constants');

// ── Month name helpers ────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** 1-indexed month → full name (1 = 'January') */
const getMonthName = (month) => MONTH_NAMES[(month - 1) % 12];

/** 1-indexed month → short name (1 = 'Jan') */
const getShortMonthName = (month) => SHORT_MONTH_NAMES[(month - 1) % 12];

/**
 * Compute the collection-window reminder status for a given date vs a MonthlyCycle.
 *
 * Business rules:
 *   Day 1              → collection_open (info)
 *   Day 2              → collection_open (warning — remind)
 *   Day 3 (last day)   → collection_open (strong warning — final day)
 *   After day N        → collection_closed / late (penalty period)
 *
 * @param {Date}   today
 * @param {{ calendarYear: number, calendarMonth: number }} monthlyCycle
 * @param {number} collectionWindowDays  - number of days the window is open (default 3)
 * @returns {{ status, day, isInWindow, level, message, daysOverdue? }}
 */
const getCollectionWindowStatus = (today, monthlyCycle, collectionWindowDays = 3) => {
  if (!monthlyCycle) return null;
  const { calendarYear, calendarMonth } = monthlyCycle;
  const isThisMonth =
    today.getFullYear() === calendarYear &&
    today.getMonth() + 1 === calendarMonth;

  if (!isThisMonth) return { status: 'not_current_month', day: null, isInWindow: false, message: null };

  const day = today.getDate();

  if (day === 1) {
    return {
      status: 'day1', day, isInWindow: true, level: 'info',
      message: 'Collection period started. Please collect and record member payments.',
    };
  }
  if (day === 2) {
    return {
      status: 'day2', day, isInWindow: true, level: 'warning',
      message: 'Reminder: Continue collecting and recording payments. Payment window is still open.',
    };
  }
  if (day <= collectionWindowDays) {
    return {
      status: `day${day}`, day, isInWindow: true, level: 'strong_warning',
      message: 'Final collection day. Record all payments today. Eligible members can proceed to spin after payment completion.',
    };
  }
  return {
    status: 'late', day, isInWindow: false, level: 'error',
    daysOverdue: day - collectionWindowDays,
    message: 'Payment window has passed. Late penalties now apply to unpaid members.',
  };
};

/**
 * Determine payment timeliness based on the day of month a payment was made
 * relative to the cycle due day.
 *
 * Business rules:
 *   day 1 of month  → ON_TIME
 *   day 2           → YELLOW_WARNING
 *   day 3           → STRONG_WARNING
 *   after due date  → LATE
 *
 * @param {Date} paidAt   - date/time payment was submitted
 * @param {number} dueDay - day of month contributions are due (e.g. 1)
 * @param {number} cycleYear  - year the cycle month belongs to
 * @param {number} cycleMonth - 1-indexed month (1=Jan)
 * @returns {{ timeliness: string, daysLate: number }}
 */
const getPaymentTimeliness = (paidAt, dueDay = 1, cycleYear, cycleMonth) => {
  const due = new Date(cycleYear, cycleMonth - 1, dueDay, 23, 59, 59, 999);
  const paid = new Date(paidAt);
  const dayOfMonth = paid.getDate();

  if (paid <= due) {
    if (dayOfMonth === 1) return { timeliness: PAYMENT_TIMELINESS.ON_TIME, daysLate: 0 };
    if (dayOfMonth === 2) return { timeliness: PAYMENT_TIMELINESS.YELLOW_WARNING, daysLate: 0 };
    if (dayOfMonth === 3) return { timeliness: PAYMENT_TIMELINESS.STRONG_WARNING, daysLate: 0 };
    return { timeliness: PAYMENT_TIMELINESS.ON_TIME, daysLate: 0 };
  }

  // Past due date
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLate = Math.ceil((paid - due) / msPerDay);
  return { timeliness: PAYMENT_TIMELINESS.LATE, daysLate };
};

/**
 * Calculate penalty amount for a late payment.
 * @param {number} daysLate
 * @param {number} penaltyPerDay
 */
const calculatePenalty = (daysLate, penaltyPerDay) => {
  if (daysLate <= 0) return 0;
  return daysLate * penaltyPerDay;
};

/**
 * Get the first day of a given month.
 */
const getMonthStart = (year, month) => new Date(year, month - 1, 1);

/**
 * Get the last day of a given month.
 */
const getMonthEnd = (year, month) => new Date(year, month, 0, 23, 59, 59, 999);

module.exports = {
  getPaymentTimeliness, calculatePenalty, getMonthStart, getMonthEnd,
  getMonthName, getShortMonthName, getCollectionWindowStatus,
};
