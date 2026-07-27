// app — entry point. Shows the role chooser at #/, then the app once a role
// is picked. The shell stays mounted underneath; the landing is an overlay so
// switching in and out never re-mounts (and never double-subscribes) the shell.

import { mountShell } from './modules/shell.js';
import { landingView } from './modules/landing.js';
import { store } from './store.js';
import { homeRoute } from './data/roles.js';
import { parseLocation } from './router.js';

// Screen modules self-register their view on import.
import './modules/dashboard.js';
import './modules/properties.js';
import './modules/leases.js';

let overlay;

function boot() {
  const root = document.getElementById('app');
  mountShell(root);

  overlay = document.createElement('div');
  overlay.className = 'landing-overlay';
  overlay.appendChild(landingView(pick));
  document.body.appendChild(overlay);

  sync();
  window.addEventListener('hashchange', sync);
}

const isLanding = () => !parseLocation().country;

function sync() {
  overlay.hidden = !isLanding();
}

function pick(role) {
  // Enter the app in the picked role, keeping the current demo country.
  location.hash = `#/${store.country}/${role}/${homeRoute(role)}`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
