# EstateSuite ZA

A front-end property management system for South African estates, lodges and
rental portfolios. It serves two purposes at once:

1. A **demo** shown to prospects to win work.
2. A reusable **template** so a paid client build starts at ~60% done.

## Standing rules — assume this repo is public

These three are absolute and apply to code, comments, commit messages, seed
data and docs alike:

1. **No client data ever enters this repo.** No real tenant, owner, lease, ID
   number, bank detail or estate name — not in code, not in a comment, not in a
   commit message. Everything is invented. Assume the repo is public.
2. **Never write legal clause text presented as enforceable.** Lease and FICA
   bodies are layout specimens, marked `SPECIMEN` in the source. Live
   deployments render the client's own attorney-drafted template.
3. **No backend, ever, in this repo.** Paid client work happens in a separate
   private repo that copies components out of this one.

Every module ships **seeded with enough fictional data to look like a working
estate on first load.** An empty Payments table or an empty Maintenance board
makes the demo look unfinished — and unfinished loses the deal.

## Other constraints

- No Supabase, no auth library, no API calls, no keys.
- All state lives in memory and **resets on refresh**.
- Every action that would hit a database instead mutates a seed object and
  re-renders, so the app feels alive when clicked.
- Where a real integration would go, stub the function and leave a
  `TODO(live)` comment naming exactly what it would call.

## Architecture

Plain HTML, CSS and ES modules. **No React, no build step, no bundler, no npm
dependencies.** Runs with `npx serve .` and deploys as static files.

```
/index.html                  entry point, imports src/app.js as a module
/src/app.js                  router + shell bootstrap
/src/ui/                     framework-free view primitives (see below)
/src/modules/                one file per screen
/src/domain/                 business logic — pure, DOM-free, unit-tested
/src/locale/                 country packs (one file per country) + active pack
/src/data/                   roles + in-memory store
/src/styles/                 tokens.css + app.css
/tests/                      domain + locale unit tests (plain HTML runner)
```

`/src/domain/` is the real asset. Pure functions, no DOM, written first and
tested first: money formatting, date formatting, SA ID validation and masking,
deposit interest accrual, VAT, commission calculation, prorated rent,
municipal utility recovery.

## Locale packs (multi-country)

The app is not South-Africa-only. `/src/locale/` holds one pack per country.
A pack defines: currency and its formatting, date order, national-ID format
plus masking rule, payment methods, tenancy vocabulary (unit vs flat vs
apartment, levy vs service charge, etc.), and short compliance notes rendered
on screen. Each pack also supplies its own seed data via the shared
`seedShape.js` skeleton (same relational story, localised flavour).

**Nothing outside a pack hardcodes a currency symbol, a date format, an ID
rule or a legal reference.** The domain layer reads all of these from the
**active pack** (`src/locale/active.js`): `money.js`, `dates.js` and the ID
mask/validate rules resolve against whichever country is selected. The old SA
logic is now the `za` pack — the default, not a hardcoded default.

Packs shipped: `za` South Africa (reference, full depth), `na` Namibia,
`ke` Kenya, `gb` United Kingdom, `ae` UAE.

Hard rules for packs:
- **Only `za` states specific facts** (deposit interest accrues to the tenant;
  the ID encodes a date of birth; VAT 15%), because it is the only jurisdiction
  verified. It still cites no act or section number. Every other pack uses
  neutral, descriptive, configurable text — no invented law.
- **Only `za` validates its ID** with a real check digit. Every other pack
  accepts and masks the local format without asserting validity. A wrong
  validator is worse than none.
- Country and role live in the URL hash (`#/<country>/<role>/<route>`) so any
  view is shareable. Switching country in the topbar re-seeds the demo.

## Roles

Super admin, property manager, owner, tenant, contractor. Switching role
changes the **nav** and the **data**. A role that should not see a field
**does not get it rendered at all** — not hidden with CSS. This structural
enforcement is the security story we demo to buyers, so it must be true in the
code, not cosmetic.

## Design system (authoritative)

