// Dates — the day/month order is read from the ACTIVE locale pack (no format
// is hardcoded). Long "document" dates use English month names.
//   dmy: "1 August 2026" / "01/08/2026"   (all packs shipped so far)
//   mdy: "August 1, 2026" / "08/01/2026"
// Accepts a Date or an ISO "YYYY-MM-DD" string. Parsing builds a local Date
// at midday to sidestep timezone roll-over.

import { activePack } from '../locale/active.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const order = () => activePack().dateOrder || 'dmy';

/** Coerce ISO string | Date | timestamp -> Date (local, midday). */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return new Date(value);
}

/** Long date for anything that represents a document. */
export function formatDocDate(value) {
  const d = toDate(value);
  const day = d.getDate(), month = MONTHS[d.getMonth()], year = d.getFullYear();
  return order() === 'mdy' ? `${month} ${day}, ${year}` : `${day} ${month} ${year}`;
}

/** Short date for tables and dense UI, in the active pack's day/month order. */
export function formatTableDate(value) {
  const d = toDate(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return order() === 'mdy' ? `${mm}/${dd}/${yy}` : `${dd}/${mm}/${yy}`;
}

/** ISO "YYYY-MM-DD" — for storage/keys. */
export function toISO(value) {
  const d = toDate(value);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Whole days b - a (a, b as date-likes). Positive if b is later. */
export function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const ad = toDate(a), bd = toDate(b);
  const au = Date.UTC(ad.getFullYear(), ad.getMonth(), ad.getDate());
  const bu = Date.UTC(bd.getFullYear(), bd.getMonth(), bd.getDate());
  return Math.round((bu - au) / MS);
}

/** Add whole days, returning a new Date. */
export function addDays(value, n) {
  const d = toDate(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
}

/** Number of days in the calendar month containing `value`. */
export function daysInMonth(value) {
  const d = toDate(value);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Add whole months, clamping the day to the target month's length. */
export function addMonths(value, n) {
  const d = toDate(value);
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
  const dim = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, dim));
  return target;
}

/** Lease end date for a term in months: last day before the term rolls over. */
export function leaseEnd(start, termMonths) {
  return addDays(addMonths(start, termMonths), -1);
}
