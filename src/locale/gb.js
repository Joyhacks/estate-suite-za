// United Kingdom — GBP, a deposit protection scheme field, and NO national ID
// field at all. Neutral, configurable compliance text with no citations.
// All data is invented.

import { makeWorld } from './seedShape.js';
import { noId } from './idrules.js';

const PAY = ['Bank transfer', 'Direct debit', 'Standing order'];

const CFG = {
  estates: [
    { name: 'Camden Wharf', kind: 'Apartment block', town: 'London', region: 'Greater London', erf: 'Title NGL812340', bodyCorporate: 'Camden Wharf Management Company' },
    { name: 'Meadow Court', kind: 'Rental portfolio', town: 'Bristol', region: 'South West', erf: 'Title AV221190', bodyCorporate: null },
  ],
  unitCodes: ['2', '5', '9', '12', '3', '7', '15', 'C2'],
  rents: [1850, 1250, 2400, 1700, 1200, 1800, 2650, 1450],
  levyMajor: 220, commissionPct: 10,
  paymentMethods: PAY, complianceDoc: 'Right to rent & proof of address',
  tenants: [
    { name: 'Oliver Bennett', phone: '+44 7700 900148' },
    { name: 'Priya Sharma', phone: '+44 7700 900192' },
    { name: 'Liam O’Connor', phone: '+44 7700 900173' },
    { name: 'Emily Clarke', phone: '+44 7700 900164' },
    { name: 'Mohammed Khan', phone: '+44 7700 900119' },
    { name: 'Sophie Turner', phone: '+44 7700 900138' },
  ],
  owners: [
    { name: 'Margaret Whitfield', phone: '+44 7700 900101', bank: '•••• 4471 (Barclays)' },
    { name: 'David Osei', phone: '+44 7700 900166', bank: '•••• 8820 (Lloyds)' },
  ],
  manager: { name: 'Claire Hughes', phone: '+44 20 7946 0110' },
  contractor: { name: 'Riverside Maintenance', phone: '+44 20 7946 0777', trade: 'Plumbing' },
  applicants: [{ name: 'Tom Richardson' }, { name: 'Aisha Begum' }],
};

export const gb = {
  code: 'gb', country: 'United Kingdom', flag: '🇬🇧',
  currency: { code: 'GBP', symbol: '£', symbolAfter: false, symbolSpace: false, thousands: ',', decimal: '.' },
  dateOrder: 'dmy',
  tax: { label: 'VAT', rate: 0.20 },
  deposit: { interestToTenant: false, rate: 0 },
  id: noId,
  payments: PAY,
  vocab: {
    unit: 'flat', unitCap: 'Flat', unitPlural: 'flats',
    levy: 'service charge', agent: 'letting agent', agentName: 'Thames Lettings',
    occupation: 'move-in date', bodyCorporate: 'management company', practitioner: 'letting agent',
  },
  compliance: {
    idNote: null, // no national ID is collected
    depositNote: 'The deposit is placed in a tenancy deposit protection scheme.',
    leaseNote: 'This is a layout sample, not a legal document. Set up for a client, this page prints their own solicitor-drafted tenancy agreement instead.',
  },
  // Extra key/value lines shown on the lease document for this country.
  leaseFields: [{ label: 'Deposit protection', value: 'Held in an approved tenancy deposit protection scheme' }],
  seed: () => makeWorld(CFG, noId),
};

export default gb;
