// Domain unit tests. Framework-free: a tiny assert harness that runs in the
// browser (tests/runner.html) and reports pass/fail. No DOM in the domain
// itself — these tests only import pure functions.

import { setPack } from '../src/locale/active.js';
import { za } from '../src/locale/za.js';
import { gb } from '../src/locale/gb.js';
import { formatMoney, parseMoney, rands } from '../src/domain/money.js';
import {
  formatDocDate, formatTableDate, toISO, daysBetween, daysInMonth, addDays,
  addMonths, leaseEnd,
} from '../src/domain/dates.js';
import { validateSAID, decodeSAID, maskSAID } from '../src/domain/said.js';
import { addVAT, removeVAT, vatPortion, vatBreakdown, VAT_RATE } from '../src/domain/vat.js';
import { accrueSimple, accrueBetween, refundDue } from '../src/domain/deposit.js';
import { commissionOn } from '../src/domain/commission.js';
import { prorateFromOccupation, overdueStatus, arrears } from '../src/domain/rent.js';
import { consumption, recoverUtility, steppedCharge } from '../src/domain/utilities.js';
import { createAuditLog } from '../src/domain/audit.js';

const NBSP = ' ';

// Formatting reads the active pack; ZA is the reference for most assertions.
setPack(za);

// ---- harness -------------------------------------------------------------
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, message: err.message });
  }
}
function eq(actual, expected, note = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${note} expected ${e}, got ${a}`);
}
function ok(cond, note = '') {
  if (!cond) throw new Error(note || 'expected truthy');
}

// ---- money ---------------------------------------------------------------
test('formatMoney groups thousands with a space and comma decimal', () => {
  eq(formatMoney(1450000), `R14${NBSP}500,00`);
  eq(formatMoney(50), 'R0,50');
  eq(formatMoney(-120050), `-R1${NBSP}200,50`);
  eq(formatMoney(100000000), `R1${NBSP}000${NBSP}000,00`);
});
test('formatMoney without symbol', () => {
  eq(formatMoney(1450000, { symbol: false }), `14${NBSP}500,00`);
});
test('parseMoney inverts formatMoney', () => {
  eq(parseMoney('R14 500,00'), 1450000);
  eq(parseMoney('-R1 200,50'), -120050);
  eq(parseMoney(formatMoney(999999)), 999999); // round-trips through the formatter
  eq(rands(9999.99), 999999);                  // whole-rands helper -> cents
});

// ---- dates ---------------------------------------------------------------
test('date formats follow SA doc vs table convention', () => {
  eq(formatDocDate('2026-08-01'), '1 August 2026');
  eq(formatTableDate('2026-08-01'), '01/08/2026');
  eq(toISO('2026-08-01'), '2026-08-01');
});
test('daysBetween / daysInMonth / addDays', () => {
  eq(daysBetween('2026-08-01', '2026-08-10'), 9);
  eq(daysBetween('2026-08-10', '2026-08-01'), -9);
  eq(daysInMonth('2026-02-14'), 28); // 2026 is not a leap year
  eq(daysInMonth('2024-02-14'), 29); // 2024 is
  eq(toISO(addDays('2026-08-30', 3)), '2026-09-02');
});
test('addMonths clamps the day; leaseEnd is the last day before rollover', () => {
  eq(toISO(addMonths('2026-01-31', 1)), '2026-02-28'); // clamps to Feb length
  eq(toISO(addMonths('2026-08-01', 12)), '2027-08-01');
  eq(toISO(leaseEnd('2026-08-01', 12)), '2027-07-31'); // 12-month term
  eq(toISO(leaseEnd('2026-02-01', 6)), '2026-07-31');
});

// ---- SA ID ---------------------------------------------------------------
test('validateSAID accepts a well-formed invented ID', () => {
  const res = validateSAID('8804125009081');
  ok(res.valid, res.reason);
});
test('validateSAID rejects bad length, month and checksum', () => {
  ok(!validateSAID('12345').valid);
  ok(!validateSAID('8813125009081').valid); // month 13
  ok(!validateSAID('8804125009082').valid); // broken Luhn
});
test('decodeSAID extracts DOB, gender, citizenship', () => {
  const d = decodeSAID('8804125009081');
  eq(d, { dobISO: '1988-04-12', gender: 'male', citizen: 'sa' });
});
test('maskSAID hides all but the last four', () => {
  eq(maskSAID('8804125009081'), '•••••••••9081');
});

// ---- VAT -----------------------------------------------------------------
test('VAT add/remove/portion at 15%', () => {
  eq(VAT_RATE, 0.15);
  eq(addVAT(100000), 115000);
  eq(removeVAT(115000), 100000);
  eq(vatPortion(115000), 15000);
  eq(vatBreakdown(100000, 'exclusive'), { excl: 100000, vat: 15000, incl: 115000 });
  eq(vatBreakdown(115000, 'inclusive'), { excl: 100000, vat: 15000, incl: 115000 });
});

// ---- deposit -------------------------------------------------------------
test('deposit simple interest accrues to the tenant', () => {
  // R10 000 at 7.30% p.a. for 365 days = R730,00
  eq(accrueSimple(1000000, 0.073, 365), 73000);
  eq(accrueBetween({
    principalCents: 1000000, annualRate: 0.073, from: '2025-01-01', to: '2026-01-01',
  }), 73000);
});
test('refundDue never goes negative', () => {
  eq(refundDue({ principalCents: 1000000, interestCents: 73000, deductionsCents: 200000 }), 873000);
  eq(refundDue({ principalCents: 100000, deductionsCents: 500000 }), 0);
});

// ---- commission ----------------------------------------------------------
test('commission with and without VAT', () => {
  eq(commissionOn(1000000, 8), { fee: 80000, vat: 0, total: 80000, netToOwner: 920000 });
  eq(commissionOn(1000000, 8, { vat: true }),
    { fee: 80000, vat: 12000, total: 92000, netToOwner: 908000 });
});

// ---- rent ----------------------------------------------------------------
test('prorate from occupation date', () => {
  // Occupy 15 Aug: 17 of 31 days chargeable at R14 500 monthly.
  eq(prorateFromOccupation(1450000, '2026-08-15'), Math.round(1450000 * (17 / 31)));
});
test('overdueStatus respects grace days', () => {
  eq(overdueStatus('2026-08-01', '2026-08-01', 3), { overdue: false, daysOverdue: 0 });
  eq(overdueStatus('2026-08-01', '2026-08-06', 3), { overdue: true, daysOverdue: 2 });
});
test('arrears rolls opening + charges - payments', () => {
  eq(arrears({ openingCents: 50000, chargesCents: 1450000, paymentsCents: 1450000 }), 50000);
});

// ---- utilities -----------------------------------------------------------
test('meter consumption handles rollover', () => {
  eq(consumption(1200, 1450), 250);
  eq(consumption(999900, 120, 6), 220); // rolled past 999999
});
test('recoverUtility adds VAT on usage + basic charge', () => {
  // 250 kWh @ 285c + R230,00 basic = R712,50 + R230 = R942,50 excl
  const r = recoverUtility({ units: 250, tariffCents: 285, basicChargeCents: 23000 });
  eq(r.usageCents, 71250);
  eq(r.excl, 94250);
  eq(r.total, addVAT(94250));
});
test('steppedCharge applies rising water blocks', () => {
  // 0-6 @ 1500c, 6-15 @ 2200c, 15+ @ 3000c; use 20 units
  const blocks = [
    { upTo: 6, tariffCents: 1500 },
    { upTo: 15, tariffCents: 2200 },
    { upTo: null, tariffCents: 3000 },
  ];
  eq(steppedCharge(20, blocks), 6 * 1500 + 9 * 2200 + 5 * 3000);
});

// ---- audit ---------------------------------------------------------------
test('audit log records and filters privileged actions', () => {
  const log = createAuditLog();
  log.record('said.unmask', { actorId: 'u1', subject: 't42', at: '2026-07-26T10:00:00Z' });
  log.record('lease.void', { actorId: 'u1', subject: 'L9', at: '2026-07-26T11:00:00Z' });
  eq(log.size, 2);
  eq(log.byAction('said.').length, 1);
  eq(log.forSubject('t42').length, 1);
});

// ---- locale packs --------------------------------------------------------
test('formatMoney follows the active pack (ZA vs GB)', () => {
  setPack(gb);
  eq(formatMoney(185000), '£1,850.00');
  eq(formatMoney(-120050), '-£1,200.50');
  setPack(za); // restore reference for any later assertions
  eq(formatMoney(1450000), `R14${NBSP}500,00`);
});
test('GB pack collects no national ID; ZA does', () => {
  ok(gb.id.present === false, 'GB must not collect an ID');
  ok(za.id.present === true, 'ZA collects an ID');
  eq(za.id.mask('8804125009081'), '•••••••••9081');
});
test('only ZA asserts ID validity; others accept without asserting', () => {
  ok(za.id.validate('8804125009082').valid === false, 'ZA rejects a bad checksum');
  ok(gb.id.validate('anything').valid === true, 'GB does not assert validity');
});
test('every pack seeds the same coherent skeleton', () => {
  for (const p of [za, gb]) {
    const w = p.seed();
    eq(w.units.length, 8, `${p.code} units`);
    eq(w.leases.length, 7, `${p.code} leases`);
    ok(w.people.some((x) => x.id === 'p-tenant-0'), `${p.code} has stable tenant id`);
  }
  setPack(za);
});

export function run() {
  return results;
}
