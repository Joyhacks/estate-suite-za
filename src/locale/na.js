// Namibia — same model as ZA, adjusted currency and ID. No legal citations:
// compliance notes are neutral, descriptive and meant to be configured per
// client. The ID is accepted and masked, not validated. All data is invented.

import { makeWorld } from './seedShape.js';
import { acceptId } from './idrules.js';

const PAY = ['EFT', 'Debit order', 'Bank transfer'];
const id = acceptId('Namibian ID');

const CFG = {
  estates: [
    { name: 'Auas View Estate', kind: 'Sectional title', town: 'Windhoek', region: 'Khomas', erf: 'Erf 1180', bodyCorporate: 'Auas View Body Corporate' },
    { name: 'Swakop Dunes Lodge', kind: 'Rental portfolio', town: 'Swakopmund', region: 'Erongo', erf: 'Erf 342', bodyCorporate: null },
  ],
  unitCodes: ['12A', '07B', '21C', '15D', '04A', '09C', '22B', 'C2'],
  rents: [13500, 9200, 18500, 12800, 9000, 13000, 19500, 10500],
  levyMajor: 1600, commissionPct: 8,
  paymentMethods: PAY, complianceDoc: 'ID & proof of address',
  tenants: [
    { name: 'Tangeni Amukwaya', id: '88041500123', phone: '+264 81 555 0148' },
    { name: 'Selma Nghipandulwa', id: '91061500456', phone: '+264 81 555 0192' },
    { name: 'Johannes Shikongo', id: '82110300789', phone: '+264 85 555 0173' },
    { name: 'Ndapewa Iyambo', id: '90072200234', phone: '+264 81 555 0164' },
    { name: 'Petrus Haufiku', id: '78021400567', phone: '+264 81 555 0119' },
    { name: 'Maria Amadhila', id: '69093000890', phone: '+264 85 555 0138' },
  ],
  owners: [
    { name: 'Helvi Nakale', id: '75030800111', phone: '+264 81 555 0101', bank: '•••• 4471 (Bank Windhoek)' },
    { name: 'Gerhard Beukes', id: '72041900222', phone: '+264 81 555 0166', bank: '•••• 8820 (FNB Namibia)' },
  ],
  manager: { name: 'Lukas Shivute', phone: '+264 61 555 0110' },
  contractor: { name: 'Namib Maintenance', phone: '+264 64 555 0777', trade: 'Plumbing' },
  applicants: [{ name: 'Frans Kambonde', id: '95051800333' }, { name: 'Aina Nangolo', id: '88120700444' }],
};

export const na = {
  code: 'na', country: 'Namibia', flag: '🇳🇦',
  currency: { code: 'NAD', symbol: 'N$', symbolAfter: false, symbolSpace: false, thousands: ' ', decimal: ',' },
  dateOrder: 'dmy',
  tax: { label: 'VAT', rate: 0.15 },
  deposit: { interestToTenant: false, rate: 0 },
  id,
  payments: PAY,
  vocab: {
    unit: 'unit', unitCap: 'Unit', unitPlural: 'units',
    levy: 'levy', agent: 'managing agent', agentName: 'Kalahari Property Services',
    occupation: 'occupation date', bodyCorporate: 'body corporate', practitioner: 'managing agent',
  },
  compliance: {
    idNote: 'The national ID is shown masked by default. Revealing it in full is recorded in the audit log.',
    depositNote: 'Deposit handling follows the terms agreed in the lease. Set the exact wording per client.',
    leaseNote: 'This is a layout sample, not a legal document. Set up for a client, this page prints their own lawyer-drafted lease instead.',
  },
  leaseFields: [],
  seed: () => makeWorld(CFG, id),
};

export default na;
