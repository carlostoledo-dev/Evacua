# Delivery plan — Evacua

Each phase ends with a report (done / tested / pending or uncertain) and waits for
explicit owner approval before the next one starts.

| Phase                                           | Status                          |
| ----------------------------------------------- | ------------------------------- |
| 0. Questions, plan, CLAUDE.md                   | Done — answered 2026-10-01      |
| 1. Skeleton, CI, PWA, i18n                      | Done — approved 2026-10-01      |
| 2. Data layer: schema + labeled DEMO data       | Done — approved 2026-10-02      |
| 3. Offline map + hazard layers and selector     | Built — awaiting owner approval |
| 4. Evacuation guidance: safe point, route, time | Not started                     |
| 5. Profiles + accessibility                     | Not started                     |
| 6. Security, tests, Lighthouse                  | Not started                     |
| 7. Docs, screenshots, demo script               | Not started                     |

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
- [x] Deployed at https://evacua-phi.vercel.app (owner imported it in Vercel). Verified in production: all security headers, manifest with maskable icon, SW `no-cache`, immutable assets, Playwright offline reload, zero foreign requests, zero console errors.
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
- `public/data/communes/coronel/manifest.json` + layers: tsunami zone / safe zone, meeting points,
  wildfire layer per decision D2. Official data if obtainable; otherwise DEMO, labeled.
- Data loader returning typed results (ok / invalid / missing), never partial silent rendering.
- `scripts/validate-data` run in CI.
- Single constants file (walking speeds per profile etc.), each value sourced or `TODO: citar fuente`.
- `DATA_SOURCES.md` draft, including a step-by-step guide to replace DEMO with official data.

**Acceptance criteria**

- [x] Build fails if any feature lacks a metadata field: `build` runs `data:validate` first;
      verified manually by deleting one feature's `license` (build exited 1 naming the field)
      and by unit tests for each of the five fields.
- [x] Invalid data → explicit error state in UI, no crash (e2e: invalid manifest, failed
      download + retry).
- [x] A fixture second commune loads with zero code changes (unit test `loader.test.ts`).
- [x] No layer without verification claims to be official: features must match their source's
      `verified` flag, license and URL (`consistency.ts`); the UI badge is derived from the data.

**Phase 2 notes (2026-10-01)**

- No DEMO data was needed: all four tsunami layers for Yobilo come from SENAPRED's official
  service and are labeled "Fuente oficial verificada". The wildfire layer stays pending (D2).
- Data lives in `public/data/communes/<id>/` (served same-origin and precached for offline use);
  the registry is `public/data/communes/index.json`.
- Pilot service area `[-73.166, -37.018, -73.132, -36.996]` (defined by Evacua, not official);
  data bounds `[-73.178, -37.026, -73.122, -36.99]`. Total data ≈ 134 KB.
- Walking speeds sourced from FEMA P-646 (3rd ed., p. 5-2): 4 mph average healthy adult,
  2 mph mobility-impaired. Because 4 mph is optimistic, Phase 4 should show time as a range.
- Open item: SENAPRED publishes no explicit license; cited per IDE Chile guidance. Optional
  owner action: ask SENAPRED for written confirmation.
- UX note for Phase 3: the sticky disclaimer takes ~20 % of a phone screen; compact it (still
  always visible) when the map arrives.

## Phase 3 — Offline map and hazard layers

**Build**

- Reproducible script to generate sector PMTiles from OSM (plan: `pmtiles extract` by bbox
  from a Protomaps OSM build — licenses to verify; no Java/Docker needed on this machine).
- Self-hosted glyphs and sprites; MapLibre CSP build (no blob workers needed).
- PMTiles read from the precached file (no HTTP range requests through the service worker).
- Hazard selector (tsunami / incendio / terremoto), layers with patterns + text, not color only.
- Per-layer badge, legend, visible OSM attribution.

**Acceptance criteria**

- [x] Offline after the first visit, the sector map renders fully (Playwright: offline reload,
      map `ready`, zero failed requests). Manual phone test in airplane mode: pending (owner).
- [x] Switching hazard changes guidance and layer visibility; each layer shows its badge in the
      legend (tsunami and earthquake both use the tsunami layers by design).
- [x] App shell JS 104 KB gzip (MapLibre chunk 279 KB gzip, lazy). Offline precache ≈ 3.5 MB
      (87 files: shell, data ≈ 134 KB, tiles ≈ 946 KB, glyphs ≈ 544 KB, MapLibre + worker).

**Phase 3 notes (2026-10-02)**

