// makeWorld — builds one fictional estate world from a compact per-country
// config. The RELATIONSHIPS (which units are occupied, which rent is overdue,
// which lease is expiring, the maintenance backlog) are identical across
// countries so every pack tells the same coherent mid-month story; only the
// locale flavour (names, places, ID numbers, rents, payment methods, document
// vocabulary) comes from the pack. "Now" is fixed at 2026-07-26 (store.today).
//
// Every person, estate, amount and ID here is invented (CLAUDE.md rule 1).

import { toMinor } from '../domain/money.js';

const OCCUPIED = [0, 1, 2, 3, 4, 7]; // unit indexes that are let
const BEDS = [2, 1, 3, 2, 1, 2, 3, 2];
const SQM = [78, 54, 112, 74, 52, 76, 108, 65];
const LEASE_DATES = {
  0: { start: '2025-08-01', end: '2026-07-31' }, // expiring in 5 days
  2: { start: '2024-09-01', end: '2026-08-31' }, // expiring in 36 days
  1: { start: '2026-02-01', end: '2027-01-31' },
  3: { start: '2025-12-01', end: '2026-11-30' },
  4: { start: '2025-09-16', end: '2026-09-15' },
  7: { start: '2025-01-01', end: '2026-12-31' },
};
const OVERDUE_UNITS = [0, 2, 7]; // unpaid July invoices
const PERIOD = '2026-07';

/**
 * @param {object} cfg per-country config (see any pack file for the shape)
 * @param {object} idCfg the pack's `id` rule ({ present }) — no ID fields when absent
 */
