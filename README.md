# EstateSuite

A front-end property management workspace for rental portfolios: units, leases, tenants, rent, deposits and owner payouts in one place. It runs entirely in the browser with seeded demo data, so there's no backend and state resets on refresh.

Live demo: https://estate-suite-za.vercel.app

The repo is called `estate-suite-za` because it started as a South Africa build. The product is now country-neutral.

## What's built

- Dashboard: KPI row, outstanding rent with overdue flags, account approvals, recent payments, leases expiring soon.
- Properties: portfolio, units, amenities and documents.
- Leases: list, detail and a lease document generator that renders the document on screen.

Routes that aren't built yet are left out of the navigation instead of showing an empty page.

## Countries

The same app runs for South Africa, Namibia, Kenya, the United Kingdom and the UAE. Each market is a locale pack in `src/locale/` that sets the currency format, date order, national ID format and masking, payment methods, tenancy vocabulary (levy vs service charge, unit vs flat) and its own seed data.

Nothing outside a pack hardcodes a currency symbol, date format or ID rule. The domain functions read them from the active pack.

Only the South Africa pack states specific facts (15% VAT, deposit interest accruing to the tenant) and validates its ID number with a real check digit, because that's the only jurisdiction I verified. The other packs mask the local ID format without claiming to validate it, and keep their compliance notes descriptive. Lease and FICA bodies are layout specimens, marked `SPECIMEN` in the source, not legal text.

## Roles

Super admin, property manager, owner, tenant and contractor. Switching role changes both the navigation and the data. A field a role shouldn't see is never rendered, rather than hidden with CSS.

Country and role live in the URL hash (`#/<country>/<role>/<route>`), so any view can be shared as a link.

## Run it

```bash
npx serve .
```

Plain HTML, CSS and ES modules. No build step and no npm dependencies. Fonts load from Google Fonts with a system fallback offline.

## Tests

Open `tests/runner.html` through the same server. It runs 25 tests against the pure functions in `src/domain/` (money and date formatting, SA ID validation and masking, deposit interest, VAT, commission, prorated rent, utility recovery) and the locale packs.

## Layout

```
index.html        entry point
src/app.js        router and shell bootstrap
src/domain/       business logic, pure and DOM-free
src/locale/       one pack per country, plus the active-pack resolver
src/modules/      one file per screen
src/ui/           table, modal, toast, stat and the document renderer
src/data/         roles and the in-memory store
src/styles/       tokens.css and app.css
tests/            browser test runner
```

## Deploy

Static files from the repo root. See `vercel.json`.
