// toast — transient, polite status messages. Announced to screen readers.

import { el } from './el.js';

let host;
function ensureHost() {
  if (!host) {
    host = el('div', { class: 'toast-host', 'aria-live': 'polite', 'aria-atomic': 'false' });
    document.body.append(host);
  }
  return host;
}

/**
 * @param {string} message
 * @param {{kind?: 'info'|'ok'|'warn'|'over', timeout?: number}} [opts]
 * @returns {() => void} dismiss
 */
export function toast(message, opts = {}) {
  const { kind = 'info', timeout = 3400 } = opts;
  const t = el('div', { class: `toast toast--${kind}`, role: 'status' }, message);
  ensureHost().append(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  const dismiss = () => {
    t.classList.remove('is-in');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
    // Fallback if transitions are disabled (reduced motion).
    setTimeout(() => t.remove(), 250);
  };
  if (timeout) setTimeout(dismiss, timeout);
  t.addEventListener('click', dismiss);
  return dismiss;
}
