// Locale registry. Country packs are registered here; the store sets the
// active pack and re-seeds when the country switches.

import { za } from './za.js';
import { na } from './na.js';
import { ke } from './ke.js';
import { gb } from './gb.js';
import { ae } from './ae.js';

export const PACKS = { za, na, ke, gb, ae };
export const PACK_ORDER = ['za', 'na', 'ke', 'gb', 'ae'];
export const DEFAULT_COUNTRY = 'za';

export function getPack(code) {
  return PACKS[code] || PACKS[DEFAULT_COUNTRY];
}

export function isCountry(code) {
  return Object.prototype.hasOwnProperty.call(PACKS, code);
}

/** For the topbar country switcher. */
export function countryList() {
  return PACK_ORDER.map((code) => ({ code, name: PACKS[code].country, flag: PACKS[code].flag }));
}
