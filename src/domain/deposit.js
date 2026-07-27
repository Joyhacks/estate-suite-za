// Rental deposits — held in an interest-bearing account with interest accruing
// to the TENANT (Rental Housing Act principle). Integer cents. Pure, DOM-free.

import { daysBetween } from './dates.js';

/**
 * Simple (non-compounding) interest accrued on a deposit over a period.
 * @param {number} principalCents
 * @param {number} annualRate - e.g. 0.0725 for 7.25% p.a.
 * @param {number} days
 * @returns {number} interest in cents (rounded)
 */
export function accrueSimple(principalCents, annualRate, days) {
  return Math.round(principalCents * annualRate * (days / 365));
}

/**
 * Daily-compounded interest over a period.
 * @returns {number} interest in cents (rounded)
 */
export function accrueDailyCompound(principalCents, annualRate, days) {
  const grown = principalCents * Math.pow(1 + annualRate / 365, days);
  return Math.round(grown - principalCents);
}

/**
 * Interest accrued between two dates, inclusive of elapsed days.
 * @param {{principalCents:number, annualRate:number, from:any, to:any,
 *          method?:'simple'|'daily'}} p
 */
export function accrueBetween({ principalCents, annualRate, from, to, method = 'simple' }) {
  const days = Math.max(0, daysBetween(from, to));
  return method === 'daily'
    ? accrueDailyCompound(principalCents, annualRate, days)
    : accrueSimple(principalCents, annualRate, days);
}

/**
 * Amount refundable to a tenant at lease end:
 *   principal + interest - agreed deductions.
 * Never returns below zero.
 */
export function refundDue({ principalCents, interestCents = 0, deductionsCents = 0 }) {
  return Math.max(0, principalCents + interestCents - deductionsCents);
}
