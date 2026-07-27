// document — the signature specimen renderer. Builds a paper "sheet" in the
// serif document face and composes it on screen: elements marked `.compose`
// land in sequence, and the SPECIMEN stamp sets last. This is the one place in
// the app where visual boldness is spent (see CLAUDE.md). Reduced motion is
// respected — the sheet appears fully assembled with no animation.
//
// Document BODIES are layout specimens only. Never place enforceable clause
// text here (CLAUDE.md standing rule 2).

import { el } from './el.js';

/** A value that "lands" during compose (highlighted briefly). */
export function docValue(text) {
  return el('span', { class: 'doc-v compose compose--value' }, text ?? '—');
}

/** A block (heading, paragraph, row) that fades in during compose. */
export function docLine(className, ...children) {
  return el('div', { class: `${className} compose` }, ...children);
}

/** Wrap the sheet. Adds the diagonal SPECIMEN stamp as the last compose item. */
export function sheet(children, { stamp = 'SPECIMEN' } = {}) {
  const paper = el('article', { class: 'doc-sheet', role: 'document' }, ...children);
  paper.append(el('div', { class: 'doc-stamp compose', 'aria-hidden': 'true' }, stamp));
  return paper;
}

/**
 * Play the compose animation over a sheet already in (or about to be in) the
 * DOM. Returns a cancel function.
 */
export function playCompose(root, { step = 42, onDone } = {}) {
  const reduce = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...root.querySelectorAll('.compose')];
  const timers = [];

  if (reduce) {
    items.forEach((i) => i.classList.add('is-in'));
    root.classList.add('is-composed');
    onDone?.();
    return () => {};
  }

  items.forEach((it, i) => {
    timers.push(setTimeout(() => it.classList.add('is-in'), 40 + i * step));
  });
  const total = 40 + items.length * step + 420;
  timers.push(setTimeout(() => { root.classList.add('is-composed'); onDone?.(); }, total));

  return () => timers.forEach(clearTimeout);
}
