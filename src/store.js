// store — in-memory application state. All "database" writes are mutations
// here followed by a re-render. State resets on refresh, by design.
// The active COUNTRY selects a locale pack, which supplies both the seed data
// and the formatting/vocab/compliance rules the rest of the app reads.

import { createAuditLog } from './domain/audit.js';
import { homeRoute } from './data/roles.js';
import { getPack, DEFAULT_COUNTRY } from './locale/index.js';
import { setPack } from './locale/active.js';

// Set the active pack immediately so domain formatters work at import time.
setPack(getPack(DEFAULT_COUNTRY));

const listeners = new Set();

export const store = {
  country: DEFAULT_COUNTRY,
  role: 'manager',
  today: '2026-07-26',          // fixed "now" so the seeded world stays coherent
  route: homeRoute('manager'),
  data: getPack(DEFAULT_COUNTRY).seed(),
  audit: createAuditLog(),
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(store);
}

export function setRole(role) {
  store.role = role;
  emit();
}

/**
 * Switch country: activate its pack and re-seed the demo. No emit — callers
 * (the shell's render) drive the re-render, so this is safe to call mid-render.
 */
export function setCountry(code) {
  store.country = code;
  const pack = getPack(code);
  setPack(pack);
  store.data = pack.seed();
}

export function mutate(fn) {
  fn(store);
  emit();
}

export const select = {
  estate: (id) => store.data.estates.find((e) => e.id === id),
  unit: (id) => store.data.units.find((u) => u.id === id),
  person: (id) => store.data.people.find((p) => p.id === id),
  lease: (id) => store.data.leases.find((l) => l.id === id),
  unitsByEstate: (id) => store.data.units.filter((u) => u.estateId === id),
};
