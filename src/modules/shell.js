// shell — the application chrome: sidebar with grouped nav, topbar with role
// switcher, router mount, modal + toast hosts, mobile drawer under 900px.
// Rebuilds nav and view on role/route change; forbidden nav is never rendered.

import { el, clear, frag } from '../ui/el.js';
import { toast } from '../ui/toast.js';
import { store, subscribe, setCountry } from '../store.js';
import {
  navFor, ROLES, homeRoute, switchableRoles,
} from '../data/roles.js';
import {
  resolveRoute, viewFor, parseLocation, path, navigateContext, ROUTE_META,
} from '../router.js';
import { countryList, isCountry } from '../locale/index.js';
import { formatDocDate } from '../domain/dates.js';

let refs = {};
let userInitiatedNav = false;

export function mountShell(root) {
  const app = el('div', { class: 'app', 'data-role': store.role });

  const skip = el('a', { class: 'skip-link', href: '#view' }, 'Skip to content');

  const sidebar = el('aside', { class: 'sidebar', id: 'sidebar' },
    el('div', { class: 'brand' },
      el('span', { class: 'brand__mark', 'aria-hidden': 'true' }, 'ES'),
      el('span', { class: 'brand__name' }, 'Estate',
        el('span', { class: 'brand__accent' }, 'Suite'))),
    el('nav', { class: 'nav', id: 'nav', 'aria-label': 'Primary' }));

  const scrim = el('div', { class: 'scrim', hidden: true,
    onClick: () => setDrawer(false) });

  const hamburger = el('button', {
    class: 'iconbtn hamburger', 'aria-label': 'Open navigation',
    'aria-controls': 'sidebar', 'aria-expanded': 'false',
    onClick: () => setDrawer(!app.classList.contains('is-drawer-open')),
  }, bars());

  const title = el('h1', { class: 'topbar__title', id: 'view-title' }, '');

  const countrySelect = el('select', {
    class: 'roleswitch', 'aria-label': 'Switch country',
    onChange: (e) => switchCountry(e.target.value),
  }, ...countryList().map((c) => el('option', { value: c.code }, `${c.flag}  ${c.name}`)));

  const countryWrap = el('label', { class: 'roleswitch__wrap' },
    el('span', { class: 'roleswitch__caption' }, 'Country'),
    countrySelect);

  const roleSelect = el('select', {
    class: 'roleswitch', 'aria-label': 'Switch role',
    onChange: (e) => switchRole(e.target.value),
  }, ...switchableRoles().map((id) => el('option', { value: id }, ROLES[id].label)));

  const roleWrap = el('label', { class: 'roleswitch__wrap' },
    el('span', { class: 'roleswitch__caption' }, 'Viewing as'),
    roleSelect);

  const today = el('div', { class: 'topbar__today', title: 'Demo date' },
    formatDocDate(store.today));

  const topbar = el('header', { class: 'topbar' },
    hamburger, title,
    el('div', { class: 'topbar__spacer' }),
    today, countryWrap, roleWrap);

  const view = el('main', { class: 'view', id: 'view', tabindex: '-1' });

  const main = el('div', { class: 'main' }, topbar, view);

  app.append(skip, sidebar, scrim, main);

  // Persistent honesty ribbon — always visible while in the app.
  const ribbon = el('div', { class: 'ribbon', role: 'note' },
    el('span', { class: 'ribbon__dot', 'aria-hidden': 'true' }),
    'Demo — a fictional estate and fictional people. Anything you change resets when you refresh.');

  clear(root).append(ribbon, app);

  refs = { app, nav: sidebar.querySelector('#nav'), view, title, roleSelect, countrySelect, scrim, hamburger };

  // Re-render on store mutations (mark paid, approve, etc.). Country and role
  // live in the hash, so those changes arrive via hashchange, not here.
  subscribe(() => {
    if (isLandingHash()) return; // the landing owns the screen at #/
    render();
  });

  window.addEventListener('hashchange', () => {
    if (isLandingHash()) return; // back at the landing; app.js shows the chooser
    userInitiatedNav = true;
    render();
    setDrawer(false);
  });

  // First paint — only when a route is present (otherwise the landing shows).
  if (!isLandingHash()) render();
}

/** True at #/ (or empty hash): the landing chooser owns the screen. */
function isLandingHash() {
  return !parseLocation().country;
}

function switchRole(role) {
  navigateContext({ role, route: store.route });
  toast(`Now viewing as ${ROLES[role].label}`, { kind: 'info' });
}

function switchCountry(code) {
  navigateContext({ country: code, route: store.route });
}

function setDrawer(open) {
  refs.app.classList.toggle('is-drawer-open', open);
  refs.scrim.hidden = !open;
  refs.hamburger.setAttribute('aria-expanded', String(open));
  refs.hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}

function render() {
  if (isLandingHash()) return; // do not touch the hash while the chooser is up
  const loc = parseLocation();

  // Sync the active country (re-seeds) and role from the hash.
  if (loc.country && isCountry(loc.country) && loc.country !== store.country) {
    setCountry(loc.country);
  }
  const role = (loc.role && ROLES[loc.role]) ? loc.role : store.role;
  store.role = role;
  const route = resolveRoute(role, loc.route);
  store.route = route;

  // Normalise the hash if anything was invalid/guarded (replaceState does not
  // re-fire hashchange, so this cannot loop). Query (?id=) is preserved only
  // when the resolved path already matches.
  const want = `#/${store.country}/${role}/${route}`;
  const have = `#/${loc.country}/${loc.role}/${loc.route}`;
  if (want !== have) history.replaceState(null, '', want);

  refs.app.dataset.role = role;
  refs.roleSelect.value = role;
  refs.countrySelect.value = store.country;
  renderNav(role, route);
  renderView(route);
}

function renderNav(role, active) {
  const groups = navFor(role);
  clear(refs.nav).append(frag(
    ...groups.map((g) => el('div', { class: 'nav__group' },
      el('div', { class: 'nav__label' }, g.group),
      ...g.items.map((it) => el('a', {
        class: 'nav__item' + (it.route === active ? ' is-active' : ''),
        href: path(it.route),
        'aria-current': it.route === active ? 'page' : null,
      }, it.label)),
    )),
  ));
}

function renderView(route) {
  const meta = ROUTE_META[route] || { title: route };
  refs.title.textContent = meta.title;
  document.title = `${meta.title} · EstateSuite`;

  const renderer = viewFor(route);
  const node = renderer ? renderer({ store }) : stubView(meta);
  clear(refs.view).append(node);

  // Move focus to the view on user-initiated navigation only (a11y), never
  // on first load, so we don't yank focus from the page unexpectedly.
  if (userInitiatedNav) {
    refs.view.focus({ preventScroll: false });
    userInitiatedNav = false;
  }
}

// Safety-net empty state. Unbuilt routes are removed from the nav and guarded
// in the router, so this is effectively unreachable — it exists only so a bad
// deep link never renders a blank screen. It is NOT a "coming soon" placeholder.
function stubView(meta) {
  return el('div', { class: 'stub' },
    el('h2', { class: 'stub__title' }, meta.title || 'Not available'),
    el('p', { class: 'stub__text' }, 'Choose a screen from the menu.'));
}

function bars() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
  return svg;
}
