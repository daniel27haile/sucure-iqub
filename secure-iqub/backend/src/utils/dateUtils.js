'use strict';

const { PAYMENT_TIMELINESS } = require('../config/constants');

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

module.exports = { getPaymentTimeliness, calculatePenalty, getMonthStart, getMonthEnd };
