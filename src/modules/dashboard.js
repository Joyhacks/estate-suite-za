// Dashboard (build step 3) — the first-five-seconds screen.
// Leads with what needs a decision today (overdue rent, leases to action,
// approvals) above vanity totals. Every widget links to the screen that
// resolves it. Inline actions mutate the store and the KPIs above move.
// Three role variants of one route: manager (full estate), owner (own units
// and payout), tenant (own rent, balance, lease, deposit). Scoping is
// structural — a role's view is built only from its own slice of data.

import { el, frag } from '../ui/el.js';
import { statTile, statRow } from '../ui/stat.js';
import { dataTable, badge } from '../ui/table.js';
import { registerView, path } from '../router.js';
import { store, mutate, select } from '../store.js';
import { ROLES, canSeeField, isBuilt } from '../data/roles.js';
import { formatMoney } from '../domain/money.js';
import { formatTableDate, formatDocDate, daysBetween } from '../domain/dates.js';
import { overdueStatus } from '../domain/rent.js';
import { commissionOn } from '../domain/commission.js';
import { accrueBetween } from '../domain/deposit.js';
import { toast } from '../ui/toast.js';
import { vocab, activePack } from '../locale/active.js';

const EXPIRY_WINDOW = 45;       // days
const DEPOSIT_RATE = 0.0725;    // p.a., accrues to the tenant

const money = (c) => formatMoney(c);
const UC = () => vocab().unitCap;
// Link only to built screens; unbuilt targets render as plain (non-link) tiles
// and panels — no dead links reach a prospect.
const linkTo = (route) => (isBuilt(route) ? path(route) : undefined);

// ---- shared building blocks ---------------------------------------------

function pageHead(title, subtitle) {
  return el('div', { class: 'dash__head' },
    el('h2', { class: 'dash__title' }, title),
    subtitle ? el('p', { class: 'dash__sub' }, subtitle) : null);
}

function panel(title, body, opts = {}) {
  const { href, linkLabel = 'View all', meta, wide = false } = opts;
  const head = el('div', { class: 'panel__head' },
    el('h3', { class: 'panel__title' }, title),
    meta ? el('span', { class: 'panel__meta' }, meta) : null,
    href ? el('a', { class: 'panel__link', href }, `${linkLabel} →`) : null);
  return el('section', { class: 'panel' + (wide ? ' panel--wide' : '') }, head, body);
}

const unitCode = (unitId) => select.unit(unitId)?.code ?? unitId;
const personName = (id) => select.person(id)?.name ?? '—';

function invoiceBadge(inv, today) {
  if (inv.paid) return badge('Paid', 'ok');
  const { overdue, daysOverdue } = overdueStatus(inv.dueDate, today);
  return overdue ? badge(`Overdue ${daysOverdue}d`, 'over') : badge('Due', 'warn');
}

const btn = (label, onClick, variant = 'primary') =>
  el('button', { class: `btn btn--${variant} btn--xs`, onClick }, label);

// ---- actions (mutate the store; the shell re-renders on emit) ------------

function markInvoicePaid(invId, method) {
  mutate((s) => {
    const inv = s.data.invoices.find((i) => i.id === invId);
    if (!inv || inv.paid) return;
    inv.paid = true;
    inv.paidDate = s.today;
    inv.method = method;
    s.data.payments.unshift({
      id: `pay-${invId.replace('inv-', '')}`,
      invoiceId: inv.id, unitId: inv.unitId, tenantId: inv.tenantId,
      date: s.today, amount: inv.amount, method,
    });
    // TODO(live): reconcile against the bank feed / PayFast+Ozow webhook and
    // post the receipt to the tenant ledger.
  });
  toast(`Payment recorded via ${method}`, { kind: 'ok' });
}

function approveApplication(apId) {
  mutate((s) => {
    const ap = s.data.approvals.find((a) => a.id === apId);
    if (!ap) return;
    s.data.approvals = s.data.approvals.filter((a) => a.id !== apId);
    // TODO(live): create the tenant account, run FICA checks and draft a lease
    // for the reserved unit.
  });
  toast('Application approved', { kind: 'ok' });
}

// ---- scoping -------------------------------------------------------------

function fullScope(d) {
  return {
    units: d.units, leases: d.leases, invoices: d.invoices,
    payments: d.payments, maintenance: d.maintenance, approvals: d.approvals,
  };
}

