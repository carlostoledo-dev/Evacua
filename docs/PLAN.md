# Delivery plan — Coronel Segura

Each phase ends with a report (done / tested / pending or uncertain) and waits for
explicit owner approval before the next one starts.

| Phase                                           | Status                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| 0. Questions, plan, CLAUDE.md                   | Done — answered 2026-10-01                            |
| 1. Skeleton, CI, PWA, i18n                      | Built, CI green — awaiting Vercel import and approval |
| 2. Data layer: schema + labeled DEMO data       | Not started                                           |
| 3. Offline map + hazard layers and selector     | Not started                                           |
| 4. Evacuation guidance: safe point, route, time | Not started                                           |
| 5. Profiles + accessibility                     | Not started                                           |
| 6. Security, tests, Lighthouse                  | Not started                                           |
| 7. Docs, screenshots, demo script               | Not started                                           |

---

## Phase 1 — Skeleton, CI, PWA, i18n

**Build**

- Project scaffold per decision D1, TypeScript strict, ESLint (typescript-eslint strict) + Prettier.
- Folder layering: `src/domain`, `src/data`, `src/ui`, `src/platform` (browser adapters).
- i18n dictionary `es-CL` (+ `en` if approved, Q6) with typed keys.
- Service worker (Workbox) + web manifest + icons; "Listo para usar sin conexión" indicator
  shown only after precache completes.
- Permanent disclaimer component (SENAPRED / SHOA / Municipalidad).
- `vercel.json` with security headers and strict CSP.
- GitHub Actions: lint, typecheck, unit tests, build, `npm audit --audit-level=high`, Playwright smoke.
- Dependabot, `.gitignore`, `.env.example`, LICENSE, `AI_DISCLOSURE.md` started.
- First deploy to Vercel to de-risk install on a real phone early.

**Acceptance criteria**

