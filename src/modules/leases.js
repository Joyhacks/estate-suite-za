// Leases (build step 6) — the list, and the document generator that IS the
// sales moment: the lease sheet composes on screen in the serif document face,
// values landing into place, the SPECIMEN stamp setting last.
//
// Role variants of one route:
//   manager / super admin — all leases, filter by unit, commission rate shown,
//                           can draw a new lease.
//   owner                 — leases on their own units, read-only, no rate.
//   tenant                — their own lease only.
//
// Document bodies are layout SPECIMENS only — no enforceable clause text.

import { el, frag, clear } from '../ui/el.js';
import { dataTable, badge } from '../ui/table.js';
import { openModal, closeModal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { sheet, docValue, docLine, playCompose } from '../ui/document.js';
import { registerView, parseHashQuery, navigateTo, path } from '../router.js';
import { store, mutate, select } from '../store.js';
import { ROLES, canSeeField } from '../data/roles.js';
import { formatMoney, parseMoney } from '../domain/money.js';
import { formatDocDate, formatTableDate, daysBetween, leaseEnd, toISO } from '../domain/dates.js';
import { activePack, vocab } from '../locale/active.js';

const money = (c) => formatMoney(c);
const UC = () => vocab().unitCap;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const estateOf = (unitId) => store.data.estates.find((e) => e.id === select.unit(unitId)?.estateId);
const ownerOf = (unitId) => store.data.people.find(
  (p) => p.role === 'owner' && (p.ownsUnitIds || []).includes(unitId));

const DOC_SHORT = {
  'Lease agreement': 'Lease', 'Lease agreement (draft)': 'Lease · draft',
  'FICA pack': 'FICA', 'ID & proof of address': 'ID docs',
  'Right to rent & proof of address': 'Right to rent', 'ID & tenancy documents': 'ID docs',
  'Ingoing inspection': 'Inspection',
};

function leaseStatus(l, today) {
  if (l.status === 'unsigned' || !l.signed) return { label: 'Unsigned', tone: 'over' };
  const d = daysBetween(today, l.end);
  if (d < 0) return { label: 'Expired', tone: 'over' };
  if (d <= 45) return { label: `Expiring · ${d}d`, tone: 'warn' };
  return { label: 'Active', tone: 'ok' };
}

// ---- data scoping (structural) ------------------------------------------

function scopedLeases() {
  const d = store.data;
  switch (store.role) {
    case 'owner': {
      const owner = d.people.find((p) => p.id === ROLES.owner.personId);
      const ids = new Set(owner?.ownsUnitIds ?? []);
      return d.leases.filter((l) => ids.has(l.unitId));
    }
    case 'tenant':
      return d.leases.filter((l) => l.tenantId === ROLES.tenant.personId);
    default:
      return d.leases;
  }
}

const canDraw = () => store.role === 'manager' || store.role === 'super_admin';
const showCommission = () => canSeeField(store.role, 'lease.commission');

// ---- list ----------------------------------------------------------------

function listView(leases) {
  const today = store.today;
  const q = parseHashQuery();
  const unitFilter = q.get('unit') || '';

  const unitIds = [...new Set(leases.map((l) => l.unitId))];
  const rows = leases
    .filter((l) => !unitFilter || l.unitId === unitFilter)
    .slice()
    .sort((a, b) => daysBetween(today, a.end) - daysBetween(today, b.end));

  const filterSel = el('select', {
    class: 'roleswitch', 'aria-label': 'Filter by unit',
    onChange: (e) => navigateTo('leases', e.target.value ? { unit: e.target.value } : {}),
  },
    el('option', { value: '' }, 'All units'),
    ...unitIds.map((id) => el('option', { value: id, selected: id === unitFilter || undefined },
      `${UC()} ${select.unit(id)?.code ?? id}`)));

  const toolbar = el('div', { class: 'toolbar' },
    el('label', { class: 'toolbar__filter' },
      el('span', { class: 'toolbar__cap' }, UC()), filterSel),
    el('div', { class: 'topbar__spacer' }),
    canDraw() ? el('button', { class: 'btn btn--primary', onClick: openDrawLease },
      '+ Draw new lease') : null);

  const columns = [
    { label: UC(), render: (l) => `${UC()} ${select.unit(l.unitId)?.code ?? l.unitId}` },
    { label: 'Tenant', render: (l) => select.person(l.tenantId)?.name ?? '—' },
    { label: 'Period', render: (l) => `${formatTableDate(l.start)} – ${formatTableDate(l.end)}` },
    { label: 'Monthly rent', align: 'right', numeric: true, render: (l) => money(l.rent) },
    showCommission()
      ? { label: 'Commission', align: 'right', numeric: true, render: (l) => `${(l.commissionPct ?? store.data.commissionPct).toFixed(1)}%` }
      : null,
    { label: 'Documents', render: (l) => el('div', { class: 'chips' },
        ...(l.documents || []).map((dc) => badge(DOC_SHORT[dc.type] || dc.type, 'neutral'))) },
    { label: 'Status', render: (l) => { const st = leaseStatus(l, today); return badge(st.label, st.tone); } },
  ].filter(Boolean);

  const table = dataTable({
    columns, rows,
    onRowClick: (l) => navigateTo('leases', { id: l.id }),
    rowClass: (l) => (leaseStatus(l, today).tone === 'over' ? 'row--over' : null),
    empty: 'No leases on file.',
  });

  return el('div', { class: 'leases' },
    el('div', { class: 'dash__head' },
      el('h2', { class: 'dash__title' }, store.role === 'tenant' ? 'Your lease' : 'Leases'),
      el('p', { class: 'dash__sub' },
        `${rows.length} lease${rows.length === 1 ? '' : 's'}${unitFilter ? ` · ${UC()} ${select.unit(unitFilter)?.code}` : ''}`)),
    toolbar,
    el('div', { class: 'panel' }, table));
}

// ---- the lease document (signature element) ------------------------------

function docView(lease) {
  const today = store.today;
  const unit = select.unit(lease.unitId);
  const estate = estateOf(lease.unitId);
  const tenant = select.person(lease.tenantId);
  const owner = ownerOf(lease.unitId);
  const st = leaseStatus(lease, today);
  const term = 'Twelve (12) months'; // display term; specimen layout only
  const pk = activePack();
  const V = pk.vocab;
  const idRule = pk.id;
  const showFee = canSeeField(store.role, 'lease.commission');

  // Party line — the ID clause only appears where the pack collects an ID.
  const partyLine = ['Entered into between the Landlord, ', docValue(owner?.name ?? '—'),
    `, represented by the ${V.agent} `, docValue(V.agentName),
    ', and the Tenant, ', docValue(tenant?.name ?? '—')];
  if (idRule.present) partyLine.push(` (${idRule.label} `, docValue(idRule.mask(tenant?.said) || '—'), ')');
  partyLine.push('.');

  const rentalBlocks = [
    kvBlock('Monthly rental', money(lease.rent)),
    kvBlock('Deposit', money(lease.deposit)),
    showFee ? kvBlock(`${cap(V.agent)} commission`, `${(lease.commissionPct ?? store.data.commissionPct).toFixed(1)}%`) : null,
    kvBlock('Payment method', pk.payments.slice(0, 2).join(' / ')),
    ...(pk.leaseFields || []).map((f) => kvBlock(f.label, f.value)),
  ];

  const paper = sheet([
    docLine('doc-meta',
      el('span', {}, `Reference ${lease.id}`),
      el('span', {}, estate?.name ?? '')),

    docLine('doc-title', 'Residential Lease Agreement'),
    docLine('doc-specimen-note', pk.compliance.leaseNote),

    docLine('doc-h', '1.  Parties'),
    docLine('doc-p', ...partyLine),
    (idRule.present && pk.compliance.idNote) ? docLine('doc-note', pk.compliance.idNote) : null,

    docLine('doc-h', '2.  The property'),
    docLine('doc-p',
      `${V.unitCap} `, docValue(unit?.code ?? '—'), ', ', docValue(estate?.name ?? '—'),
      ', ', docValue(estate?.erf ?? '—'), ', ', docValue(`${estate?.town ?? ''}, ${estate?.province ?? ''}`), '.'),

    docLine('doc-h', '3.  Lease period'),
    el('div', { class: 'doc-grid compose' },
      kvBlock('Commencement date', formatDocDate(lease.start)),
      kvBlock('Termination date', formatDocDate(lease.end)),
      kvBlock('Term', term),
      kvBlock(cap(V.occupation), formatDocDate(lease.start))),

    docLine('doc-h', '4.  Rental and deposit'),
    el('div', { class: 'doc-grid compose' }, ...rentalBlocks.filter(Boolean)),
    docLine('doc-note', pk.compliance.depositNote),

    docLine('doc-h', '5.  Terms'),
    ...specimenClauses(pk),

    docLine('doc-sign',
      signLine(`Landlord / ${V.agent}`, V.agentName),
      signLine('Tenant', tenant?.name ?? '')),
    docLine('doc-p doc-p--muted',
      'Signed at ', docValue(estate?.town ?? '—'), ' on ',
      docValue(lease.signedDate ? formatDocDate(lease.signedDate) : '________________'), '.'),
  ]);

  const toolbar = el('div', { class: 'lease-toolbar' },
    el('a', { class: 'btn btn--ghost', href: path('leases') }, '← All leases'),
    el('div', { class: 'topbar__spacer' }),
    badge(st.label, st.tone),
    (canDraw() && !lease.signed)
      ? el('button', { class: 'btn', onClick: () => markSigned(lease.id) }, 'Mark signed')
      : null,
    el('button', { class: 'btn btn--primary', onClick: () => window.print() }, 'Print / PDF'));

  const wrap = el('div', { class: 'lease-detail' }, toolbar, paper);
  // Compose once the sheet is attached. setTimeout (not rAF) so it still fires
  // when the tab is backgrounded — rAF is paused for hidden tabs.
  setTimeout(() => playCompose(paper), 0);
  return wrap;
}

function kvBlock(label, value) {
  return el('div', { class: 'doc-kv' },
    el('div', { class: 'doc-kv__l' }, label),
    el('div', { class: 'doc-kv__v' }, docValue(value)));
}
function signLine(role, name) {
  return el('div', { class: 'doc-sign__col' },
    el('div', { class: 'doc-sign__rule' }),
    el('div', { class: 'doc-sign__role' }, role),
    el('div', { class: 'doc-sign__name' }, name));
}

// Plain-language summaries of what each clause covers — enough to show a real
// document, deliberately not the enforceable wording. The stamp and the note
// above make clear this is a sample; the signed lease uses the client's own
// attorney-drafted clauses.
function specimenClauses(pk) {
  const u = pk.vocab.unit;
  const clauses = [
    ['Use of the premises', `The ${u} is a private home for the named tenant and their household.`],
    ['Maintenance and inspections', `The tenant keeps the ${u} in good order and reports faults; the ${pk.vocab.agent} inspects it when moving in and moving out.`],
    ['Deposit handling', pk.compliance.depositNote],
    ['Termination', 'Either party may end the lease by giving the notice period set out above.'],
  ];
  return clauses.map(([h, body]) => docLine('doc-clause',
    el('span', { class: 'doc-clause__h' }, `${h}. `), body));
}

// ---- actions -------------------------------------------------------------

function markSigned(leaseId) {
  mutate((s) => {
    const l = s.data.leases.find((x) => x.id === leaseId);
    if (!l) return;
    l.signed = true;
    l.status = 'active';
    l.signedDate = s.today;
    if (!l.documents?.some((dc) => dc.type === 'Lease agreement')) {
      l.documents = [{ type: 'Lease agreement', ref: `LA-${leaseId.replace('L-', '')}`, date: s.today },
        ...(l.documents || []).filter((dc) => dc.type !== 'Lease agreement (draft)')];
    }
    // TODO(live): capture e-signature (e.g. SigniFlow), lodge the deposit and
    // issue the first invoice.
  });
  toast('Lease marked as signed', { kind: 'ok' });
}

function nextLeaseId() {
  const nums = store.data.leases
    .map((l) => Number(String(l.id).replace(/\D/g, '')))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return `L-${String(next).padStart(4, '0')}`;
}

function openDrawLease() {
  const units = store.data.units;
  const tenants = store.data.people.filter((p) => p.role === 'tenant');
  const firstUnit = units[0];

  const unitSel = field(UC(), el('select', { class: 'field__input', name: 'unit' },
    ...units.map((u) => el('option', { value: u.id }, `${UC()} ${u.code} · ${u.status}`))));
  const tenantSel = field('Tenant', el('select', { class: 'field__input', name: 'tenant' },
    ...tenants.map((t) => el('option', { value: t.id }, t.name))));
  const startInp = field('Start date', el('input', { class: 'field__input', type: 'date', name: 'start', value: store.today }));
  const termSel = field('Term', el('select', { class: 'field__input', name: 'term' },
    el('option', { value: '6' }, '6 months'),
    el('option', { value: '12', selected: true }, '12 months'),
    el('option', { value: '24' }, '24 months')));
  const rentInp = field('Monthly rent', el('input', { class: 'field__input', type: 'text', name: 'rent', value: formatMoney(firstUnit.rent) }));
  const depInp = field('Deposit', el('input', { class: 'field__input', type: 'text', name: 'deposit', value: formatMoney(firstUnit.rent * 2) }));

  // Prefill rent/deposit when the unit changes.
  unitSel.querySelector('select').addEventListener('change', (e) => {
    const u = select.unit(e.target.value);
    if (!u) return;
    rentInp.querySelector('input').value = formatMoney(u.rent);
    depInp.querySelector('input').value = formatMoney(u.rent * 2);
  });

  const form = el('form', { class: 'form-grid', onSubmit: (e) => e.preventDefault() },
    unitSel, tenantSel, startInp, termSel, rentInp, depInp);

  openModal({
    title: 'Draw a new lease',
    body: form,
    actions: [
      { label: 'Cancel', variant: 'ghost', onClick: (close) => close() },
      { label: 'Generate lease', variant: 'primary', onClick: (close) => {
        const get = (n) => form.querySelector(`[name="${n}"]`).value;
        const start = get('start') || store.today;
        const term = Number(get('term'));
        const lease = {
          id: nextLeaseId(),
          unitId: get('unit'),
          tenantId: get('tenant'),
          start,
          end: toISO(leaseEnd(start, term)),
          rent: parseMoney(get('rent')),
          deposit: parseMoney(get('deposit')),
          commissionPct: store.data.commissionPct,
          status: 'unsigned', signed: false, signedDate: null,
          documents: [{ type: 'Lease agreement (draft)', ref: `LA-${nextLeaseId().replace('L-', '')}`, date: store.today }],
        };
        mutate((s) => { s.data.leases.push(lease); });
        close();
        toast(`Lease ${lease.id} generated`, { kind: 'ok' });
        navigateTo('leases', { id: lease.id }); // -> the document composes
      } },
    ],
  });
}

function field(label, input) {
  return el('label', { class: 'field' },
    el('span', { class: 'field__label' }, label), input);
}

// ---- route ---------------------------------------------------------------

registerView('leases', () => {
  const leases = scopedLeases();
  const id = parseHashQuery().get('id');
  if (id) {
    const lease = leases.find((l) => l.id === id); // scope enforced here
    if (lease) return docView(lease);
    // Out of scope / unknown id — fall back to the list rather than error.
  }
  return listView(leases);
});