function ownerScope(d, ownerId) {
  const owner = d.people.find((p) => p.id === ownerId);
  const ids = new Set(owner?.ownsUnitIds ?? []);
  const units = d.units.filter((u) => ids.has(u.id));
  return {
    owner,
    units,
    leases: d.leases.filter((l) => ids.has(l.unitId)),
    invoices: d.invoices.filter((i) => ids.has(i.unitId)),
    payments: d.payments.filter((p) => ids.has(p.unitId)),
    maintenance: d.maintenance.filter((m) => ids.has(m.unitId)),
  };
}

function tenantScope(d, tenantId) {
  const tenant = d.people.find((p) => p.id === tenantId);
  return {
    tenant,
    leases: d.leases.filter((l) => l.tenantId === tenantId),
    invoices: d.invoices.filter((i) => i.tenantId === tenantId),
    payments: d.payments.filter((p) => p.tenantId === tenantId),
    maintenance: d.maintenance.filter((m) => m.unitId === tenant?.unitId),
  };
}

// ---- manager (and super admin) ------------------------------------------

function managerView() {
  const d = store.data;
  const today = store.today;
  const s = fullScope(d);

  const outstanding = s.invoices.filter((i) => !i.paid)
    .sort((a, b) => overdueStatus(b.dueDate, today).daysOverdue - overdueStatus(a.dueDate, today).daysOverdue);
  const overdue = outstanding.filter((i) => overdueStatus(i.dueDate, today).overdue);
  const overdueTotal = overdue.reduce((t, i) => t + i.amount, 0);
  const collected = s.invoices.filter((i) => i.paid && i.period === d.period)
    .reduce((t, i) => t + i.amount, 0);

  const occupied = s.units.filter((u) => u.status === 'occupied').length;
  const vacant = s.units.filter((u) => u.status === 'vacant').length;

  const expiring = s.leases.filter((l) => l.status === 'active' && l.signed)
    .map((l) => ({ ...l, daysLeft: daysBetween(today, l.end) }))
    .filter((l) => l.daysLeft >= 0 && l.daysLeft <= EXPIRY_WINDOW);
  const unsigned = s.leases.filter((l) => l.status === 'unsigned');
  const attention = [
    ...unsigned.map((l) => ({ lease: l, kind: 'unsigned' })),
    ...expiring.sort((a, b) => a.daysLeft - b.daysLeft).map((l) => ({ lease: l, kind: 'expiring', daysLeft: l.daysLeft })),
  ];
  const openMaint = s.maintenance.filter((m) => m.status !== 'completed');

  // KPI strip — decisions first, vanity last.
  const kpis = statRow([
    statTile({ label: 'Rent overdue', value: money(overdueTotal),
      sub: `${overdue.length} tenant${overdue.length === 1 ? '' : 's'} behind on rent`,
      tone: 'over', emphasis: true, href: linkTo('finance') }),
    statTile({ label: 'Leases to act on', value: String(attention.length),
      sub: 'expiring soon or not yet signed', tone: 'warn', href: linkTo('leases') }),
    statTile({ label: 'New tenants to approve', value: String(s.approvals.length),
      sub: 'applications waiting', tone: 'warn', href: linkTo('tenants') }),
    statTile({ label: 'Collected this month', value: money(collected),
      sub: 'rent received in July', tone: 'ok', href: linkTo('finance') }),
    statTile({ label: 'Occupancy', value: `${occupied}/${occupied + vacant}`,
      sub: `${vacant} unit${vacant === 1 ? '' : 's'} standing empty`, href: linkTo('properties') }),
  ]);

  // Outstanding rent — the money on the table, overdue first, with a working
  // Mark-paid action per row.
  const rentTable = dataTable({
    columns: [
      { label: UC(), render: (i) => unitCode(i.unitId) },
      { label: 'Tenant', render: (i) => personName(i.tenantId) },
      { label: 'Due', render: (i) => formatTableDate(i.dueDate) },
      { label: 'Amount', align: 'right', numeric: true, render: (i) => money(i.amount) },
      { label: 'Status', render: (i) => invoiceBadge(i, today) },
      { label: '', align: 'right', render: (i) => btn('Mark paid', () => markInvoicePaid(i.id, activePack().payments[0])) },
    ],
    rows: outstanding,
    rowClass: (i) => (overdueStatus(i.dueDate, today).overdue ? 'row--over' : null),
    empty: 'All rent collected — nothing outstanding.',
  });

  const approvalsTable = dataTable({
    columns: [
      { label: 'Applicant', key: 'name' },
      { label: 'For unit', render: (a) => unitCode(a.unitId) },
      { label: 'Submitted', render: (a) => formatTableDate(a.submitted) },
      { label: '', align: 'right', render: (a) => btn('Approve', () => approveApplication(a.id)) },
    ],
    rows: s.approvals,
    empty: 'No pending applications.',
  });

  const leaseTable = dataTable({
    columns: [
      { label: 'Lease', key: 'id', render: (r) => r.lease.id },
      { label: UC(), render: (r) => unitCode(r.lease.unitId) },
      { label: 'Tenant', render: (r) => personName(r.lease.tenantId) },
      { label: 'Ends', render: (r) => formatDocDate(r.lease.end) },
      { label: 'Status', render: (r) => (r.kind === 'unsigned'
        ? badge('Unsigned', 'over')
        : badge(`${r.daysLeft} days left`, 'warn')) },
    ],
    rows: attention,
    empty: 'No leases need attention.',
  });

  const maintTable = dataTable({
    columns: [
      { label: 'Ref', key: 'id' },
      { label: UC(), render: (m) => unitCode(m.unitId) },
      { label: 'Issue', key: 'title' },
      { label: 'Status', render: (m) => badge(maintLabel(m.status), maintTone(m.status)) },
    ],
    rows: openMaint,
    empty: 'No open jobs.',
  });

  const paymentsTable = dataTable({
    columns: [
      { label: 'Date', render: (p) => formatTableDate(p.date) },
      { label: UC(), render: (p) => unitCode(p.unitId) },
      { label: 'Amount', align: 'right', numeric: true, render: (p) => money(p.amount) },
      { label: 'Method', key: 'method' },
    ],
    rows: s.payments.slice(0, 5),
    empty: 'No payments yet.',
  });

  return frag(
    pageHead(d.estates.map((e) => e.name).join(' & '),
      `${personName('p-manager')} · property manager · ${formatDocDate(today)}`),
    kpis,
    panel('Outstanding rent', rentTable,
      { href: linkTo('finance'), linkLabel: 'Open rent collection', wide: true,
        meta: `${overdue.length} overdue` }),
    el('div', { class: 'panel-grid' },
      panel('Account approvals', approvalsTable, { href: linkTo('tenants'), meta: `${s.approvals.length} waiting` }),
      panel('Leases needing attention', leaseTable, { href: linkTo('leases'), meta: `${attention.length}` }),
      panel('Open maintenance', maintTable, { href: linkTo('maintenance'), meta: `${openMaint.length} open` }),
      panel('Recent payments', paymentsTable, { href: linkTo('finance') }),
    ),
  );
}

