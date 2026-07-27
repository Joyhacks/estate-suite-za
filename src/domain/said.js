// South African ID numbers — validate, decode, mask.
// Format: YYMMDD SSSS C A Z  (13 digits)
//   YYMMDD  date of birth
//   SSSS    gender sequence: 0000-4999 female, 5000-9999 male
//   C       citizenship: 0 = SA citizen, 1 = permanent resident
//   A       historically 8 (or 9)
//   Z       Luhn check digit
// SA IDs encode a date of birth, so they are sensitive. Mask to last four by
// default; unmasking must be recorded as an audited action (see audit.js).
// Pure, DOM-free. All ID numbers in this repo are invented.

/** Luhn checksum over a numeric string. */
function luhnValid(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * Validate structure, embedded date and Luhn digit.
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateSAID(id) {
  const s = String(id || '').trim();
  if (!/^\d{13}$/.test(s)) return { valid: false, reason: 'Must be 13 digits' };
  const mm = Number(s.slice(2, 4));
  const dd = Number(s.slice(4, 6));
  if (mm < 1 || mm > 12) return { valid: false, reason: 'Invalid birth month' };
  if (dd < 1 || dd > 31) return { valid: false, reason: 'Invalid birth day' };
  const c = s[10];
  if (c !== '0' && c !== '1') return { valid: false, reason: 'Invalid citizenship digit' };
  if (!luhnValid(s)) return { valid: false, reason: 'Checksum failed' };
  return { valid: true };
}

/**
 * Decode an ID into its parts. `pivotYear` disambiguates the 2-digit year:
 * years >= pivot are treated as 1900s, else 2000s. Default pivot 25.
 * @returns {{dobISO: string, gender: 'male'|'female', citizen: 'sa'|'permanent-resident'}}
 */
export function decodeSAID(id, pivotYear = 25) {
  const s = String(id).trim();
  const yy = Number(s.slice(0, 2));
  const century = yy > pivotYear ? 1900 : 2000;
  const year = century + yy;
  const mm = s.slice(2, 4);
  const dd = s.slice(4, 6);
  const seq = Number(s.slice(6, 10));
  return {
    dobISO: `${year}-${mm}-${dd}`,
    gender: seq >= 5000 ? 'male' : 'female',
    citizen: s[10] === '0' ? 'sa' : 'permanent-resident',
  };
}

/**
 * Mask all but the last four characters: "•••••••••4083".
 * This is the default display; a full reveal requires an audited unmask.
 * Generic — packs for other countries reuse it as `maskLastFour`.
 */
export function maskLastFour(id, dot = '•') {
  const s = String(id || '').trim();
  if (s.length <= 4) return s;
  return dot.repeat(s.length - 4) + s.slice(-4);
}

/** SA alias — the SA ID masking rule is just last-four. */
export const maskSAID = maskLastFour;
