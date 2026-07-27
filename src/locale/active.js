// Active locale pack. The domain layer and UI read currency, date order,
// national-ID rules, payment methods, vocabulary and compliance notes from
// whichever pack is active. Nothing outside a pack hardcodes those. The pack
// is set once at boot (store.js) and again whenever the country switches.

let current = null;

export function setPack(pack) {
  current = pack;
}

export function activePack() {
  if (!current) throw new Error('No locale pack is active — call setPack() first.');
  return current;
}

/** Shorthand for the active pack's tenancy vocabulary. */
export function vocab() {
  return activePack().vocab;
}
