// Seed — the fictional world. Every estate, person, unit, amount and ID here
// is invented. Nothing real ever enters this repo (see CLAUDE.md standing
// rules). Money is in integer CENTS. ID numbers are structurally valid but
// belong to no one. The "now" of this world is 2026-07-26 (store.today), so
// the data is deliberately mid-month: rent collected, rent overdue, leases
// about to expire, a maintenance backlog and a pending approvals queue.

import { rands } from '../domain/money.js';

const PERIOD = '2026-07';

export function seed() {
  return {
    period: PERIOD,
    commissionPct: 8, // property-practitioner fee on collected rent

    estates: [
      {
        id: 'est-silverstrand', name: 'Silverstrand Estate', kind: 'Sectional title',
        town: 'Gordon’s Bay', province: 'Western Cape', erf: 'Erf 2841',
        bodyCorporate: 'Silverstrand Body Corporate', levyPerUnit: rands(1850),
      },
      {
        id: 'est-thornhill', name: 'Thornhill Lodge', kind: 'Rental portfolio',
        town: 'Hogsback', province: 'Eastern Cape', erf: 'Erf 117',
        bodyCorporate: null, levyPerUnit: 0,
      },
    ],

    // status is derived truth for the dashboard's occupancy figures.
    units: [
      { id: 'u-14b', estateId: 'est-silverstrand', code: '14B', bedrooms: 2, sqm: 78,  rent: rands(14500), status: 'occupied' },
      { id: 'u-09a', estateId: 'est-silverstrand', code: '09A', bedrooms: 1, sqm: 54,  rent: rands(9800),  status: 'occupied' },
      { id: 'u-22c', estateId: 'est-silverstrand', code: '22C', bedrooms: 3, sqm: 112, rent: rands(19750), status: 'occupied' },
      { id: 'u-11d', estateId: 'est-silverstrand', code: '11D', bedrooms: 2, sqm: 74,  rent: rands(13900), status: 'occupied' },
      { id: 'u-18a', estateId: 'est-silverstrand', code: '18A', bedrooms: 1, sqm: 52,  rent: rands(9600),  status: 'occupied' },
      { id: 'u-05a', estateId: 'est-silverstrand', code: '05A', bedrooms: 2, sqm: 76,  rent: rands(14200), status: 'vacant' },
      { id: 'u-03c', estateId: 'est-silverstrand', code: '03C', bedrooms: 3, sqm: 108, rent: rands(21000), status: 'vacant' },
      { id: 'u-th3', estateId: 'est-thornhill',    code: 'Chalet 3', bedrooms: 2, sqm: 65, rent: rands(11200), status: 'occupied' },
    ],

    // said values are invented but structurally valid (see said.js).
    people: [
      { id: 'p-sipho',    role: 'tenant', name: 'Sipho Ndlovu',     said: '8804125009081', phone: '072 555 0148', unitId: 'u-14b' },
      { id: 'p-lerato',   role: 'tenant', name: 'Lerato Khumalo',   said: '9106150800080', phone: '083 555 0192', unitId: 'u-09a' },
      { id: 'p-johan',    role: 'tenant', name: 'Johan Pretorius',  said: '8211035321087', phone: '082 555 0173', unitId: 'u-22c' },
      { id: 'p-naledi',   role: 'tenant', name: 'Naledi Sithole',   said: '9007220455089', phone: '079 555 0164', unitId: 'u-11d' },
      { id: 'p-yusuf',    role: 'tenant', name: 'Yusuf Adams',      said: '7802145688083', phone: '084 555 0119', unitId: 'u-18a' },
      { id: 'p-karen',    role: 'tenant', name: 'Karen Botha',      said: '6909300912082', phone: '073 555 0138', unitId: 'u-th3' },

      { id: 'p-thandeka', role: 'owner',  name: 'Thandeka Mokoena', said: '7503080123082', phone: '082 555 0101',
        bankMasked: '•••• 4471 (FNB)', ownsUnitIds: ['u-09a', 'u-11d', 'u-05a'] },
      { id: 'p-pieter',   role: 'owner',  name: 'Pieter Nel',       said: '7204195001087', phone: '082 555 0166',
        bankMasked: '•••• 8820 (Absa)', ownsUnitIds: ['u-14b', 'u-22c', 'u-03c'] },

      { id: 'p-riaan',     role: 'manager',    name: 'Riaan van Zyl',      said: null, phone: '021 555 0110' },
      { id: 'p-coastcare', role: 'contractor', name: 'CoastCare Plumbing', said: null, phone: '021 555 0777', trade: 'Plumbing' },
    ],

    // commissionPct is per-lease so a paid client can vary it by mandate.
    leases: [
      { id: 'L-0142', unitId: 'u-14b', tenantId: 'p-sipho',  start: '2025-08-01', end: '2026-07-31', rent: rands(14500), deposit: rands(29000), commissionPct: 8,  status: 'active', signed: true, signedDate: '2025-07-24',
        documents: [{ type: 'Lease agreement', ref: 'LA-0142', date: '2025-07-24' }, { type: 'FICA pack', ref: 'FICA-0142', date: '2025-07-20' }, { type: 'Ingoing inspection', ref: 'INSP-0142', date: '2025-08-01' }] },
      { id: 'L-0155', unitId: 'u-22c', tenantId: 'p-johan',  start: '2024-09-01', end: '2026-08-31', rent: rands(19750), deposit: rands(39500), commissionPct: 8,  status: 'active', signed: true, signedDate: '2024-08-19',
        documents: [{ type: 'Lease agreement', ref: 'LA-0155', date: '2024-08-19' }, { type: 'FICA pack', ref: 'FICA-0155', date: '2024-08-15' }] },
      { id: 'L-0138', unitId: 'u-09a', tenantId: 'p-lerato', start: '2026-02-01', end: '2027-01-31', rent: rands(9800),  deposit: rands(19600), commissionPct: 7.5, status: 'active', signed: true, signedDate: '2026-01-22',
        documents: [{ type: 'Lease agreement', ref: 'LA-0138', date: '2026-01-22' }, { type: 'FICA pack', ref: 'FICA-0138', date: '2026-01-18' }] },
      { id: 'L-0149', unitId: 'u-11d', tenantId: 'p-naledi', start: '2025-12-01', end: '2026-11-30', rent: rands(13900), deposit: rands(27800), commissionPct: 8,  status: 'active', signed: true, signedDate: '2025-11-20',
        documents: [{ type: 'Lease agreement', ref: 'LA-0149', date: '2025-11-20' }, { type: 'FICA pack', ref: 'FICA-0149', date: '2025-11-16' }] },
      { id: 'L-0151', unitId: 'u-18a', tenantId: 'p-yusuf',  start: '2025-09-16', end: '2026-09-15', rent: rands(9600),  deposit: rands(19200), commissionPct: 8,  status: 'active', signed: true, signedDate: '2025-09-08',
        documents: [{ type: 'Lease agreement', ref: 'LA-0151', date: '2025-09-08' }, { type: 'FICA pack', ref: 'FICA-0151', date: '2025-09-04' }] },
      { id: 'L-0130', unitId: 'u-th3', tenantId: 'p-karen',  start: '2025-01-01', end: '2026-12-31', rent: rands(11200), deposit: rands(22400), commissionPct: 9,  status: 'active', signed: true, signedDate: '2024-12-18',
        documents: [{ type: 'Lease agreement', ref: 'LA-0130', date: '2024-12-18' }, { type: 'FICA pack', ref: 'FICA-0130', date: '2024-12-12' }] },
      // Renewal drawn for the expiring 14B lease, awaiting tenant signature.
      { id: 'L-0161', unitId: 'u-14b', tenantId: 'p-sipho',  start: '2026-08-01', end: '2027-07-31', rent: rands(15200), deposit: rands(30400), commissionPct: 8,  status: 'unsigned', signed: false, signedDate: null,
        documents: [{ type: 'Lease agreement (draft)', ref: 'LA-0161', date: '2026-07-20' }] },
    ],

    // Municipal meter readings, most recent last. Consumption is derived via
    // domain/utilities. Every occupied unit carries a few months of history.
    readings: [
      { unitId: 'u-14b', utility: 'electricity', date: '2026-05-01', reading: 41220 },
      { unitId: 'u-14b', utility: 'electricity', date: '2026-06-01', reading: 41615 },
      { unitId: 'u-14b', utility: 'electricity', date: '2026-07-01', reading: 42008 },
      { unitId: 'u-14b', utility: 'water', date: '2026-05-01', reading: 8840 },
      { unitId: 'u-14b', utility: 'water', date: '2026-06-01', reading: 8902 },
      { unitId: 'u-14b', utility: 'water', date: '2026-07-01', reading: 8961 },
      { unitId: 'u-09a', utility: 'electricity', date: '2026-05-01', reading: 22110 },
      { unitId: 'u-09a', utility: 'electricity', date: '2026-06-01', reading: 22395 },
      { unitId: 'u-09a', utility: 'electricity', date: '2026-07-01', reading: 22660 },
      { unitId: 'u-09a', utility: 'water', date: '2026-06-01', reading: 5512 },
      { unitId: 'u-09a', utility: 'water', date: '2026-07-01', reading: 5559 },
      { unitId: 'u-22c', utility: 'electricity', date: '2026-06-01', reading: 67430 },
      { unitId: 'u-22c', utility: 'electricity', date: '2026-07-01', reading: 67998 },
      { unitId: 'u-22c', utility: 'water', date: '2026-06-01', reading: 12004 },
      { unitId: 'u-22c', utility: 'water', date: '2026-07-01', reading: 12093 },
      { unitId: 'u-11d', utility: 'electricity', date: '2026-06-01', reading: 38210 },
      { unitId: 'u-11d', utility: 'electricity', date: '2026-07-01', reading: 38559 },
      { unitId: 'u-18a', utility: 'electricity', date: '2026-06-01', reading: 19870 },
      { unitId: 'u-18a', utility: 'electricity', date: '2026-07-01', reading: 20102 },
      { unitId: 'u-th3', utility: 'electricity', date: '2026-06-01', reading: 15540 },
      { unitId: 'u-th3', utility: 'electricity', date: '2026-07-01', reading: 15788 },
    ],

    // Monthly rent charges for the current period. paid=false + a past dueDate
    // reads as overdue via domain/rent.overdueStatus.
    invoices: [
      { id: 'inv-0742', leaseId: 'L-0142', unitId: 'u-14b', tenantId: 'p-sipho',  period: PERIOD, dueDate: '2026-07-01', amount: rands(14500), paid: false, paidDate: null, method: null },
      { id: 'inv-0755', leaseId: 'L-0155', unitId: 'u-22c', tenantId: 'p-johan',  period: PERIOD, dueDate: '2026-07-01', amount: rands(19750), paid: false, paidDate: null, method: null },
      { id: 'inv-0730', leaseId: 'L-0130', unitId: 'u-th3', tenantId: 'p-karen',  period: PERIOD, dueDate: '2026-07-01', amount: rands(11200), paid: false, paidDate: null, method: null },
      { id: 'inv-0738', leaseId: 'L-0138', unitId: 'u-09a', tenantId: 'p-lerato', period: PERIOD, dueDate: '2026-07-01', amount: rands(9800),  paid: true,  paidDate: '2026-07-01', method: 'Debit order' },
      { id: 'inv-0749', leaseId: 'L-0149', unitId: 'u-11d', tenantId: 'p-naledi', period: PERIOD, dueDate: '2026-07-01', amount: rands(13900), paid: true,  paidDate: '2026-07-03', method: 'EFT' },
      { id: 'inv-0751', leaseId: 'L-0151', unitId: 'u-18a', tenantId: 'p-yusuf',  period: PERIOD, dueDate: '2026-07-01', amount: rands(9600),  paid: true,  paidDate: '2026-07-05', method: 'EFT' },
    ],

    payments: [
      { id: 'pay-0751', invoiceId: 'inv-0751', unitId: 'u-18a', tenantId: 'p-yusuf',  date: '2026-07-05', amount: rands(9600),  method: 'EFT' },
      { id: 'pay-0749', invoiceId: 'inv-0749', unitId: 'u-11d', tenantId: 'p-naledi', date: '2026-07-03', amount: rands(13900), method: 'EFT' },
      { id: 'pay-0738', invoiceId: 'inv-0738', unitId: 'u-09a', tenantId: 'p-lerato', date: '2026-07-01', amount: rands(9800),  method: 'Debit order' },
      { id: 'pay-0655', invoiceId: 'inv-0655', unitId: 'u-22c', tenantId: 'p-johan',  date: '2026-06-02', amount: rands(19750), method: 'Ozow' },
      { id: 'pay-0642', invoiceId: 'inv-0642', unitId: 'u-14b', tenantId: 'p-sipho',  date: '2026-06-02', amount: rands(14500), method: 'EFT' },
    ],

    maintenance: [
      { id: 'm-3011', unitId: 'u-09a', title: 'Geyser leaking into ceiling',    trade: 'Plumbing',   status: 'assigned',    vendorId: 'p-coastcare', logged: '2026-07-22' },
      { id: 'm-3012', unitId: 'u-22c', title: 'Front gate motor intermittent',  trade: 'Electrical', status: 'reported',    vendorId: null,          logged: '2026-07-24' },
      { id: 'm-3014', unitId: 'u-11d', title: 'Pool pump tripping the DB board', trade: 'Electrical', status: 'in-progress', vendorId: null,          logged: '2026-07-19' },
      { id: 'm-3009', unitId: 'u-14b', title: 'Repaint outgoing inspection marks', trade: 'Painting', status: 'completed',   vendorId: null,          logged: '2026-07-10' },
    ],

    approvals: [
      { id: 'ap-01', kind: 'tenant-application', name: 'Aisha Patel', said: '9505180233081', unitId: 'u-05a', submitted: '2026-07-23' },
      { id: 'ap-02', kind: 'tenant-application', name: 'Themba Zulu', said: '8812075502088', unitId: 'u-03c', submitted: '2026-07-25' },
    ],
  };
}
