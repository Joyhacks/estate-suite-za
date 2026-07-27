// Kenya — KES, national ID, M-Pesa alongside bank transfer. Neutral compliance
// text, no citations. ID accepted and masked, not validated. Data is invented.

import { makeWorld } from './seedShape.js';
import { acceptId } from './idrules.js';

const PAY = ['M-Pesa', 'Bank transfer', 'Cheque'];
const id = acceptId('National ID');

const CFG = {
  estates: [
    { name: 'Kilimani Court', kind: 'Apartment block', town: 'Nairobi', region: 'Nairobi County', erf: 'LR 209/1180', bodyCorporate: 'Kilimani Management Company' },
    { name: 'Nyali Palms', kind: 'Rental portfolio', town: 'Mombasa', region: 'Mombasa County', erf: 'MN/I/4821', bodyCorporate: null },
  ],
  unitCodes: ['A3', 'B1', 'C2', 'A7', 'B4', 'C1', 'D2', 'V2'],
  rents: [95000, 68000, 140000, 90000, 62000, 98000, 150000, 72000],
  levyMajor: 12000, commissionPct: 8,
  paymentMethods: PAY, complianceDoc: 'ID & proof of address',
  tenants: [
    { name: 'Brian Otieno', id: '24567811', phone: '+254 712 555148' },
    { name: 'Wanjiru Kamau', id: '25678922', phone: '+254 722 555192' },
    { name: 'Ali Hassan', id: '23456733', phone: '+254 733 555173' },
    { name: 'Achieng Odhiambo', id: '26789044', phone: '+254 712 555164' },
    { name: 'Kevin Mwangi', id: '24567855', phone: '+254 701 555119' },
    { name: 'Fatuma Abdi', id: '25678966', phone: '+254 720 555138' },
  ],
  owners: [
    { name: 'Grace Njoroge', id: '21234577', phone: '+254 722 555101', bank: '•••• 4471 (KCB)' },
    { name: 'Daniel Kiptoo', id: '22345688', phone: '+254 733 555166', bank: '•••• 8820 (Equity)' },
  ],
  manager: { name: 'James Mutua', phone: '+254 20 555 0110' },
  contractor: { name: 'Nairobi FixIt', phone: '+254 20 555 0777', trade: 'Plumbing' },
  applicants: [{ name: 'Peter Kariuki', id: '27890199' }, { name: 'Zainab Yusuf', id: '28901200' }],
};

export const ke = {
  code: 'ke', country: 'Kenya', flag: '🇰🇪',
  currency: { code: 'KES', symbol: 'KSh', symbolAfter: false, symbolSpace: true, thousands: ',', decimal: '.' },
  dateOrder: 'dmy',
  tax: { label: 'VAT', rate: 0.16 },
  deposit: { interestToTenant: false, rate: 0 },
  id,
  payments: PAY,
  vocab: {
    unit: 'apartment', unitCap: 'Apartment', unitPlural: 'apartments',
    levy: 'service charge', agent: 'letting agent', agentName: 'Acacia Property Management',
    occupation: 'move-in date', bodyCorporate: 'management company', practitioner: 'letting agent',
  },
  compliance: {
    idNote: 'The national ID is shown masked by default. Revealing it in full is recorded in the audit log.',
    depositNote: 'Deposit handling follows the terms agreed in the lease. Set the exact wording per client.',
    leaseNote: 'This is a layout sample, not a legal document. Set up for a client, this page prints their own lawyer-drafted lease instead.',
  },
  leaseFields: [],
  seed: () => makeWorld(CFG, id),
};

export default ke;
