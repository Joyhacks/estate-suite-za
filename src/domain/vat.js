// VAT — South African standard rate 15%. Works in integer cents.
// Pure, DOM-free.

export const VAT_RATE = 0.15;

/** Add VAT to a VAT-exclusive amount. 100000 -> 115000. */
export function addVAT(exclCents, rate = VAT_RATE) {
  return Math.round(exclCents * (1 + rate));
}

/** Strip VAT from a VAT-inclusive amount. 115000 -> 100000. */
export function removeVAT(inclCents, rate = VAT_RATE) {
  return Math.round(inclCents / (1 + rate));
}

/** The VAT portion of a VAT-inclusive amount. 115000 -> 15000. */
export function vatPortion(inclCents, rate = VAT_RATE) {
  return inclCents - removeVAT(inclCents, rate);
}

/**
 * Break an amount into excl / vat / incl parts.
 * @param {number} amountCents
 * @param {'inclusive'|'exclusive'} basis - is the input incl or excl of VAT?
 */
export function vatBreakdown(amountCents, basis = 'exclusive', rate = VAT_RATE) {
  if (basis === 'inclusive') {
    const excl = removeVAT(amountCents, rate);
    return { excl, vat: amountCents - excl, incl: amountCents };
  }
  const incl = addVAT(amountCents, rate);
  return { excl: amountCents, vat: incl - amountCents, incl };
}
