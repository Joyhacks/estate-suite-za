// Money — formatting reads the ACTIVE locale pack's currency rules, so no
// currency symbol, thousands separator or decimal mark is hardcoded here.
// Amounts are stored as integer minor units (cents/pence/fils) everywhere.
// Pure of DOM; depends only on the active pack.

import { activePack } from '../locale/active.js';

/**
 * Format integer minor units using the active pack's currency rules.
 * e.g. za: 1450000 -> "R14 500,00"; gb: 185000 -> "£1,850.00".
 * @param {number} minor
 * @param {{symbol?: boolean}} [opts]
 */
export function formatMoney(minor, opts = {}) {
  const { symbol = true } = opts;
  const c = activePack().currency;
  if (!Number.isFinite(minor)) minor = 0;
  const neg = minor < 0;
  const abs = Math.round(Math.abs(minor));
  const major = Math.floor(abs / 100);
  const frac = abs % 100;
  const grouped = String(major).replace(/\B(?=(\d{3})+(?!\d))/g, c.thousands);
  const body = `${grouped}${c.decimal}${String(frac).padStart(2, '0')}`;
  const sign = neg ? '-' : '';
  if (!symbol) return sign + body;
  const sp = c.symbolSpace ? ' ' : '';
  return c.symbolAfter
    ? `${sign}${body}${sp}${c.symbol}`
    : `${sign}${c.symbol}${sp}${body}`;
}

/**
 * Parse a formatted money string back to integer minor units, using the
 * active pack's separators. Tolerates the currency symbol and stray spaces.
 * @param {string|number} input
 * @returns {number} minor units
 */
export function parseMoney(input) {
  if (typeof input === 'number') return Math.round(input * 100);
  if (!input) return 0;
  const c = activePack().currency;
  let s = String(input).trim().replace(/[^\d.,\-\s]/g, ''); // drop symbol/letters
  const neg = s.trim().startsWith('-');
  s = s.replace(/-/g, '');
  if (c.decimal === ',') {
    s = s.replace(/[.\s ]/g, '').replace(',', '.'); // "14.500,00" -> "14500.00"
  } else {
    s = s.replace(/[,\s ]/g, '');
  }
  const major = parseFloat(s);
  if (!Number.isFinite(major)) return 0;
  return (neg ? -1 : 1) * Math.round(major * 100);
}

/** Whole major units -> integer minor units. */
export const toMinor = (major) => Math.round(major * 100);

/** Back-compat alias used by older call sites/tests. */
export const rands = toMinor;
