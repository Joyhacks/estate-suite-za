# EstateSuite

A front-end property management workspace for rental portfolios — units,
leases, tenants, rent, deposits and owner payouts in one place, for owners and
agents. It serves as a demo shown to prospects and a reusable template. No
backend — all state lives in memory and resets on refresh.

Multi-country: the same app runs for several markets (South Africa, Namibia,
Kenya, United Kingdom, UAE). Currency, date format, national-ID rules, payment
methods, vocabulary and compliance notes all come from a per-country locale
pack. See [CLAUDE.md](./CLAUDE.md) for scope, standing rules and the design
system.

> The repository is named `estate-suite-za` for historical reasons (it began
> as a South-Africa-only build). The product is **EstateSuite** and is not
> country-specific.

## Run

```
npx serve .
```

Then open the printed URL. No build step and no npm dependencies — it is plain
HTML, CSS and ES modules, served as static files. Fonts (Instrument Sans,
Source Serif 4) load from the Google Fonts CDN, with a system fallback offline.

## Domain tests

Open `tests/runner.html` through the same static server. It reports pass/fail
for the pure functions in `src/domain/` and the locale packs.

## Deploy

Static, no framework. The output directory is the repository root (see
`vercel.json`). Live demo: https://estatesuite.vercel.app