- [x] `lint`, `typecheck`, `test`, `build` pass locally and in GitHub Actions (run 36918458245, both jobs green).
- [ ] Deployed URL is installable (manifest + SW detected). Pending: the owner imports the repo in Vercel (the Vercel connector got 403 on project creation and the GitHub app grant is the owner's).
- [x] Playwright: after first load, going offline and reloading still renders the app shell.
- [x] Playwright: every network request is same-origin; zero CSP violations in console.
- [x] No UI string outside the dictionary (ESLint `no-restricted-syntax` on JSX text and
      text attributes; verified it flags a probe file).
- [x] Disclaimer visible on every screen (sticky footer, not dismissible; e2e checks it online and offline).

**Phase 1 notes (2026-10-01)**

- ESLint 10 (stable since 2026-02) is used; `eslint-plugin-react` / `eslint-plugin-jsx-a11y` do
  not support it yet, so the project uses `@eslint-react/eslint-plugin` and the maintained fork
  `eslint-plugin-jsx-a11y-x` (es-tooling / e18e).
- Coverage is low overall (UI is covered by e2e, there is no domain code yet); the ≥ 80 %
  target applies to `src/domain` from Phase 4 on.
- `src/domain` and `src/data` folders will appear with their first code (Phase 2); the ESLint
  purity rule for `src/domain` is already in place and was verified with a probe file.

## Phase 2 — Data layer

**Build**

- zod schemas: commune manifest, layer FeatureCollections with required per-feature metadata
  (`source`, `sourceUrl`, `retrievedAt`, `license`, `verified`).
- `data/communes/coronel/manifest.json` + layers: tsunami zone / safe zone, meeting points,
  wildfire layer per decision D2. Official data if obtainable; otherwise DEMO, labeled.
- Data loader returning typed results (ok / invalid / missing), never partial silent rendering.
- `scripts/validate-data` run in CI.
- Single constants file (walking speeds per profile etc.), each value sourced or `TODO: citar fuente`.
- `DATA_SOURCES.md` draft, including a step-by-step guide to replace DEMO with official data.

**Acceptance criteria**

- [ ] Build fails if any feature lacks a metadata field (tested with a broken fixture).
- [ ] Invalid data → explicit error state in UI, no crash.
- [ ] A fixture second commune loads with zero code changes.
- [ ] No layer without verification claims to be official, in data or in UI.

## Phase 3 — Offline map and hazard layers

**Build**

- Reproducible script to generate sector PMTiles from OSM (plan: `pmtiles extract` by bbox
  from a Protomaps OSM build — licenses to verify; no Java/Docker needed on this machine).
- Self-hosted glyphs and sprites; MapLibre CSP build (no blob workers needed).
- PMTiles read from the precached file (no HTTP range requests through the service worker).
- Hazard selector (tsunami / incendio / terremoto), layers with patterns + text, not color only.
- Per-layer badge, legend, visible OSM attribution.

**Acceptance criteria**

- [ ] In airplane mode after install, the sector map renders fully (Playwright offline + manual phone test).
- [ ] Switching hazard changes layers; each layer shows its badge.
- [ ] App shell JS ≤ ~150 KB gzip excluding the lazy map chunk; total offline bundle size documented.

## Phase 4 — Evacuation guidance

**Build**

- Data-build script: OSM pedestrian graph for the sector → compact JSON (committed).
- Domain: A* with binary heap and multiple goals; hazard-specific edge cost functions; ETA.
- Geolocation adapter with explicit states; manual "Estoy aquí" (tap on map) when GPS is slow
  or denied; out-of-zone detection.
- "Simular ubicación (DEMO)" with preset points, always labeled DEMO (decision D3).
- Fallback without graph: distance + bearing to nearest safe point, labeled as straight line.
- Route panel: destination, distance, ETA by profile speed, simple steps.

**Acceptance criteria**

- [ ] Unit tests: shortest path, unreachable goal, multi-goal, hazard cost differences, ETA.
- [ ] E2E: the same demo point yields different destinations for tsunami vs. wildfire.
- [ ] Outside zone → clear message, no route drawn.
- [ ] No GPS / denied / timeout → explicit state + manual option.
- [ ] No route is ever drawn when graph or safe points are missing.

## Phase 5 — Profiles and accessibility

**Build**

- Typed `ProfileConfig` presets (Persona, Adulto mayor, Niño/a), persisted locally with try/catch.
- Adulto mayor: very large text, one primary button, 3 steps, voice.
- Niño/a: icons, short phrases, "Busca a tu adulto o profesor y sigue el plan", drill game mode.
- Backpack checklist per profile; voice via `speechSynthesis` with text fallback.
- Reduced motion, light/dark scheme, keyboard navigation, focus management.

**Acceptance criteria**

- [ ] No profile-name branching in UI components (profiles are pure data).
- [ ] axe-core (Playwright): 0 serious/critical violations on main screens × 3 profiles.
- [ ] Touch targets ≥ 48 px; full flow doable keyboard-only.
- [ ] Voice unavailable → text shown, no error. Storage throwing → app works with defaults.

## Phase 6 — Security, tests, Lighthouse

**Build**

- Header + CSP verification against the deployed URL; `npm audit` clean (high).
- Playwright main flow incl. offline; coverage report for `domain/`.
- Lighthouse CI (mobile) + manual installability check.

**Acceptance criteria**

- [ ] Lighthouse Accessibility ≥ 90 and Best Practices ≥ 90 (mobile).
- [ ] Installability verified (DevTools Application panel / Playwright SW + manifest checks).
- [ ] All security headers present on the deployed URL.
- [ ] `domain/` coverage ≥ 80%.

## Phase 7 — Documentation, screenshots, demo script

**Build**

- README (EN + resumen ES), ARCHITECTURE.md (Mermaid), DATA_SOURCES.md final, AI_DISCLOSURE.md,
  SECURITY.md, PRIVACY.md, LICENSE, CONTRIBUTING.md, `docs/DEMO_SCRIPT.md`, screenshots.

**Acceptance criteria**

- [ ] A fresh clone can install, run, test and regenerate data following only the README.
- [ ] Demo script ≤ 3 min covers: install, airplane mode, two hazards at the same spot,
      profile switch, layer badges.
- [ ] Every library, dataset, font and icon is attributed with its license.

---

## Owner answers (2026-10-01)

- Pilot sector: **Yobilo**, Coronel. Solo developer + Claude Code; ~8 days left (≈ 2026-10-09).
- D1 approved (Vite + React). D3 approved (simulated DEMO location). D5 approved.
- D2 (wildfire) deferred: focus on everything else first, revisit later. D4 goes with D2.
- English UI added as second locale (es-CL stays default).
- Demo will be shown in a web browser (no app stores; a PWA is a web app anyway).
- The owner runs git/GitHub/Vercel personally with Claude's step-by-step guidance.
- Search for official data: done, see below.

## Official data findings (2026-10-01)

**SENAPRED — "Amenaza por Tsunami" (2024)**, catalogued in IDE Chile
(https://geoportal.cl/geoportal/catalog/35413/Amenaza%20por%20Tsunami), served as an ArcGIS
FeatureServer (WGS84, JSON query):
`https://services5.arcgis.com/i7S5PSnIJAUcWvSE/ArcGIS/rest/services/Amenaza_por_Tsunami_2024/FeatureServer`

| Layer | Name                                               | Features around Yobilo (envelope -73.18,-37.025 → -73.12,-36.99) |
| ----- | -------------------------------------------------- | ---------------------------------------------------------------- |
| 0     | Punto de Encuentro (points)                        | 10 (codes 08102PE017–PE020, PE026–PE031)                         |
| 1     | Vía de Evacuación (lines)                          | 18                                                               |
| 2     | Línea Segura (lines; attribute `fuente = "CITSU"`) | 3                                                                |
| 3     | Área a Evacuar (polygon)                           | 1 (sector "Coronel")                                             |
| 4     | Cota 30 mts. (lines)                               | 0                                                                |

- License: none declared in the service or its metadata. IDE Chile asks users to cite the
  providing institution. → Record as "No explicit license — cited as SENAPRED per IDE Chile
  guidance" and flag as an open item in DATA_SOURCES.md. Optional: email SENAPRED to confirm.
- The "Línea Segura" comes from SHOA's CITSU per its own `fuente` attribute; a CITSU study
  for Coronel exists (Revista Terra Australis, case study for Coronel).
- Yobilo in OSM (Nominatim): road "Yobilo" from ≈ (-37.0118, -73.1565) to ≈ (-36.9996, -73.1349).
- Text encoding: some attributes come back mis-encoded (e.g. "Biob�o"); normalize in the import script.
- Wildfire: not researched yet (D2 deferred).

## Proposed decisions

### D1 — Vite + React instead of Next.js (APPROVED)

- The app is a fully static single-screen SPA; Next.js features (SSR, RSC, server routes,
  image optimization) are unused, and `output: 'export'` disables several of them anyway.
- Strict CSP: Next.js App Router injects inline executable `<script>` tags into exported HTML.
  Without a server there are no nonces, so `script-src 'self'` breaks unless we add
  `'unsafe-inline'` or a post-build hashing step. Vite emits only external module scripts.
- PWA tooling: `vite-plugin-pwa` (Workbox) is mature; Next.js PWA plugins add friction.
- Smaller initial load for low-end phones; Vitest is native to Vite.
- Recorded as an ADR in ARCHITECTURE.md either way.

### D2 — Wildfire layer (DEFERRED by owner)

A static offline app cannot know where a fire is, the wind, or which roads are cut, so there is
no valid precomputed "official wildfire route". Options:

- **A (recommended):** vegetation/fuel layer derived from OSM (`landuse=forest`, `natural=wood`,
  `natural=scrub`), labeled "Aproximada — derivada de OSM, no es un mapa oficial de riesgo";
  routing penalizes edges near vegetation and goes to meeting points in consolidated urban areas;
  optional user input "¿Hacia dónde ves el humo o fuego?" penalizes that direction.
- **B:** official CONAF/SENAPRED layer, only if a usable, licensed source is found and verified.
- **C:** drop wildfire for the pilot; keep tsunami + earthquake.

Earthquake mode (any option): first "Agáchate, cúbrete, afírmate"; then, inside the tsunami zone,
evacuate to the tsunami safe zone if the quake is strong; otherwise go to an open-space meeting
point. Exact guidance wording to be taken from SENAPRED/SHOA material and cited (TODO).

### D3 — Simulated location for the demo (APPROVED)

Judges will not be in Coronel. A "Simular ubicación (DEMO)" mode with preset points, permanently
labeled DEMO, lets the live demo and video show the real flow. Real GPS remains the default.

### D4 — Layer status model (decided together with D2)

Per feature: `verified: boolean` plus `kind: "official" | "derived" | "demo"`, giving three badges:
"Fuente oficial verificada", "Aproximada (derivada, no oficial)", "DEMO / sin verificar".

### D5 — Lighthouse PWA target (APPROVED)

Lighthouse 12+ removed the PWA category. Replace "PWA ≥ 90" with: installability checks,
Playwright offline tests, and a manifest/service-worker check in CI.

---

## Risks

- Official data may not be obtainable or licensable in time → DEMO data, labeled (still compliant).
- iOS: PWA install is manual (Compartir → Agregar a inicio); possible storage eviction.
- Spanish `speechSynthesis` voice may be missing offline on some devices → text always shown.
- GPS cold start in airplane mode can take a long time → "buscando señal" state + manual position.
- Offline bundle size (tiles + graph + glyphs) on low-end phones → keep bbox small, measure.
- Windows dev machine has no Java/Docker → tile tooling must work with single binaries or Node/Python.

## Dependency notes

- 2026-10-01: Dependabot opened major bumps for `typescript` (6 → 7) and
  `@vite-pwa/assets-generator` (1 → 2). Do not merge TypeScript 7 while `typescript-eslint`
  only supports `<6.1.0`; re-evaluate both after the hackathon.
