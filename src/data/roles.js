// Roles — who exists, what nav they see, and which fields they may see.
// Field access is enforced STRUCTURALLY by modules (a forbidden field is never
// rendered), not hidden with CSS. This file is the single access matrix.
// All people below are invented.

// personId values are STABLE across countries — the seed for every pack uses
// the same ids (see locale/seedShape.js), so role scoping never depends on a
// specific country's data.
export const ROLES = {
  super_admin: { id: 'super_admin', label: 'Super admin',      personId: null },
  manager:     { id: 'manager',     label: 'Property manager', personId: 'p-manager' },
  owner:       { id: 'owner',       label: 'Owner',            personId: 'p-owner-0' },
  tenant:      { id: 'tenant',      label: 'Tenant',           personId: 'p-tenant-0' },
  contractor:  { id: 'contractor',  label: 'Contractor',       personId: 'p-contractor' },
};

export const ROLE_ORDER = ['super_admin', 'manager', 'owner', 'tenant', 'contractor'];

// Feature flag: only these routes are built and reachable. Unbuilt routes are
// removed from the sidebar entirely (no placeholders, no dead links) and
// guarded in the router. Re-enabling a screen once built is a single-line
// addition here.
export const BUILT = new Set(['dashboard', 'properties', 'leases']);

export function isBuilt(route) {
  return BUILT.has(route);
}

// Master navigation. Each item declares the roles that may reach it; the shell
// filters structurally, so a role simply never receives forbidden items.
export const NAV = [
  { group: 'Overview', items: [
    { route: 'dashboard', label: 'Dashboard', roles: ['super_admin', 'manager', 'owner', 'tenant'] },
  ] },
  { group: 'Portfolio', items: [
    { route: 'properties', label: 'Properties',      roles: ['super_admin', 'manager', 'owner'] },
    { route: 'tenants',    label: 'Tenants',         roles: ['super_admin', 'manager'] },
    { route: 'leases',     label: 'Leases',          roles: ['super_admin', 'manager', 'owner', 'tenant'] },
    { route: 'owners',     label: 'Owners & payouts', roles: ['super_admin', 'manager'] },
  ] },
  { group: 'Money', items: [
    { route: 'finance',   label: 'Finance',      roles: ['super_admin', 'manager', 'owner'] },
    { route: 'payments',  label: 'My payments',  roles: ['tenant'] },
    { route: 'utilities', label: 'Utilities',    roles: ['super_admin', 'manager', 'owner', 'tenant'] },
  ] },
  { group: 'Operations', items: [
    { route: 'maintenance', label: 'Maintenance', roles: ['super_admin', 'manager', 'owner', 'tenant', 'contractor'] },
    { route: 'calendar',    label: 'Calendar',    roles: ['super_admin', 'manager', 'contractor'] },
    { route: 'directory',   label: 'Directory',   roles: ['super_admin', 'manager', 'owner', 'tenant', 'contractor'] },
  ] },
  { group: 'Insight', items: [
    { route: 'reports', label: 'Reports', roles: ['super_admin', 'manager', 'owner'] },
  ] },
  { group: 'System', items: [
    { route: 'notifications', label: 'Notifications', roles: ['super_admin', 'manager', 'owner', 'tenant', 'contractor'] },
    { route: 'settings',      label: 'Settings',      roles: ['super_admin', 'manager', 'owner', 'tenant', 'contractor'] },
  ] },
];

// Field-level access. Keys are stable field ids referenced by modules.
// A field absent from this map is visible to everyone.
export const FIELD_ACCESS = {
  'said.full':        ['super_admin', 'manager'], // unmask ever (still audited)
  'owner.bank':       ['super_admin', 'manager'],
  'owner.payout':     ['super_admin', 'manager', 'owner'],
  'lease.commission': ['super_admin', 'manager'],
  'tenant.contact':   ['super_admin', 'manager'],
  'finance.expenses': ['super_admin', 'manager', 'owner'],
};

/** True if `role` may see `field`. Modules must gate rendering on this. */
export function canSeeField(role, field) {
  const allowed = FIELD_ACCESS[field];
  return allowed ? allowed.includes(role) : true;
}

/** The landing route for a role: its first built, allowed route. */
export function homeRoute(role) {
  const allowed = allowedRoutes(role);
  if (allowed.has('dashboard')) return 'dashboard';
  const [first] = allowed;
  return first ?? 'dashboard';
}

/** All BUILT routes a role may reach (for router guarding). */
export function allowedRoutes(role) {
  const set = new Set();
  for (const g of NAV) {
    for (const it of g.items) {
      if (it.roles.includes(role) && isBuilt(it.route)) set.add(it.route);
    }
  }
  return set;
}

/** Nav groups filtered to the role AND to built routes; empty groups dropped. */
export function navFor(role) {
  return NAV
    .map((g) => ({
      group: g.group,
      items: g.items.filter((it) => it.roles.includes(role) && isBuilt(it.route)),
    }))
    .filter((g) => g.items.length);
}

/** Roles that currently have at least one built screen (for the switcher). */
export function switchableRoles() {
  return ROLE_ORDER.filter((role) => allowedRoutes(role).size > 0);
}
