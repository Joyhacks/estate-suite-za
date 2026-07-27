// Properties (build step 4) — portfolio and units. Dense lists, never cards.
// Unit detail shows the tenancy, rent, deposit held with accrued interest,
// lease dates, status and meter-reading history.
//
// Role variants: manager / super admin see the whole portfolio; owner sees
// only their own units. Scoping is structural.

import { el } from '../ui/el.js';
import { dataTable, badge } from '../ui/table.js';
import { registerView, parseHashQuery, navigateTo, path } from '../router.js';
import { store, select } from '../store.js';
import { ROLES } from '../data/roles.js';
import { formatMoney } from '../domain/money.js';
import { formatTableDate, formatDocDate, daysBetween } from '../domain/dates.js';
import { accrueBetween } from '../domain/deposit.js';
import { consumption } from '../domain/utilities.js';
import { vocab, activePack } from '../locale/active.js';

const money = (c) => formatMoney(c);
const UC = () => vocab().unitCap;

function scopedUnits() {
  const d = store.data;
  if (store.role === 'owner') {
    const owner = d.people.find((p) => p.id === ROLES.owner.personId);
    const ids = new Set(owner?.ownsUnitIds ?? []);
    return d.units.filter((u) => ids.has(u.id));
  }
  return d.units;
}

const estateOf = (u) => store.data.estates.find((e) => e.id === u.estateId);
const activeLeaseFor = (unitId) => store.data.leases.find(
  (l) => l.unitId === unitId && l.status === 'active');
const tenantFor = (unitId) => {
  const l = activeLeaseFor(unitId);
  return l ? select.person(l.tenantId) : null;
};

function unitStatusBadge(u) {
  return u.status === 'occupied' ? badge('Occupied', 'ok') : badge('Vacant', 'warn');
}

// ---- list ----------------------------------------------------------------

function listView(units) {
  const q = parseHashQuery();
  const estateFilter = q.get('estate') || '';

  // Portfolio summary, one row per estate in scope.
  const estateIds = [...new Set(units.map((u) => u.estateId))];
  const portfolioRows = estateIds.map((eid) => {
    const es = store.data.estates.find((e) => e.id === eid);
    const us = units.filter((u) => u.estateId === eid);
    const occ = us.filter((u) => u.status === 'occupied');
    const roll = occ.reduce((t, u) => t + u.rent, 0);
    return { es, total: us.length, occ: occ.length, vacant: us.length - occ.length, roll };
  });

  const portfolio = dataTable({
    columns: [
      { label: 'Estate', render: (r) => r.es?.name ?? '—' },
      { label: 'Location', render: (r) => `${r.es?.town ?? ''}, ${r.es?.province ?? ''}` },
      { label: 'Units', align: 'right', numeric: true, render: (r) => String(r.total) },
      { label: 'Occupied', align: 'right', numeric: true, render: (r) => `${r.occ}/${r.total}` },
      { label: 'Monthly roll', align: 'right', numeric: true, render: (r) => money(r.roll) },
    ],
    rows: portfolioRows,
    empty: 'No estates in your portfolio.',
  });

  const estateSel = el('select', {
    class: 'roleswitch', 'aria-label': 'Filter by estate',
    onChange: (e) => navigateTo('properties', e.target.value ? { estate: e.target.value } : {}),
  },
    el('option', { value: '' }, 'All estates'),
    ...estateIds.map((id) => el('option', { value: id, selected: id === estateFilter || undefined },
      store.data.estates.find((e) => e.id === id)?.name ?? id)));

  const rows = units
    .filter((u) => !estateFilter || u.estateId === estateFilter)
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const unitsTable = dataTable({
    columns: [
      { label: UC(), render: (u) => `${UC()} ${u.code}` },
      { label: 'Estate', render: (u) => estateOf(u)?.name ?? '—' },
      { label: 'Beds', align: 'right', numeric: true, render: (u) => String(u.bedrooms) },
      { label: 'Size', align: 'right', numeric: true, render: (u) => `${u.sqm} m²` },
      { label: 'Rent', align: 'right', numeric: true, render: (u) => money(u.rent) },
      { label: 'Tenant', render: (u) => tenantFor(u.id)?.name ?? el('span', { class: 'muted' }, 'Vacant') },
      { label: 'Status', render: (u) => unitStatusBadge(u) },
    ],
    rows,
    onRowClick: (u) => navigateTo('properties', { unit: u.id }),
    empty: 'No units on file.',
  });

  return el('div', { class: 'properties' },
    el('div', { class: 'dash__head' },
      el('h2', { class: 'dash__title' }, 'Properties'),
      el('p', { class: 'dash__sub' }, `${rows.length} units across ${estateIds.length} estate${estateIds.length === 1 ? '' : 's'}`)),
    el('div', { class: 'panel' },
      el('div', { class: 'panel__head' }, el('h3', { class: 'panel__title' }, 'Portfolio')),
      portfolio),
    el('div', { class: 'toolbar' },
      el('label', { class: 'toolbar__filter' },
        el('span', { class: 'toolbar__cap' }, 'Estate'), estateSel)),
    el('div', { class: 'panel' },
      el('div', { class: 'panel__head' }, el('h3', { class: 'panel__title' }, 'Units')),
      unitsTable));
}