Do **not** use: Inter, teal `#0F766E`, 12px radius, soft shadows, shadcn,
Tailwind. Two font families only; a third font is a bug.

**Palette**
| Token | Value | Use |
|---|---|---|
| `--chrome` | `#15271D` | dark estate-green sidebar + topbar |
| `--chrome-2` | `#1D3327` | raised chrome (active nav, headers) |
| `--chrome-line` | `#2C4636` | hairlines on chrome |
| `--paper` | `#FAF9F6` | working surface (cool neutral, faint green-grey — **not** warm cream) |
| `--paper-inset` | `#F1EFE9` | insets: table stripes, wells, sunken panels |
| `--ink` | `#1B1B17` | primary text on paper |
| `--ink-2` | `#5A594F` | secondary text |
| `--line` | `#E1DED6` | hairline rules on paper |
| `--brass` | `#A67C3D` | the single accent, used sparingly |
| `--brass-ink` | `#6E5124` | brass text on paper |
| `--ok` `--warn` `--over` | muted green / amber / rust | status only, never decoration |

**Type** — Instrument Sans (interface), Source Serif 4 (anything representing a
document). Loaded from the **Google Fonts CDN** in `index.html` (no font files
in this repo — we cannot fetch or vendor them). `tokens.css` defines a system
fallback stack so the app still reads correctly offline:
`--font-ui: 'Instrument Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;`
`--font-doc: 'Source Serif 4', Georgia, 'Times New Roman', serif;`
Two families, nothing else.

**Quality bar** — dense, information-first. Hairline rules instead of shadows.
Sharp or near-sharp corners (`--radius: 2px`). Real tables that stay tables and
never collapse into cards. Working software four years in production, not a
launch page. No emoji, no icon rows, no gradient stat cards, no three-column
feature grids, no glassmorphism.

**Signature element** — visual boldness is spent in exactly one place: the
moment a document (lease, invoice, statement, FICA pack) assembles itself on
screen in Source Serif 4. Everything else stays quiet.

## South African rules

- Money as `R14 500,00` (space thousands, comma decimal).
- Dates as `1 August 2026` in documents, `01/08/2026` in tables.
- VAT 15%.
- SA ID is 13 digits and encodes a date of birth → mask to last four by
  default; **unmasking is an audited action**.
- Payment methods: EFT, debit order, Ozow, PayFast, Peach.
- Deposits sit in an interest-bearing account; interest accrues to the tenant.
- Vocabulary: unit, erf, levy, body corporate, occupation date, ingoing and
  outgoing inspection, property practitioner.
- Lease and FICA document bodies are **layout specimens only**, marked
  `SPECIMEN` in source. Never write clause text presented as enforceable.

## Definition of done (every screen)

Works at 360px. Visible keyboard focus. Reduced motion respected. No role sees
a field it should not. Money and dates follow the conventions above.

## Build order

1. Shell — grouped sidebar nav, topbar, role switcher, router, modal, toast,
   mobile drawer under 900px.
2. Domain layer + tests.
3. Dashboard — KPI row, outstanding rent with overdue flagging, account
   approvals queue, recent payments, leases expiring.
4. Properties — portfolio, units, amenities, documents.
5. Tenants — applications, active tenants, FICA documents.
6. Leases — list, detail, lease document generator.
7. Owners + owner payouts.
8. Finance — rent collection, deposits, invoices, statements, expenses.
   Invoice and statement render as real documents.
9. Maintenance — kanban across Reported, Assigned, In progress, Waiting parts,
   Completed. Drag or click to move.
10. Utilities — electricity, water, municipal bills, meter readings.
11. Calendar — per-unit booking bars, month navigation.
12. Directory — contractors and services, tap-to-call.
13. Reports — rental roll, vacancy, deposit register, tenant ledger. Render on
    screen, print to PDF.
14. Notifications + settings.

## src/ui primitives

`table`, `modal`, `toast`, `tabs`, `kanban`, `stat`, form controls, and the
`document` renderer (the signature specimen renderer).
