// Audit trail — records privileged actions such as unmasking an SA ID.
// A factory returning an in-memory log; the app wires one instance into the
// store. Pure of DOM; time is injected so it stays testable.

/**
 * @typedef {Object} AuditEntry
 * @property {string} action   - e.g. 'said.unmask'
 * @property {string} actorId  - who performed it
 * @property {string} subject  - what was acted on (e.g. tenant id)
 * @property {string} at       - ISO timestamp
 * @property {Object} [meta]
 */

export function createAuditLog(initial = []) {
  const entries = [...initial];
  return {
    /** Record an action. `at` should be an ISO string supplied by the caller. */
    record(action, { actorId, subject, at, meta } = {}) {
      const entry = { action, actorId, subject, at, meta };
      entries.push(entry);
      return entry;
    },
    /** All entries, newest last. */
    all() {
      return entries.slice();
    },
    /** Filter by action prefix, e.g. 'said.' */
    byAction(prefix) {
      return entries.filter((e) => e.action.startsWith(prefix));
    },
    /** Entries touching a given subject. */
    forSubject(subject) {
      return entries.filter((e) => e.subject === subject);
    },
    get size() {
      return entries.length;
    },
  };
}