export function makeWorld(cfg, idCfg) {
  const hasId = !!idCfg?.present;
  const pay = cfg.paymentMethods;
  const leaseId = (u) => `L-0${140 + u}`;

  const estates = cfg.estates.map((e, i) => ({
    id: `est-${i}`, name: e.name, kind: e.kind, town: e.town, province: e.region,
    erf: e.erf, bodyCorporate: e.bodyCorporate ?? null,
    levyPerUnit: i === 0 ? toMinor(cfg.levyMajor || 0) : 0,
  }));

  const units = cfg.unitCodes.map((code, i) => ({
    id: `u${i}`, estateId: i === 7 ? 'est-1' : 'est-0', code,
    bedrooms: BEDS[i], sqm: SQM[i], rent: toMinor(cfg.rents[i]),
    status: OCCUPIED.includes(i) ? 'occupied' : 'vacant',
  }));

  // People. IDs only exist where the pack has an ID rule.
  const tenants = cfg.tenants.map((t, k) => ({
    id: `p-tenant-${k}`, role: 'tenant', name: t.name,
    said: hasId ? t.id : null, phone: t.phone, unitId: `u${OCCUPIED[k]}`,
  }));
  const owners = cfg.owners.map((o, k) => ({
    id: `p-owner-${k}`, role: 'owner', name: o.name,
    said: hasId ? o.id : null, phone: o.phone, bankMasked: o.bank,
    ownsUnitIds: (k === 0 ? [1, 3, 5] : [0, 2, 6]).map((i) => `u${i}`),
  }));
  const manager = { id: 'p-manager', role: 'manager', name: cfg.manager.name, said: null, phone: cfg.manager.phone };
  const contractor = { id: 'p-contractor', role: 'contractor', name: cfg.contractor.name, said: null, phone: cfg.contractor.phone, trade: cfg.contractor.trade };
  const people = [...tenants, ...owners, manager, contractor];

  // Leases: one per occupied unit, plus an unsigned renewal for unit 0.
  const complianceDoc = cfg.complianceDoc || 'ID & proof of address';
  const leases = OCCUPIED.map((u, k) => {
    const d = LEASE_DATES[u];
    const docs = [
      { type: 'Lease agreement', ref: `LA-0${140 + u}`, date: d.start },
      hasId ? { type: complianceDoc, ref: `KYC-0${140 + u}`, date: d.start } : null,
      u === 0 ? { type: 'Ingoing inspection', ref: `INSP-0${140 + u}`, date: d.start } : null,
    ].filter(Boolean);
    return {
      id: leaseId(u), unitId: `u${u}`, tenantId: `p-tenant-${k}`,
      start: d.start, end: d.end, rent: units[u].rent, deposit: units[u].rent * 2,
      commissionPct: cfg.commissionPct ?? 8, status: 'active', signed: true, signedDate: d.start,
      documents: docs,
    };
  });
  leases.push({
    id: 'L-0161', unitId: 'u0', tenantId: 'p-tenant-0',
    start: '2026-08-01', end: '2027-07-31',
    rent: Math.round(units[0].rent * 1.05), deposit: Math.round(units[0].rent * 1.05) * 2,
    commissionPct: cfg.commissionPct ?? 8, status: 'unsigned', signed: false, signedDate: null,
    documents: [{ type: 'Lease agreement (draft)', ref: 'LA-0161', date: '2026-07-20' }],
  });

  // July invoices for the six active leases.
  const invoices = OCCUPIED.map((u, k) => {
    const overdue = OVERDUE_UNITS.includes(u);
    return {
      id: `inv-0${140 + u}`, leaseId: leaseId(u), unitId: `u${u}`, tenantId: `p-tenant-${k}`,
      period: PERIOD, dueDate: '2026-07-01', amount: units[u].rent,
      paid: !overdue, paidDate: overdue ? null : ['2026-07-01', '2026-07-03', '2026-07-05'][k % 3],
      method: overdue ? null : pay[k % pay.length],
    };
  });

  // Payments: the paid July invoices, newest first, plus two from June.
  const paid = invoices.filter((i) => i.paid);
  const payments = [
    ...paid.slice().reverse().map((i) => ({
      id: `pay-${i.id.replace('inv-', '')}`, invoiceId: i.id, unitId: i.unitId,
      tenantId: i.tenantId, date: i.paidDate, amount: i.amount, method: i.method,
    })),
    { id: 'pay-june-2', invoiceId: 'inv-june-2', unitId: 'u2', tenantId: 'p-tenant-2', date: '2026-06-02', amount: units[2].rent, method: pay[pay.length - 1] },
    { id: 'pay-june-0', invoiceId: 'inv-june-0', unitId: 'u0', tenantId: 'p-tenant-0', date: '2026-06-02', amount: units[0].rent, method: pay[0] },
  ];

  const maintenance = [
    { id: 'm-3011', unitId: 'u1', title: 'Water heater leaking into the ceiling', trade: 'Plumbing', status: 'assigned', vendorId: 'p-contractor', logged: '2026-07-22' },
    { id: 'm-3012', unitId: 'u2', title: 'Front gate motor is intermittent', trade: 'Electrical', status: 'reported', vendorId: null, logged: '2026-07-24' },
    { id: 'm-3014', unitId: 'u3', title: 'Pool pump tripping the electrical board', trade: 'Electrical', status: 'in-progress', vendorId: null, logged: '2026-07-19' },
    { id: 'm-3009', unitId: 'u0', title: 'Repaint marks from the move-out inspection', trade: 'Painting', status: 'completed', vendorId: null, logged: '2026-07-10' },
  ];

  const approvals = cfg.applicants.map((a, k) => ({
    id: `ap-0${k + 1}`, kind: 'tenant-application', name: a.name,
    said: hasId ? a.id : null, unitId: `u${[5, 6][k]}`, submitted: ['2026-07-23', '2026-07-25'][k],
  }));

  const readings = buildReadings();

  return {
    period: PERIOD, commissionPct: cfg.commissionPct ?? 8,
    estates, units, people, leases, invoices, payments, maintenance, approvals, readings,
  };
}

// Meter numbers are unitless dial readings — shared across countries.
function buildReadings() {
  const mk = (u, utility, date, reading) => ({ unitId: u, utility, date, reading });
  return [
    mk('u0', 'electricity', '2026-05-01', 41220), mk('u0', 'electricity', '2026-06-01', 41615), mk('u0', 'electricity', '2026-07-01', 42008),
    mk('u0', 'water', '2026-05-01', 8840), mk('u0', 'water', '2026-06-01', 8902), mk('u0', 'water', '2026-07-01', 8961),
    mk('u1', 'electricity', '2026-05-01', 22110), mk('u1', 'electricity', '2026-06-01', 22395), mk('u1', 'electricity', '2026-07-01', 22660),
    mk('u1', 'water', '2026-06-01', 5512), mk('u1', 'water', '2026-07-01', 5559),
    mk('u2', 'electricity', '2026-06-01', 67430), mk('u2', 'electricity', '2026-07-01', 67998),
    mk('u2', 'water', '2026-06-01', 12004), mk('u2', 'water', '2026-07-01', 12093),
    mk('u3', 'electricity', '2026-06-01', 38210), mk('u3', 'electricity', '2026-07-01', 38559),
    mk('u4', 'electricity', '2026-06-01', 19870), mk('u4', 'electricity', '2026-07-01', 20102),
    mk('u7', 'electricity', '2026-06-01', 15540), mk('u7', 'electricity', '2026-07-01', 15788),
  ];
}
