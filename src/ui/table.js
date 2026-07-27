// table — a real data table that stays a table (it scrolls horizontally on
// narrow screens; it never collapses into cards). Columns declare alignment
// and an optional cell renderer returning a string or a DOM node.

import { el } from './el.js';

/**
 * @typedef {Object} Column
 * @property {string} [key]     - row property to read when no render given
 * @property {string} label     - header text
 * @property {'left'|'right'|'center'} [align]
 * @property {(row:any) => (string|number|Node|null)} [render]
 * @property {boolean} [numeric] - use tabular-figures styling
 */

/**
 * @param {{columns: Column[], rows: any[], empty?: string,
 *          rowClass?: (row:any) => string|null, caption?: string,
 *          onRowClick?: (row:any) => void}} p
 */
export function dataTable({ columns, rows, empty = 'Nothing to show', rowClass, caption, onRowClick }) {
  const thead = el('thead', {},
    el('tr', {}, ...columns.map((c) => el('th', {
      class: [c.align ? `t-${c.align}` : '', c.numeric ? 'is-num' : ''].join(' ').trim(),
      scope: 'col',
    }, c.label))));

  const tbody = el('tbody');
  if (!rows.length) {
    tbody.append(el('tr', { class: 't-empty' },
      el('td', { colspan: String(columns.length) }, empty)));
  } else {
    for (const row of rows) {
      const cls = rowClass ? rowClass(row) : null;
      const clickable = typeof onRowClick === 'function';
      const tr = el('tr', {
        class: [cls, clickable ? 'row--click' : ''].filter(Boolean).join(' ') || undefined,
        ...(clickable ? {
          tabindex: '0', role: 'button',
          onClick: () => onRowClick(row),
          onKeydown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); }
          },
        } : {}),
      });
      for (const c of columns) {
        const val = c.render ? c.render(row) : (c.key != null ? row[c.key] : '');
        const td = el('td', {
          class: [c.align ? `t-${c.align}` : '', c.numeric ? 'is-num' : ''].join(' ').trim(),
        });
        if (val == null || val === false) td.textContent = '';
        else if (val.nodeType) td.append(val);
        else td.textContent = String(val);
        tr.append(td);
      }
      tbody.append(tr);
    }
  }

  const table = el('table', { class: 'table' }, thead, tbody);
  if (caption) table.prepend(el('caption', { class: 'sr-only' }, caption));
  return el('div', { class: 'table-wrap' }, table);
}

/** A small status pill. tone: ok | warn | over | neutral. */
export function badge(text, tone = 'neutral') {
  return el('span', { class: `badge badge--${tone}` }, text);
}
