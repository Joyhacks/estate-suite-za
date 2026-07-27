// Landing — the entry screen at #/. A stranger picks a role before the app
// opens, so they always have context for what they are looking at. Each card
// says in one line what that role can and cannot see. Picking a card enters
// the app in that role; the topbar switcher then lets them jump around.

import { el } from '../ui/el.js';

const CARDS = [
  {
    role: 'manager',
    title: 'Estate manager',
    line: 'Runs the whole estate. Sees every unit, lease, tenant and all the money, and can collect rent, approve tenants and draw leases.',
  },
  {
    role: 'owner',
    title: 'Lodge owner',
    line: 'Sees only their own units and payout. Not other owners’ units, and not tenants’ ID numbers.',
  },
  {
    role: 'tenant',
    title: 'Tenant',
    line: 'Sees only their own lease, rent and deposit. Nothing about other tenants or the estate’s finances.',
  },
];

/**
 * Build the landing content. `onPick(role)` is called when a card is chosen.
 */
export function landingView(onPick) {
  const cards = CARDS.map((c) => el('button', {
    class: 'lcard', type: 'button', onClick: () => onPick(c.role),
  },
    el('span', { class: 'lcard__title' }, c.title),
    el('span', { class: 'lcard__line' }, c.line),
    el('span', { class: 'lcard__go' }, 'Enter as ' + c.title.toLowerCase() + ' →')));

  return el('div', { class: 'landing' },
    el('div', { class: 'landing__inner' },
      el('div', { class: 'landing__brand' },
        el('span', { class: 'brand__mark', 'aria-hidden': 'true' }, 'ES'),
        el('span', { class: 'brand__name' }, 'EstateSuite', el('span', { class: 'brand__za' }, 'ZA'))),
      el('h1', { class: 'landing__title' }, 'Property management for South African estates'),
      el('p', { class: 'landing__sub' },
        'Choose who you are to explore the demo. What you can see and do changes with the role — the same way it will for your team, your owners and your tenants.'),
      el('div', { class: 'landing__cards' }, ...cards),
      el('p', { class: 'landing__foot' },
        'A fictional estate with fictional people. Nothing here is real, and anything you change resets when you refresh.')));
}
