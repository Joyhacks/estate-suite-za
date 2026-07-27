// modal — one accessible dialog, reused. Focus trap, Escape to close, restores
// focus to the trigger, click-outside to dismiss.

import { el, clear, append } from './el.js';

let overlay, dialog, lastFocus, onCloseCb;

function ensure() {
  if (overlay) return;
  dialog = el('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', tabindex: '-1',
  });
  overlay = el('div', { class: 'modal-overlay', hidden: true }, dialog);
  document.body.append(overlay);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'Tab') trapTab(e);
  });
}

/**
 * @param {{title?: string, body?: Node|string, actions?: Array<{label:string,
 *   variant?: 'primary'|'ghost'|'danger', onClick?: (close:()=>void)=>void}>,
 *   onClose?: () => void}} opts
 */
export function openModal(opts = {}) {
  ensure();
  const { title = '', body, actions = [], onClose } = opts;
  onCloseCb = onClose;
  lastFocus = document.activeElement;
  clear(dialog);

  const head = el('div', { class: 'modal__head' },
    el('h2', { class: 'modal__title', id: 'modal-title', text: title }),
    el('button', { class: 'modal__x', 'aria-label': 'Close', onClick: closeModal }, '✕'));
  dialog.setAttribute('aria-labelledby', 'modal-title');

  const content = el('div', { class: 'modal__body' });
  if (typeof body === 'string') content.innerHTML = body;
  else if (body) append(content, [body]);

  dialog.append(head, content);
  if (actions.length) {
    const foot = el('div', { class: 'modal__foot' },
      ...actions.map((a) => el('button', {
        class: `btn ${a.variant ? 'btn--' + a.variant : ''}`,
        onClick: () => a.onClick?.(closeModal),
      }, a.label)));
    dialog.append(foot);
  }

  overlay.hidden = false;
  document.body.classList.add('has-modal');
  dialog.focus();
}

export function closeModal() {
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  document.body.classList.remove('has-modal');
  const cb = onCloseCb; onCloseCb = null;
  cb?.();
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function trapTab(e) {
  const focusable = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
}
