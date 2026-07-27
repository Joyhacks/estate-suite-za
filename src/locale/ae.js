// United Arab Emirates — AED, Emirates ID, and a tenancy contract registration
// field. Neutral, configurable compliance text with no citations. The Emirates
// ID is accepted and masked, not validated. All data is invented.

import { makeWorld } from './seedShape.js';
import { acceptId } from './idrules.js';

const PAY = ['Bank transfer', 'Cheque', 'Direct debit'];
const id = acceptId('Emirates ID');

const CFG = {
  estates: [
    { name: 'Marina Heights', kind: 'Apartment tower', town: 'Dubai', region: 'Dubai', erf: 'Plot 342 — Marina', bodyCorporate: 'Marina Heights Owners Association' },
    { name: 'Corniche Residences', kind: 'Rental portfolio', town: 'Abu Dhabi', region: 'Abu Dhabi', erf: 'Plot 118 — Corniche', bodyCorporate: null },
  ],
  unitCodes: ['1203', '0906', '2210', '1508', '0402', '0911', '2205', 'TH2'],
  rents: [8500, 5500, 12000, 7800, 5200, 8200, 13500, 6500],
  levyMajor: 900, commissionPct: 5,
  paymentMethods: PAY, complianceDoc: 'ID & tenancy documents',
  tenants: [
    { name: 'Ahmed Al Mansoori', id: '784198812345671', phone: '+971 50 555 0148' },
    { name: 'Priya Nair', id: '784199012345682', phone: '+971 55 555 0192' },
    { name: 'Omar Haddad', id: '784198212345693', phone: '+971 52 555 0173' },
    { name: 'Fatima Al Zaabi', id: '784199012345604', phone: '+971 50 555 0164' },
    { name: 'Rajesh Kumar', id: '784197812345615', phone: '+971 56 555 0119' },
    { name: 'Layla Hassan', id: '784196912345626', phone: '+971 55 555 0138' },
  ],
  owners: [
    { name: 'Khalid Al Suwaidi', id: '784197512345637', phone: '+971 50 555 0101', bank: '•••• 4471 (Emirates NBD)' },
    { name: 'Sunil Menon', id: '784197212345648', phone: '+971 52 555 0166', bank: '•••• 8820 (ADCB)' },
  ],
  manager: { name: 'Yousef Rahman', phone: '+971 4 555 0110' },
  contractor: { name: 'Gulf Facilities', phone: '+971 4 555 0777', trade: 'Plumbing' },
  applicants: [{ name: 'Bilal Sheikh', id: '784199512345659' }, { name: 'Noura Ali', id: '784198812345660' }],
};

export const ae = {
  code: 'ae', country: 'United Arab Emirates', flag: '🇦🇪',
  currency: { code: 'AED', symbol: 'AED', symbolAfter: false, symbolSpace: true, thousands: ',', decimal: '.' },
  dateOrder: 'dmy',
  tax: { label: 'VAT', rate: 0.05 },
  deposit: { interestToTenant: false, rate: 0 },
  id,
  payments: PAY,
  vocab: {
    unit: 'apartment', unitCap: 'Apartment', unitPlural: 'apartments',
    levy: 'service charge', agent: 'property manager', agentName: 'Falcon Property Management',
    occupation: 'handover date', bodyCorporate: 'owners association', practitioner: 'property manager',
  },
  compliance: {
    idNote: 'The Emirates ID is shown masked by default. Revealing it in full is recorded in the audit log.',
    depositNote: 'Deposit handling follows the terms agreed in the tenancy contract. Set the exact wording per client.',
    leaseNote: 'This is a layout sample, not a legal document. Set up for a client, this page prints their own registered tenancy contract instead.',
  },
  leaseFields: [{ label: 'Tenancy contract registration', value: 'Registered with the local authority' }],
  seed: () => makeWorld(CFG, id),
};

export default ae;
