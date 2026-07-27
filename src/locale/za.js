// South Africa — the reference pack. Full depth. This is the only jurisdiction
// whose facts have been verified, so it is the only pack that states specific
// things (deposit interest accrues to the tenant; the ID encodes a date of
// birth; VAT 15%). It cites no act or section number. All data is invented.

import { makeWorld } from './seedShape.js';
import { zaId } from './idrules.js';

const PAY = ['EFT', 'Debit order', 'Ozow', 'PayFast', 'Peach'];

const CFG = {
  estates: [
    { name: 'Silverstrand Estate', kind: 'Sectional title', town: 'Gordon’s Bay', region: 'Western Cape', erf: 'Erf 2841', bodyCorporate: 'Silverstrand Body Corporate' },
    { name: 'Thornhill Lodge', kind: 'Rental portfolio', town: 'Hogsback', region: 'Eastern Cape', erf: 'Erf 117', bodyCorporate: null },
  ],
  unitCodes: ['14B', '09A', '22C', '11D', '18A', '05A', '03C', 'C3'],
  rents: [14500, 9800, 19750, 13900, 9600, 14200, 21000, 11200],
  levyMajor: 1850, commissionPct: 8,
  paymentMethods: PAY, complianceDoc: 'FICA pack',
  tenants: [
    { name: 'Sipho Ndlovu', id: '8804125009081', phone: '072 555 0148' },
    { name: 'Lerato Khumalo', id: '9106150800080', phone: '083 555 0192' },
    { name: 'Johan Pretorius', id: '8211035321087', phone: '082 555 0173' },
    { name: 'Naledi Sithole', id: '9007220455089', phone: '079 555 0164' },
    { name: 'Yusuf Adams', id: '7802145688083', phone: '084 555 0119' },
    { name: 'Karen Botha', id: '6909300912082', phone: '073 555 0138' },
  ],
  owners: [
    { name: 'Thandeka Mokoena', id: '7503080123082', phone: '082 555 0101', bank: '•••• 4471 (FNB)' },
    { name: 'Pieter Nel', id: '7204195001087', phone: '082 555 0166', bank: '•••• 8820 (Absa)' },
  ],
  manager: { name: 'Riaan van Zyl', phone: '021 555 0110' },
  contractor: { name: 'CoastCare Plumbing', phone: '021 555 0777', trade: 'Plumbing' },
  applicants: [{ name: 'Aisha Patel', id: '9505180233081' }, { name: 'Themba Zulu', id: '8812075502088' }],
};

export const za = {
  code: 'za', country: 'South Africa', flag: '🇿🇦',
  currency: { code: 'ZAR', symbol: 'R', symbolAfter: false, symbolSpace: false, thousands: ' ', decimal: ',' },
  dateOrder: 'dmy',
  tax: { label: 'VAT', rate: 0.15 },
  // Interest on the deposit accrues to the tenant — a verified SA fact.
  deposit: { interestToTenant: true, rate: 0.0725 },
  id: zaId,
  payments: PAY,
  vocab: {
    unit: 'unit', unitCap: 'Unit', unitPlural: 'units',
    levy: 'levy', agent: 'managing agent', agentName: 'Cape Vine Properties',
    occupation: 'occupation date', bodyCorporate: 'body corporate', practitioner: 'property practitioner',
  },
  compliance: {
    idNote: 'A South African ID number contains the holder’s date of birth, so it is shown masked by default. Revealing it in full is recorded in the audit log.',
    depositNote: 'The deposit is held in an interest-bearing account, and the interest earned belongs to the tenant.',
    leaseNote: 'This is a layout sample, not a legal document. Set up for a client, this page prints their own attorney-drafted lease instead.',
  },
  leaseFields: [],
  seed: () => makeWorld(CFG, zaId),
};

export default za;
