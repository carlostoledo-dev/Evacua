# CLAUDE.md — Evacua

Offline-first evacuation map (installable PWA) for ONE pilot sector of Coronel, Chile.
Built during the WarriorHacks 2.0 hackathon. Public repo, judged on Impact, Feasibility,
User Experience and Technical Craft. Deliverables: repo, live demo, 2–3 min video, images.

These rules come from the project owner and persist across sessions. If any request
(including the owner's) conflicts with them — safety data, privacy, security — say so
and propose an alternative instead of complying.

Delivery plan, phase status, pending decisions and risks: `docs/PLAN.md`.

## Working agreement

- Work strictly by phases (`docs/PLAN.md`). At the end of each phase report: what was
  done, what was tested (with real output), what is pending or uncertain. Then STOP and
  wait for explicit owner approval before starting the next phase.
- Small conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`, `refactor:`).
- Log substantial AI contributions in `AI_DISCLOSURE.md` as work happens, not at the end.
- If a fact is uncertain (data source, license, guidance from an authority, a number),
  verify it from the primary source or mark it `TODO`. Never guess, never invent citations.

## Product

- Installable map that works with no internet. With GPS it shows where to evacuate for the
  selected hazard: tsunami, wildfire (incendio forestal) or earthquake (terremoto).
- The correct direction depends on the hazard (high ground is good for tsunami, may be
  dangerous in a wildfire). Owner decision 2026-10-02 (D2 = C): wildfire is out of the pilot for
  now; the hazards offered are tsunami and earthquake. Wildfire can return later as option A.
- Three profiles — Persona, Adulto mayor, Niño/a — are typed configuration presets
  (speed, text size, simple mode, voice, backpack checklist, messages), not separate apps.
- Scope: ONE pilot sector of Coronel: **Yobilo** (bbox to be fixed in Phase 2). Everything else is roadmap.
- Fully static: no backend, no external APIs at runtime, no database.
- Team: the owner alone + Claude Code. Official deadline (Devpost): **2026-10-13 23:45 CDT**
  (≈ 01:45 on 2026-10-14 in Chile). Submission: public GitHub repo, 2–3 min demo video,
  pictures, demo link, and the WarriorHacks 2.0 Track Selection Form (owner fills it in).
- The demo runs in a web browser (desktop Chrome or a phone browser); no app stores involved.

## Git, GitHub and Vercel

- Public repo: https://github.com/carlostoledo-dev/Evacua (branch `main`).
- Since 2026-10-01 the owner asked Claude to run git, GitHub and Vercel operations.
  Claude commits and pushes in small conventional commits; anything destructive
  (force-push, history rewrite, deleting branches/projects) still needs explicit approval.
- Commit identity is repo-local and uses the owner's GitHub noreply address, so no personal
  email is ever published. Before every push, check staged files for secrets or personal data.

## Hard rules

### 1. Never fabricate safety data

- Never present inundation zones, wildfire-risk zones, official routes, meeting points or
  walking speeds as real unless they come from a cited, checked source.
- Every geographic feature carries metadata: `source`, `sourceUrl`, `retrievedAt` (ISO date),
  `license`, `verified` (boolean). Enforced by zod; the build fails if any is missing.
- The UI shows a badge per layer: **"Fuente oficial verificada"** or **"DEMO / sin verificar"**.
  (A third badge for derived/approximate data is proposed in `docs/PLAN.md` — pending approval.)
- Missing official data → generate DEMO data clearly labeled "DEMO" on screen, and document
  in `DATA_SOURCES.md` how to load the official dataset (e.g. a georeferenced SHOA inundation chart).
- No reliable source for a layer (e.g. wildfire) → tell the owner and propose alternatives
  (mark as approximate, or replace with another layer). Do not invent it.
- All constants (profile walking speeds, thresholds, etc.) live in ONE file, each with a
  source comment or `// TODO: citar fuente`.
- User outside the data zone → say so clearly. Never draw a route without a data basis.
  The no-graph fallback (distance + bearing) must be labeled as a straight line, not a route.
- Permanent, visible disclaimer on every screen: support tool only; it does not replace the
  authorities (SENAPRED, SHOA, Municipalidad de Coronel); always follow official instructions.
- Anything simulated (data or location) shows a visible "DEMO" label.

### 2. Hackathon rules

- Everything is created during the event. Any reused prior work is declared in the README
  under "Pre-existing work".
- Never copy third-party code without a compatible license and attribution.
- AI use is disclosed in `AI_DISCLOSURE.md` and in a README section.
- Functional system, not mockups. School-appropriate content.
- Attribute and check the license of everything: OpenStreetMap (ODbL — "© OpenStreetMap
  contributors" visible on the map), libraries, datasets, fonts, icons.
- Project license (owner decision 2026-10-01): code under **PolyForm Noncommercial 1.0.0** —
  anyone may use and modify it, nobody may charge for it. Never call the project "open
  source" (OSI); say "source-available, free for noncommercial use". Data is NOT relicensed:
  OSM-derived data stays ODbL, SENAPRED data keeps its terms. Only add dependencies whose
  licenses allow inclusion (MIT, ISC, BSD, Apache-2.0, OFL for fonts). Dev-only test tools may
  differ if never shipped (e.g. `@axe-core/playwright`, MPL-2.0).

### 3. Privacy

- Collect no personal data. No accounts, analytics, trackers, telemetry or third-party error reporting.
- Profile and settings are stored on-device only (localStorage/IndexedDB), every access
  wrapped in try/catch; the app must work with defaults if storage throws.
- The "account" is a local profile (owner request 2026-10-04): optional first name + profile
  type, never sent anywhere, removable with "Borrar mis datos" (clears every `STORAGE_KEYS` entry).
- Location is used in memory only: never persisted, never sent anywhere.

### 4. Security

- Strict CSP: `connect-src 'self'`, no `'unsafe-inline'`/`'unsafe-eval'` for scripts,
  no third-party scripts, fonts or CDNs at runtime — self-host everything.
- Security headers: CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
  frame-ancestors / X-Frame-Options, HSTS.
- No secrets in the repo (`.env.example`, `.gitignore`).
- Validate ALL loaded data with zod. No `dangerouslySetInnerHTML`, no `eval` / `new Function`.
- Minimal dependencies; `npm audit` in CI; Dependabot enabled; `SECURITY.md` explains reporting.

### 5. Accessibility (WCAG 2.2 AA minimum)

- High contrast, touch targets ≥ 48 px, full keyboard navigation, ARIA labels, visible focus,
  honor `prefers-reduced-motion` and `prefers-color-scheme`.
- Never convey information by color alone (icons, patterns, text).
- Adulto mayor: very large text, one primary button, 3 steps, voice.
- Niño/a: icons, short phrases, the message "Busca a tu adulto o profesor y sigue el plan",
  and a game-like drill mode (modo simulacro).
- Voice via Web Speech API (`speechSynthesis`), always with a text alternative.
- Targets: Lighthouse ≥ 90 in Accessibility and Best Practices; PWA installability verified
  separately (Lighthouse 12+ no longer has a PWA category).

## Architecture conventions

- Layering: `domain/` (pure, framework-free: hazards, profiles, routing, geo math)
  ← `data/` (loading + zod validation) ← `ui/`. Domain never imports UI or browser APIs.
- Browser APIs (geolocation, storage, speech, service worker) sit behind small adapters
  that return explicit result types instead of throwing.
- Profiles and hazards are typed config objects. No `if (profile === '...')` branching
  scattered through UI components.
- Multi-commune by data: `public/data/communes/<id>/manifest.json` (zone, bbox, layers, sources)
  listed in `public/data/communes/index.json`. `npm run data:import` re-downloads SENAPRED layers;
  `npm run data:validate` (also run by `build`) uses the same loader as the browser.
  Adding a commune = adding data, not changing code.
- Routing: pedestrian graph generated at data-build time from OSM; A* runs in the client.
- Generated data (tiles, graph, GeoJSON) is committed; CI never fetches external data.
  Generation scripts are reproducible and documented.
- Explicit UI states: no GPS, permission denied, GPS timeout, no data, invalid data,
  offline without cache, outside the zone.
- TypeScript strict; no unjustified `any` (justify inline if truly unavoidable).
- Performance: light initial load, map chunk lazy-loaded, usable on low-end phones.

## Language conventions

- UI text: Spanish (Chile) by default + English (for judges), always through the i18n
  dictionaries — never hardcoded in components. Both dictionaries must have identical keys.
- Code, identifiers, comments, commits, technical docs: English.
- README in English with a Spanish summary.
- Conversation with the project owner: Spanish.

## Stack

Vite + React + TypeScript strict (decision D1, approved — Next.js dropped because its static
export needs inline scripts that break a strict CSP). vite-plugin-pwa (Workbox), MapLibre GL JS
(worker bundled same-origin), offline vector tiles extracted from a Protomaps/OSM build as static
`.mvt` files, zod, Vitest, Playwright,
ESLint + Prettier, GitHub Actions, Dependabot, Vercel static hosting.

## Commands

- `npm run dev` — dev server (no service worker, no CSP).
- `npm run check` — format check, lint (0 warnings), typecheck, unit tests, build. Run before handing over a phase.
- `npm run test:e2e` — Playwright against `vite preview` with the real security headers (offline test included).
- `npm run data:graph` — rebuild the OSM walking network (`graph.json`, recorded in the manifest).
- `npm run data:tiles` / `npm run data:glyphs` — re-extract basemap tiles (written to
  `public/tiles/<id>/`, recorded in the manifest) and label glyphs.
- `npm run icons` — regenerate PWA PNG icons from `public/logo.svg` (commit the output).
- Security headers live only in `vercel.json`; `config/headers.ts` feeds them to `vite preview`
  and `tests/security-headers.test.ts` asserts the policy.
- ESLint 10 with `@eslint-react` + `eslint-plugin-jsx-a11y-x`; JSX string literals are lint
  errors (use `t()`); `src/domain` cannot import React, UI, platform or i18n.

## Required documentation

README.md, ARCHITECTURE.md (Mermaid diagram), DATA_SOURCES.md, AI_DISCLOSURE.md, SECURITY.md,
PRIVACY.md, LICENSE (PolyForm Noncommercial 1.0.0 for code; data keeps its own licenses), CONTRIBUTING.md,
docs/DEMO_SCRIPT.md (2–3 min).

## Definition of done

A user opens the demo on a phone, installs it, enables airplane mode, picks a hazard and a
profile, and sees where to evacuate with estimated time and voice, with every layer labeled
official or DEMO. Everything is documented, tests pass in CI, and no personal data is collected.