- Changed from the plan: instead of shipping a PMTiles archive, `scripts/build-tiles.ts` reads the
  Protomaps daily planet build with range requests and writes the 52 tiles covering the data
  bounds (z12–15) as static `.mvt` files. No pmtiles client at runtime, no range requests through
  the service worker; the basemap entry (source, license, date) is stored in the manifest.
- Own high-contrast style (light/dark) instead of the Protomaps style package; labels use
  self-hosted Noto Sans glyphs (OFL). No sprites needed.
- MapLibre 6 worker is bundled and served same-origin (`?worker&url`), so the CSP is unchanged
  (no `blob:`); verified by e2e with zero console errors.
- The evacuation area uses a hatch pattern and the legend repeats each shape, so nothing relies
  on color alone. The map never pans past the data bounds, so the artificial clip edge of the
  evacuation polygon is never shown.
- Earthquake guidance uses SENAPRED's own wording. SENAPRED does **not** use "agáchate, cúbrete
  y afírmate"; it says to go to a "Lugar de Protección Sísmica". The earlier plan text was wrong
  and has been corrected.
- Found and fixed during visual review: MapLibre's CSS made the map container collapse to
  0 px; e2e now asserts the canvas height and visible credits.

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

- Pilot sector: **Yobilo**, Coronel. Solo developer + Claude Code. Official deadline per Devpost: 2026-10-13 23:45 CDT (the owner first estimated ≈ 2026-10-09). The rules say nothing about licensing or IP.
- D1 approved (Vite + React). D3 approved (simulated DEMO location). D5 approved.
- D2 (wildfire) deferred: focus on everything else first, revisit later. D4 goes with D2.
- English UI added as second locale (es-CL stays default).
- Demo will be shown in a web browser (no app stores; a PWA is a web app anyway).
- The owner runs git/GitHub/Vercel personally with Claude's step-by-step guidance.
- Search for official data: done, see below.
- 2026-10-01: the product is renamed **Evacua** (repo `carlostoledo-dev/Evacua`); Coronel /
  Yobilo remain the place names.
- 2026-10-01: license changed from MIT to **PolyForm Noncommercial 1.0.0** — anyone may use and
  modify the code, nobody may charge for it; government, public-safety, educational and charitable
  organizations are explicitly allowed. Data keeps its own licenses (ODbL, SENAPRED terms).

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

## Stretch features (only after the minimum demo works, target 2026-10-06)

Ranked by impact / effort, proposed 2026-10-01:

1. **Big-arrow mode:** a huge arrow toward the safe point using the device compass, with the
   distance below it (no map reading needed). Needs `DeviceOrientation` and a Permissions-Policy update.
2. **Printable plan + QR:** one printable page with the route map, meeting point and backpack
   checklist; schools can post a QR that opens Evacua at that public location.
3. Family reunion point stored only on the device.
4. Timed drill ("¿Llegas a tiempo?") for all profiles.
5. Demo on a low-end Android phone.

Owner-side levers (cannot be done by code): test with 3–5 real people (anonymized, with
consent) and contact the Municipalidad de Coronel / SENAPRED Biobío / a local school.

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

### D2 — Wildfire layer (DECIDED 2026-10-02: option C for now)

Owner chose **C**: no wildfire hazard in the pilot for now; the selector offers tsunami and
earthquake. Consequence: the "same spot, two hazards, two routes" demo contrast is weaker,
because after a strong quake near the coast the official instruction is to evacuate as for a
tsunami. Option A can be added later without rework (hazards are data + config).

A static offline app cannot know where a fire is, the wind, or which roads are cut, so there is
no valid precomputed "official wildfire route". Options:

- **A (recommended):** vegetation/fuel layer derived from OSM (`landuse=forest`, `natural=wood`,
  `natural=scrub`), labeled "Aproximada — derivada de OSM, no es un mapa oficial de riesgo";
  routing penalizes edges near vegetation and goes to meeting points in consolidated urban areas;
  optional user input "¿Hacia dónde ves el humo o fuego?" penalizes that direction.
- **B:** official CONAF/SENAPRED layer, only if a usable, licensed source is found and verified.
- **C:** drop wildfire for the pilot; keep tsunami + earthquake.

Earthquake mode: SENAPRED's official wording (https://www.senapred.cl/sismos/): go to a
"Lugar de Protección Sísmica"; on the coast, if the quake made it hard to stay standing, evacuate
immediately toward a meeting point. (Corrected 2026-10-02: SENAPRED does not use "agáchate,
cúbrete y afírmate".)

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
