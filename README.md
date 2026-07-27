# EstateSuite ZA

Front-end property management system for South African estates, lodges and
rental portfolios. A demo shown to prospects and a reusable template. No
backend — all state lives in memory and resets on refresh.

See [CLAUDE.md](./CLAUDE.md) for scope, standing rules and the design system.

## Run

```
npx serve .
```

Then open the printed URL. Requires no build step and no npm dependencies —
it is plain HTML, CSS and ES modules, served as static files.

Fonts (Instrument Sans, Source Serif 4) load from the Google Fonts CDN; the app
falls back to a system stack offline.

## Domain tests

Open `tests/runner.html` through the same static server. It reports pass/fail
for the pure functions in `src/domain/`. A green run means the SA business
logic — money, dates, SA ID, VAT, deposit interest, commission, rent,
utilities — is behaving.

## Status

Built: shell (routing, role-based nav, modal, toast, mobile drawer) and the
domain layer with tests. Screens (dashboard, properties, tenants, leases, …)
follow the build order in CLAUDE.md.
