// stat — a single KPI tile. Quiet by default; `tone` tints the value for
// decision metrics (overdue, expiring). Optional href makes the whole tile a
// link to the screen that resolves it.

import { el } from './el.js';

/**
 * @param {{label:string, value:string, sub?:string,
 *          tone?:'default'|'over'|'warn'|'ok', href?:string,
 *          emphasis?:boolean}} p
 */
export function statTile({ label, value, sub, tone = 'default', href, emphasis = false }) {
  const children = [
    el('div', { class: 'stat__label' }, label),
    el('div', { class: 'stat__value' }, value),
    sub ? el('div', { class: 'stat__sub' }, sub) : null,
  ].filter(Boolean);
  const cls = `stat stat--${tone}${emphasis ? ' stat--emphasis' : ''}`;
  return href
    ? el('a', { class: cls + ' stat--link', href }, ...children)
    : el('div', { class: cls }, ...children);
}

/** A horizontal strip of tiles. */
export function statRow(tiles) {
  return el('div', { class: 'stat-row' }, ...tiles);
}
