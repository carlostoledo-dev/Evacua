# Contributing

Thanks for helping. Evacua is a **safety tool**: a wrong map or route can hurt someone, so the
rules below matter more than speed.

## Ground rules

1. **Never fabricate safety data.** Evacuation areas, routes, meeting points and walking speeds
   must come from a cited, checked source. Every feature carries `source`, `sourceUrl`,
   `retrievedAt`, `license` and `verified`; the build fails otherwise. Missing official data →
   clearly labeled DEMO data, never silent placeholders. See [DATA_SOURCES.md](DATA_SOURCES.md).
2. **All safety numbers live in [`src/domain/constants.ts`](src/domain/constants.ts)**, each with
   its source (or an explicit `TODO: citar fuente`).
3. **Privacy:** no accounts, analytics, trackers or telemetry; the location is never stored or
   sent. See [PRIVACY.md](PRIVACY.md).
4. **Security:** no third-party scripts, fonts or CDNs at runtime; keep the CSP strict. See
   [SECURITY.md](SECURITY.md).
5. **Accessibility (WCAG 2.2 AA):** touch targets ≥ 48 px, never color alone, keyboard and screen
   reader friendly, honor reduced motion.
6. **Text:** all UI text goes through `src/i18n/dictionaries/es-CL.ts` and `en.ts` (identical
   keys). Code, comments and commits in English.
7. **Licenses:** only dependencies under licenses compatible with the project (MIT, ISC, BSD,
   Apache-2.0, OFL for fonts). Data keeps its own license.

## Set up

Requires Node.js 24+ (see `.nvmrc`).

```bash
npm install
npx playwright install chromium   # once, for the end-to-end tests
npm run dev                       # http://localhost:5173 (no service worker, no CSP)
```

## Before you open a pull request

```bash
npm run check      # format, lint (0 warnings), typecheck, unit tests, build (validates data)
npm run test:e2e   # Playwright on the production build with the real security headers
```

CI runs the same steps plus coverage thresholds for `src/domain/` and `npm audit`.

## Where things go

| You want to…                  | Look at                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| Change how routes are planned | `src/domain/routing.ts` (pure, tested) — read ARCHITECTURE.md "How a route is planned" first |
| Change turn-by-turn wording   | `src/domain/navigation.ts`, `src/ui/navigationText.ts`, the dictionaries                     |
| Change a profile preset       | `src/domain/profiles.ts` (typed config, no `if (profile === …)` in the UI)                   |
| Change the map's look         | `src/ui/map/style.ts` (palettes and layers) and `src/ui/styles/global.css`                   |
| Validate a new kind of data   | `src/data/schema.ts` (zod)                                                                   |

Layering is enforced by ESLint: `src/domain` cannot import React, UI, platform or i18n code.

## Adding another commune

Adding a commune is adding data, not code:

1. Create `public/data/communes/<id>/manifest.json` (service area, data bounds, sources, layers)
   and list it in `public/data/communes/index.json`.
2. `npm run data:import` — official SENAPRED tsunami layers for the commune's bounds.
3. `npm run data:tiles`, `npm run data:graph`, `npm run data:terrain` — offline map, walking
   network and relief. Each script records its source, license and date in the manifest.
4. `npm run data:validate`, then check the map and a few routes by hand. Commit the generated
   files (CI never downloads data).

Details and the regeneration commands for every dataset: [DATA_SOURCES.md](DATA_SOURCES.md).

## Commits

Small conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`, `refactor:`,
`perf:`. If AI tools helped substantially, add a line to [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## License

By contributing you agree that your code is licensed under the project's
[PolyForm Noncommercial 1.0.0](LICENSE) license.
