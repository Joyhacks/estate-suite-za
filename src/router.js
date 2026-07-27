// router — hash-based, role-guarded. The hash carries country AND role so a
// specific view is shareable: #/<country>/<role>/<route>?<query>
//   e.g. #/za/manager/dashboard, #/gb/tenant/leases?id=L-0140
// Empty/`#/` is the landing chooser. Modules register a view renderer per
// route; unbuilt routes fall back to a stub (they are also removed from nav).

import { allowedRoutes, homeRoute } from './data/roles.js';
import { store } from './store.js';

const registry = new Map();

export function registerView(route, renderFn) {
  registry.set(route, renderFn);
}
export function hasView(route) {
  return registry.has(route);
}
export function viewFor(route) {
  return registry.get(route) || null;
}

export const ROUTE_META = {
  dashboard:  { title: 'Dashboard' },
  properties: { title: 'Properties' },
  leases:     { title: 'Leases' },
  tenants:    { title: 'Tenants' },
  owners:     { title: 'Owners & payouts' },
  finance:    { title: 'Finance' },
  payments:   { title: 'Payments' },
  utilities:  { title: 'Utilities' },
  maintenance:{ title: 'Maintenance' },
  calendar:   { title: 'Calendar' },
  directory:  { title: 'Directory' },
  reports:    { title: 'Reports' },
  notifications: { title: 'Notifications' },
  settings:   { title: 'Settings' },
};

/** Parse #/<country>/<role>/<route> -> { country, role, route } (nulls if absent). */
export function parseLocation() {
  const h = (location.hash || '').replace(/^#\/?/, '');
  const [pathPart] = h.split('?');
  const segs = pathPart.split('/').filter(Boolean);
  return { country: segs[0] || null, role: segs[1] || null, route: segs[2] || null };
}

/** Query params after the route, e.g. ...leases?id=L-0140 -> id. */
export function parseHashQuery() {
  const h = location.hash || '';
  const q = h.indexOf('?');
  return new URLSearchParams(q >= 0 ? h.slice(q + 1) : '');
}

/** Build a hash for a route under the CURRENT country + role, with query. */
export function path(route, params) {
  const qs = params && Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString() : '';
  return `#/${store.country}/${store.role}/${route}${qs}`;
}

/** Navigate to a route under the current country + role. */
export function navigateTo(route, params) {
  location.hash = path(route, params);
}

/** Navigate, overriding country and/or role while keeping the route. */
export function navigateContext({ country = store.country, role = store.role, route }) {
  location.hash = `#/${country}/${role}/${route}`;
}

/** Resolve the route to show for a role, guarding disallowed/unbuilt routes home. */
export function resolveRoute(role, wanted) {
  let route = wanted || store.route || homeRoute(role);
  if (!allowedRoutes(role).has(route)) route = homeRoute(role);
  return route;
}
