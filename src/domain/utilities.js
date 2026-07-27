// Municipal utility recovery — electricity, water — from meter readings.
// Integer cents; tariffs are cents-per-unit. Pure, DOM-free.

import { addVAT } from './vat.js';

/**
 * Consumption between two meter readings. Handles a meter that has rolled
 * over its maximum (e.g. a 6-digit dial passing 999999 -> 000000).
 * @param {number} previous
 * @param {number} current
 * @param {number} [dials] - number of digits on the meter, for rollover.
 * @returns {number} units consumed (never negative)
 */
export function consumption(previous, current, dials = 6) {
  if (current >= previous) return current - previous;
  const max = Math.pow(10, dials);
  return max - previous + current; // rolled over
}

/**
 * Recover a metered utility to a tenant/unit.
 * @param {{units:number, tariffCents:number, basicChargeCents?:number,
 *          vat?:boolean}} p
 * @returns {{units:number, usageCents:number, basicChargeCents:number,
 *            excl:number, vat:number, total:number}}
 */
export function recoverUtility({ units, tariffCents, basicChargeCents = 0, vat = true }) {
  const usageCents = Math.round(units * tariffCents);
  const excl = usageCents + basicChargeCents;
  const total = vat ? addVAT(excl) : excl;
  return { units, usageCents, basicChargeCents, excl, vat: total - excl, total };
}

/**
 * Stepped/block tariff (e.g. municipal water rising blocks).
 * @param {number} units
 * @param {Array<{upTo: number|null, tariffCents: number}>} blocks
 *        - ordered; `upTo` is the cumulative ceiling of the block, null = ∞.
 * @returns {number} cents (excl VAT)
 */
export function steppedCharge(units, blocks) {
  let remaining = units;
  let prevCeiling = 0;
  let cents = 0;
  for (const b of blocks) {
    if (remaining <= 0) break;
    const ceiling = b.upTo == null ? Infinity : b.upTo;
    const span = ceiling - prevCeiling;
    const take = Math.min(remaining, span);
    cents += Math.round(take * b.tariffCents);
    remaining -= take;
    prevCeiling = ceiling;
  }
  return cents;
}