function maintLabel(status) {
  return { reported: 'Reported', assigned: 'Assigned', 'in-progress': 'In progress',
    'waiting-parts': 'Waiting parts', completed: 'Completed' }[status] ?? status;
}
function maintTone(status) {
  return status === 'reported' ? 'over' : status === 'completed' ? 'ok' : 'warn';
}

// ---- owner ---------------------------------------------------------------

function ownerView() {
  const d = store.data;
  const today = store.today;
  const role = store.role;
  const ownerId = ROLES.owner.personId;
  const s = ownerScope(d, ownerId);

  const overdue = s.invoices.filter((i) => !i.paid && overdueStatus(i.dueDate, today).overdue);
  const overdueTotal = overdue.reduce((t, i) => t + i.amount, 0);
  const collected = s.invoices.filter((i) => i.paid && i.period === d.period)
    .reduce((t, i) => t + i.amount, 0);
  const occupied = s.units.filter((u) => u.status === 'occupied').length;
  const vacant = s.units.filter((u) => u.status === 'vacant').length;

  const pk = activePack();
  const { total: feeIncl, netToOwner } = commissionOn(collected, d.commissionPct, { vat: true, rate: pk.tax.rate });

  const kpis = statRow([
    statTile({ label: `Vacant ${vocab().unitPlural}`, value: String(vacant),
      sub: vacant ? 'earning no rent' : 'fully let', tone: vacant ? 'warn' : 'ok', href: linkTo('properties') }),
    statTile({ label: 'Rent overdue', value: money(overdueTotal),
      sub: `${overdue.length} on your units`, tone: overdueTotal ? 'over' : 'ok', href: linkTo('finance') }),
    statTile({ label: 'Your July payout', value: money(netToOwner),
      sub: 'after fees', tone: 'ok', emphasis: true, href: linkTo('owners') }),
    statTile({ label: 'Occupancy', value: `${occupied}/${occupied + vacant}`,
      sub: 'your portfolio', href: linkTo('properties') }),
  ]);

  const unitsTable = dataTable({
    columns: [
      { label: UC(), key: 'code' },
      { label: 'Tenant', render: (u) => tenantOfUnit(s.leases, u.id) },
      { label: 'Rent', align: 'right', numeric: true, render: (u) => money(u.rent) },
      { label: 'This month', render: (u) => unitRentStatus(s.invoices, u, today) },
    ],
    rows: s.units,
    empty: 'You have no units on file.',
  });

  // Payout statement. The management-fee breakdown is a manager/owner-visible
  // line only where allowed; the per-lease commission RATE stays manager-only
  // and is simply never rendered here.
  const payoutRows = [
    el('div', { class: 'kv' }, el('span', {}, 'Gross rent collected'), el('span', { class: 'kv__v is-num' }, money(collected))),
  ];
  if (canSeeField(role, 'lease.commission')) {
    payoutRows.push(el('div', { class: 'kv' },
      el('span', {}, `Management fee (${d.commissionPct}% incl. ${pk.tax.label})`),
      el('span', { class: 'kv__v is-num' }, `-${money(feeIncl)}`)));
  } else {
    payoutRows.push(el('div', { class: 'kv kv--muted' },
      el('span', {}, 'Management fee'),
      el('span', { class: 'kv__v is-num' }, `-${money(feeIncl)}`)));
  }
  payoutRows.push(el('div', { class: 'kv kv--total' },
    el('span', {}, 'Net payout to you'), el('span', { class: 'kv__v is-num' }, money(netToOwner))));
  const payout = el('div', { class: 'kv-list' }, ...payoutRows);

  const maintTable = dataTable({
    columns: [
      { label: 'Ref', key: 'id' },
      { label: UC(), render: (m) => unitCode(m.unitId) },
      { label: 'Issue', key: 'title' },
      { label: 'Status', render: (m) => badge(maintLabel(m.status), maintTone(m.status)) },
    ],
    rows: s.maintenance.filter((m) => m.status !== 'completed'),
    empty: 'No open jobs on your units.',
  });

  return frag(
    pageHead(`${s.owner.name}`, `Unit owner · ${s.units.length} units · ${formatDocDate(today)}`),
    kpis,
    el('div', { class: 'panel-grid' },
      panel('Your units', unitsTable, { href: linkTo('properties'), meta: `${occupied}/${occupied + vacant} let` }),
      panel('Payout — July', payout, { href: linkTo('owners'), linkLabel: 'Statements' }),
      panel('Maintenance on your units', maintTable, { href: linkTo('maintenance') }),
    ),
  );
}

