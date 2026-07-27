// National-ID rules per pack. Only `za` performs real check-digit validation —
// a wrong validator is worse than none, so every other country ACCEPTS and
// masks the local format without asserting validity (CLAUDE.md rule).

import { validateSAID, maskLastFour } from '../domain/said.js';

/** South Africa: real 13-digit check-digit validation. */
export const zaId = {
  present: true,
  label: 'ID number',
  validate: (v) => validateSAID(v),
  mask: (v) => maskLastFour(v),
};

/** No national ID collected at all (e.g. United Kingdom). */
export const noId = {
  present: false,
  label: null,
  validate: () => ({ valid: true }),
  mask: () => '',
};

/** Accept and mask a local ID format without asserting it is valid. */
export function acceptId(label) {
  return {
    present: true,
    label,
    validate: () => ({ valid: true, unverified: true }),
    mask: (v) => maskLastFour(v),
  };
}
