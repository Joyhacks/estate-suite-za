// Rent — proration, arrears and overdue flagging. Integer cents. Pure, DOM-free.

import { daysBetween, daysInMonth, toDate } from './dates.js';

/**
 * Prorate a monthly rent for a partial first (or last) month.
 * Charges from `occupationDate` to the end of that calendar month, inclusive.
 * @param {number} monthlyCents
 * @param {any} occupationDate - date-like; the day occupation begins.
 * @returns {number} prorated cents
 */
export function prorateFromOccupation(monthlyCents, occupationDate) {
  const d = toDate(occupationDate);
  const total = daysInMonth(d);
  const chargeable = total - d.getDate() + 1;
  return Math.round(monthlyCents * (chargeable / total));
}

/**
 * Prorate for an arbitrary inclusive day-range within one month.
 */
export function prorateRange(monthlyCents, from, to) {
  const total = daysInMonth(from);
  const days = daysBetween(from, to) + 1;
  return Math.round(monthlyCents * (Math.max(0, days) / total));
}

/**
 * Overdue status for an invoice/rent charge.
 * @param {any} dueDate
 * @param {any} today
 * @param {number} graceDays - days after due before it counts as overdue.
 * @returns {{overdue: boolean, daysOverdue: number}}
 */
export function overdueStatus(dueDate, today, graceDays = 0) {
  const past = daysBetween(dueDate, today);
  const daysOverdue = Math.max(0, past - graceDays);
  return { overdue: daysOverdue > 0, daysOverdue };
}

/**
 * Running arrears: opening balance + charges - payments. May be negative
 * (tenant in credit).
 */
export function arrears({ openingCents = 0, chargesCents = 0, paymentsCents = 0 }) {
  return openingCents + chargesCents - paymentsCents;
}