function tenantOfUnit(leases, unitId) {
  const l = leases.find((x) => x.unitId === unitId && x.status === 'active');
  return l ? personName(l.tenantId) : el('span', { class: 'muted' }, 'Vacant');
}
function unitRentStatus(invoices, unit, today) {
  if (unit.status === 'vacant') return badge('Vacant', 'neutral');
  const inv = invoices.find((i) => i.unitId === unit.id);
  if (!inv) return el('span', { class: 'muted' }, '—');
  return invoiceBadge(inv, today);
}

// ---- tenant --------------------------------------------------------------

function tenantView() {
  const d = store.data;
  const today = store.today;
  const tenantId = ROLES.tenant.personId;
  const s = tenantScope(d, tenantId);

  const active = s.leases.find((l) => l.status === 'active') ?? s.leases[0];
  const renewal = s.leases.find((l) => l.status === 'unsigned');
  const unpaid = s.invoices.filter((i) => !i.paid);
  const balance = unpaid.reduce((t, i) => t + i.amount, 0);
  const hasOverdue = unpaid.some((i) => overdueStatus(i.dueDate, today).overdue);
  const daysLeft = active ? daysBetween(today, active.end) : null;

  const dep = activePack().deposit;
  const interest = (active && dep.interestToTenant)
    ? accrueBetween({ principalCents: active.deposit, annualRate: dep.rate, from: active.start, to: today })
    : 0;
  const depositTotal = (active?.deposit ?? 0) + interest;

  const kpis = statRow([
    statTile({ label: 'Rent due', value: money(balance),
      sub: hasOverdue ? 'overdue — please settle' : 'up to date',
      tone: balance ? 'over' : 'ok', emphasis: true, href: linkTo('payments') }),
    statTile({ label: 'Lease', value: active ? `Ends ${formatTableDate(active.end)}` : '—',
      sub: daysLeft != null ? `${daysLeft} days left${renewal ? ' · renewal ready' : ''}` : '',
      tone: daysLeft != null && daysLeft <= EXPIRY_WINDOW ? 'warn' : 'default', href: linkTo('leases') }),
    statTile({ label: 'Deposit held', value: money(depositTotal),
      sub: interest ? `incl. ${money(interest)} interest` : 'held for you', tone: 'default', href: linkTo('finance') }),
    statTile({ label: UC(), value: unitCode(s.tenant?.unitId),
      sub: store.data.estates.find((e) => e.id === select.unit(s.tenant?.unitId)?.estateId)?.name ?? '',
      href: linkTo('maintenance') }),
  ]);

  const rentTable = dataTable({
    columns: [
      { label: 'Period', key: 'period' },
      { label: 'Due', render: (i) => formatTableDate(i.dueDate) },
      { label: 'Amount', align: 'right', numeric: true, render: (i) => money(i.amount) },
      { label: 'Status', render: (i) => invoiceBadge(i, today) },
      { label: '', align: 'right', render: (i) => (i.paid ? '' : btn('Pay now', () => payRent(i.id))) },
    ],
    rows: s.invoices,
    empty: 'No charges on your account.',
  });

  const leaseCard = el('div', { class: 'kv-list' },
    kv(UC(), unitCode(active?.unitId)),
    kv('Monthly rent', money(active?.rent ?? 0)),
    kv('Lease start', formatDocDate(active?.start)),
    kv('Lease end', formatDocDate(active?.end)),
    renewal
      ? el('div', { class: 'kv kv--total' }, el('span', {}, 'Renewal'),
          el('span', { class: 'kv__v' }, badge('Ready to sign', 'warn')))
      : null,
  );

  const depositCard = el('div', { class: 'kv-list' },
    kv('Deposit paid', money(active?.deposit ?? 0)),
    dep.interestToTenant
      ? kv(`Interest accrued (${(dep.rate * 100).toFixed(2)}% p.a.)`, money(interest))
      : null,
    el('div', { class: 'kv kv--total' }, el('span', {}, 'Held for you'),
      el('span', { class: 'kv__v is-num' }, money(depositTotal))));

  return frag(
    pageHead(`Welcome, ${firstName(s.tenant?.name)}`,
      `${s.tenant?.name} · ${UC()} ${unitCode(s.tenant?.unitId)} · ${formatDocDate(today)}`),
    kpis,
    panel('Your rent', rentTable, { href: linkTo('payments'), linkLabel: 'Payment history', wide: true }),
    el('div', { class: 'panel-grid' },
      panel('Your lease', leaseCard, { href: linkTo('leases'), linkLabel: 'View lease' }),
      panel('Your deposit', depositCard, { href: linkTo('finance'), linkLabel: 'Deposit statement' }),
    ),
  );
}

function payRent(invId) {
  // TODO(live): redirect to the country's online payment provider, then confirm
  // on the webhook return.
  markInvoicePaid(invId, activePack().payments[0]);
}

function kv(label, value) {
  return el('div', { class: 'kv' }, el('span', {}, label),
    el('span', { class: 'kv__v is-num' }, value));
}
const firstName = (n) => (n ? n.split(' ')[0] : 'there');

// ---- route registration --------------------------------------------------

registerView('dashboard', () => {
  const view = { manager: managerView, super_admin: managerView,
    owner: ownerView, tenant: tenantView }[store.role] ?? managerView;
  return el('div', { class: 'dash' }, view());
});
