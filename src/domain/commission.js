// Property-practitioner commission (managing agent fee on collected rent).
// Integer cents. Pure, DOM-free.

import { addVAT } from './vat.js';

/**
 * Commission on a collected amount.
 * @param {number} amountCents - the base the fee is charged on (e.g. rent).
 * @param {number} ratePct - percentage, e.g. 8 for 8%.
 * @param {{vat?: boolean, rate?: number}} [opts] - if vat, add tax to the fee
 *        at `rate` (defaults to the VAT constant).
 * @returns {{fee:number, vat:number, total:number, netToOwner:number}}
 */
export function commissionOn(amountCents, ratePct, opts = {}) {
  const fee = Math.round(amountCents * (ratePct / 100));
  const total = opts.vat ? addVAT(fee, opts.rate) : fee;
  const vat = total - fee;
  return { fee, vat, total, netToOwner: amountCents - total };
}