// ---- unit detail ---------------------------------------------------------

function unitView(u) {
  const today = store.today;
  const estate = estateOf(u);
  const lease = activeLeaseFor(u.id);
  const tenant = lease ? select.person(lease.tenantId) : null;

  const dep = activePack().deposit;
  const interest = (lease && dep.interestToTenant)
    ? accrueBetween({ principalCents: lease.deposit, annualRate: dep.rate, from: lease.start, to: today })
    : 0;
  const depositHeld = (lease?.deposit ?? 0) + interest;

  const facts = el('div', { class: 'panel' },
    el('div', { class: 'panel__head' }, el('h3', { class: 'panel__title' }, UC())),
    el('div', { class: 'kv-list' },
      kv('Estate', estate?.name ?? '—'),
      kv('Reference', estate?.erf ?? '—'),
      kv('Bedrooms', String(u.bedrooms)),
      kv('Size', `${u.sqm} m²`),
      kv('Monthly rent', money(u.rent)),
      kvNode('Status', unitStatusBadge(u))));

  const tenancy = el('div', { class: 'panel' },
    el('div', { class: 'panel__head' }, el('h3', { class: 'panel__title' }, 'Tenancy')),
    lease
      ? el('div', { class: 'kv-list' },
          kv('Tenant', tenant?.name ?? '—'),
          kv('Lease', `${lease.id} · ${formatTableDate(lease.start)} – ${formatTableDate(lease.end)}`),
          kv('Days remaining', String(Math.max(0, daysBetween(today, lease.end)))),
          kv('Deposit paid', money(lease.deposit)),
          dep.interestToTenant ? kv(`Interest accrued (${(dep.rate * 100).toFixed(2)}% p.a.)`, money(interest)) : null,
          kvTotal(dep.interestToTenant ? 'Deposit held for tenant' : 'Deposit held', money(depositHeld)))
      : el('div', { class: 'kv-list' },
          el('p', { class: 'empty-note' }, 'Vacant — available to let. ',
            el('a', { class: 'panel__link', href: path('leases') }, 'Draw a lease →'))));

  const meters = metersPanel(u.id, today);

  return el('div', { class: 'properties' },
    el('div', { class: 'lease-toolbar' },
      el('a', { class: 'btn btn--ghost', href: path('properties') }, `← All ${vocab().unitPlural}`),
      el('div', { class: 'topbar__spacer' }),
      el('h2', { class: 'detail-title' }, `${UC()} ${u.code}`)),
    el('div', { class: 'panel-grid' }, facts, tenancy),
    meters);
}

function metersPanel(unitId, today) {
  const readings = store.data.readings.filter((r) => r.unitId === unitId);
  const utils = [...new Set(readings.map((r) => r.utility))];
  if (!utils.length) {
    return el('div', { class: 'panel' },
      el('div', { class: 'panel__head' }, el('h3', { class: 'panel__title' }, 'Meter readings')),
      el('div', { class: 'kv-list' }, el('p', { class: 'empty-note' }, 'No meter history for this unit.')));
  }
  const blocks = utils.map((util) => {
    const rs = readings.filter((r) => r.utility === util)
      .sort((a, b) => a.date.localeCompare(b.date));
    const rows = rs.map((r, i) => ({
      date: r.date, reading: r.reading,
      used: i === 0 ? null : consumption(rs[i - 1].reading, r.reading),
      unit: util === 'water' ? 'kl' : 'kWh',
    }));
    const table = dataTable({
      columns: [
        { label: 'Date', render: (r) => formatTableDate(r.date) },
        { label: 'Reading', align: 'right', numeric: true, render: (r) => String(r.reading) },
        { label: 'Consumption', align: 'right', numeric: true,
          render: (r) => (r.used == null ? '—' : `${r.used} ${r.unit}`) },
      ],
      rows,
      empty: 'No readings.',
    });
    return el('div', { class: 'meter-block' },
      el('h4', { class: 'meter-block__h' }, util === 'water' ? 'Water' : 'Electricity'),
      table);
  });
  return el('div', { class: 'panel' },
    el('div', { class: 'panel__head' }, el('h3', { class: 'panel__title' }, 'Meter readings'),
      el('span', { class: 'panel__meta' }, formatDocDate(today))),
    el('div', { class: 'meters' }, ...blocks));
}

function kv(label, value) {
  return el('div', { class: 'kv' }, el('span', {}, label), el('span', { class: 'kv__v is-num' }, value));
}
function kvNode(label, node) {
  return el('div', { class: 'kv' }, el('span', {}, label), el('span', { class: 'kv__v' }, node));
}
function kvTotal(label, value) {
  return el('div', { class: 'kv kv--total' }, el('span', {}, label), el('span', { class: 'kv__v is-num' }, value));
}

// ---- route ---------------------------------------------------------------

registerView('properties', () => {
  const units = scopedUnits();
  const unitId = parseHashQuery().get('unit');
  if (unitId) {
    const u = units.find((x) => x.id === unitId); // scope enforced here
    if (u) return unitView(u);
  }
  return listView(units);
});
