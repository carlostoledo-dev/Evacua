# Delivery plan — Evacua

Each phase ends with a report (done / tested / pending or uncertain) and waits for
explicit owner approval before the next one starts.

| Phase                                           | Status                          |
| ----------------------------------------------- | ------------------------------- |
| 0. Questions, plan, CLAUDE.md                   | Done — answered 2026-10-01      |
| 1. Skeleton, CI, PWA, i18n                      | Done — approved 2026-10-01      |
| 2. Data layer: schema + labeled DEMO data       | Done — approved 2026-10-02      |
| 3. Offline map + hazard layers and selector     | Done — approved 2026-10-02      |
| 4. Evacuation guidance: safe point, route, time | Done — approved 2026-10-04      |
| 5. Profiles + accessibility                     | Built — awaiting owner approval |
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
- Owner request (2026-10-02): make it feel like a mobile app, light, fast and battery-friendly.
  Done in this phase:
  - App shell: compact app bar with one connection pill, full-screen map, bottom tab bar
    (Mapa · Qué hacer · Datos · Ajustes) with 60 px targets, compact disclaimer always visible,
    safe-area insets (notch / gesture bar), no pull-to-refresh, system fonts only.
  - Themes: high-contrast light (outdoor sunlight) and pure-black dark (OLED pixels off), with
    Automático / Claro / Oscuro in Settings, stored on the device; map palette follows the theme.
  - Battery and low-end phones: map rendered at most at 2× pixel ratio, no label fade animation,
    no world copies, no CSS animations; the map stays mounted but hidden on other tabs, so it is
    not rebuilt and does not render.
  - Accessibility kept: native radios (selected hazard shows a ✓ + fill), focus moves to each
    screen title on tab change, 48 px map controls (e2e-verified).
  - Bug found by e2e: two hazard selectors shared one radio group name; fixed with `useId`.

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

- [x] Unit tests: shortest path, unreachable goal, multi-goal (network-nearest beats air-nearest),
      node filters, ETA ranges; real-data test checks every DEMO location against its label.
      Domain coverage: 99 % statements, 100 % lines.
- [~] "Same demo point, different destinations for tsunami vs. wildfire": not applicable after
  D2 = C (no wildfire). Instead, e2e checks that earthquake mode adds SENAPRED's
  protect-first instruction to the same route.
- [x] Outside zone → clear message, no route drawn (e2e).
- [x] No GPS / denied / timeout → explicit state + manual "Elegir en el mapa" (e2e for denied;
      unit tests for every geolocation error code).
- [x] No route is ever drawn without a graph or reachable safe ground: straight-line fallback,
      labeled "no es un camino" (unit tests).

**Phase 4 notes (2026-10-02)**

- Safety-first routing (changed during implementation after reviewing real cases): the route
  first leaves SENAPRED's evacuation area by the shortest street path, then continues to the
  nearest meeting point without re-entering the area. From Camilo Olavarría, plain
  "nearest meeting point" left the danger zone only after 1.7 km; safety-first leaves it after 1.46 km.
- Performance on real data: graph + safe-node index ≈ 30 ms once; each plan 1–10 ms. The
  polygon test uses a latitude-band index (583 ms → 8 ms for all 12.5k nodes, identical results).
- Location: one GPS reading on request (no tracking, battery-friendly), or a tap on the map, or a
  labeled DEMO point. Location is kept in memory only (e2e checks nothing is stored).
- Offline bundle is now ≈ 4.0 MB (graph adds ≈ 430 KB raw / 115 KB gzipped).

## Phase 5 — Profiles and accessibility

**Build**

- Typed `ProfileConfig` presets (Persona, Adulto mayor, Niño/a), persisted locally with try/catch.
- Adulto mayor: very large text, one primary button, 3 steps, voice.
- Niño/a: icons, short phrases, "Busca a tu adulto o profesor y sigue el plan", drill game mode.
- Backpack checklist per profile; voice via `speechSynthesis` with text fallback.
- Reduced motion, light/dark scheme, keyboard navigation, focus management.

**Acceptance criteria**

- [x] No profile-name branching in UI components: profiles are typed presets
      (`src/domain/profiles.ts`: text scale, time display, auto voice, simple mode, guardian
      message, drill) read by the UI.
- [x] axe-core (Playwright, WCAG 2.0–2.2 A/AA tags): 0 serious/critical violations on welcome,
      ready, tutorial, map, guide, data and settings (older-adult profile, the largest text).
- [x] Touch targets ≥ 48 px (map controls e2e-checked); onboarding, tutorial and tabs work with
      the keyboard (native controls, focus moved to each new title, Escape closes the tutorial).
- [x] Voice unavailable → the text stays and a note says so. Storage throwing → onboarding runs
      every visit and the app still works end to end (e2e).

**Phase 5 notes (2026-10-04)**

- First run: welcome → install (native prompt on Android/Chrome, instructions on iPhone,
  "already installed" in standalone) → profile (Adulto / Adulto mayor / Niño-a, no name)
  → ready → 5-step tutorial over the map (card never leaves the screen, e2e-checked
  for the largest text). Returning users go straight to the map.
- Profiles: Adulto mayor = 1.3× text, slow-pace times only, voice reads new instructions
  automatically, one primary button. Niño/a = 1.15× text, "Busca a tu adulto o profesor y sigue
  el plan", no times, drill game. Screen text and voice come from the same function.
- Backpack checklist: SENAPRED's official 11-item kit, verbatim, plus its note on special needs.
  SENAPRED publishes no per-profile kit, so none was invented.
- Privacy: the profile (type and tutorial flag, no personal data) and checklist ticks live only in
  localStorage; "Borrar mis datos" removes every key (e2e-checked). Location is still never stored.
- Look (redesigned 2026-10-04, see below): navy header with the hazard control, white route
  sheet with large action cards, accessible vivid blue (#0a5bd8, 6:1).
- Dev-only dependency `@axe-core/playwright` is MPL-2.0; it is never shipped in the app.

**Owner additions (2026-10-04)**

- Feel like a native mobile app: install prompt, first-run onboarding, a profile "like an account"
  (name + Adulto / Adulto mayor / Niño-a), then the map with an interactive tutorial.
- Apple-like, simple, glassmorphism style.
- Resolved against the rules: the profile lives **only on the device** (name optional, never
  sent, "Borrar mis datos" in Settings); glass keeps AA contrast, falls back to solid with
  `prefers-reduced-transparency`; illustrations are self-made SVG (no external images needed).

**Owner redesign (2026-10-04, later the same day)**

- The owner shared four mockups (welcome, install, profile, map) and asked for that style, and
  to drop the name so the profile collects no personal data.
- Done: new wave app icon (PNG icons regenerated); welcome hero with a self-drawn SVG coastal
  scene and three feature tiles; progress stepper, big headings and Atrás/Continuar buttons on
  each step; phone illustration with install instructions; profile cards with self-drawn avatars
  and a visual radio; navy header (commune · sector from the manifest, green offline pill) with
  the hazard segmented control; white route sheet with "Buscar mi ruta de evacuación" (GPS) and
  "Elegir en el mapa" action cards; underlined active tab; yellow disclaimer bar (a card on the
  onboarding pages). Glass translucency was dropped: everything is solid, so no fallback needed.
- Not copied from the mockups: "Search for a place" (Evacua has no place search; the second card
  is "Elegir en el mapa", which exists) and the mockup's illustrations (raster, AI-generated;
  replaced by SVG drawn for the project).
- Name removed: onboarding and Settings no longer ask for it; a `name` stored by an earlier build
  is dropped on the next start (unit-tested; checked in the browser).
- Verified: `npm run check` green, 29/29 e2e (axe WCAG 2.2 AA: 0 serious/critical on every
  screen), visual check at 375 × 812 in light and dark.

**Owner images and desktop layout (2026-10-04)**

- On a computer the app keeps the phone layout in a centered 430 px column.
- The owner supplies the illustrations as images, step by step (no hand-drawn SVG). Added: welcome
  hero, app icon (PWA icons regenerated from `public/logo.png`), three profile avatars, all
  cropped, masked and converted to WebP (hero 114 KB, avatars ≈ 10 KB each; `.webp` precached).
- Profile cards show legal age bands (sources in `src/domain/constants.ts`): Niño o niña "Menos
  de 14 años" (Ley 21.430, art. 1), Adulto "14 a 59 años", Adulto mayor "60 años o más"
  (Ley 19.828, art. 1). Cards are now ordered by age. The age is never asked or stored.
- Install-step phone and "¡Todo listo!" images added (backgrounds removed so they also work on
  the dark theme). The first phone image showed Apple's App Store, Safari and Music icons
  (trademarks) and was replaced by the owner. No hand-drawn SVG illustrations remain.
- Map screen restructured from the owner's mockup: legend at the top right, round zoom and
  "find me" (GPS) buttons under it, scale at the bottom left, meeting points drawn as a green disc
  with a walking person (shape + pictogram, not color alone), and a route sheet that folds to its
  title for more map and unfolds by itself when the location or plan changes (e2e-tested).
  Not taken from the mockup: satellite imagery (no offline-licensable source; the basemap stays
  OpenStreetMap vector tiles) and pill-shaped place labels.
- Fit to the screen (owner request 2026-10-04: "que todo calce en la pantalla"): every onboarding
  step fills exactly one screen with no scrolling; the illustration takes the leftover height and
  the actions plus the disclaimer sit at the bottom. E2e-checked on Pixel 7 (412 × 839) and on a
  small 360 × 640 screen; also checked by hand at 375 × 667, 390 × 844 and the desktop column.
  Main app: slimmer header, hazard band and tab bar; one-row "new version" bar (≈ 57 px instead of
  ≈ 100 px); the route sheet keeps its title row pinned while its content scrolls; "Elegir en el
  mapa" and the DEMO points share one row; "Cambiar" sits next to the location line; credits and
  scale moved to the bottom left so they never collide with the map buttons.
- Disclaimer wording shortened to fit the bar in three lines; it keeps all three required
  points (support tool only, does not replace SENAPRED, SHOA or the Municipalidad de Coronel,
  always follow their instructions).
- Low-accuracy readings: a location less precise than 100 m (`LOW_ACCURACY_M`, an engineering
  choice) shows a warning and a shortcut to pick the place on the map. Desktop browsers often
  report ± 20 km, which made "you are outside the pilot sector" look authoritative (e2e-tested).
- Owner priorities (2026-10-04): light, asks for no data, tsunami-first, "tells you where to go and
  the fastest route". Done: the result is a step list with icon, place, distance, direction and
  time in large type ("Sal del área de peligro · 170 m · 2–4 min", "Punto de encuentro PE029 ·
  620 m, hacia el noreste · 6–12 min"); the map labels the destination "Ve aquí". Voice reads the
  same steps (direction included). The route is the shortest walk on the street network (at the
  same pace, also the fastest); slopes are not modeled (no elevation data).
- Lighter: one map font weight (Regular). Offline bundle 4.13 MB stored, ≈ 1.8 MB to download.
- Coverage check (2026-10-04, SENAPRED Amenaza por Tsunami 2024): evacuation areas exist for 13
  coastal communes of Biobío (≈ 50 sectors). Whole region with streets ≈ 500 MB (not viable
  offline); whole coast ≈ 30–85 MB of map, viable only as per-commune downloads.

**Owner decisions (2026-10-04, later): tsunami only; pilot area = Lagunillas, Yobilo, Coronel Centro**

- Tsunami only for now: earthquake set to `available: false` (wildfire already was). With a single
  hazard there is no selector on the map or in "Qué hacer", and the tutorial drops its "choose the
  hazard" step (4 steps). The map gains the band's height.
- Pilot area: one rectangle from Lagunillas through Yobilo to the centre of Coronel, located with
  OpenStreetMap. Re-imported SENAPRED layers (2 evacuation areas, 3 safe lines, 40 routes,
  19 meeting points), basemap (168 tiles, 1.8 MB) and walking network (26,590 nodes). New DEMO
  points: Lagunillas (calle Los Temus), Coronel Centro (Plaza de Armas) and an outside point
  (Ruta 160, Compañía de Lota); the real-data test checks each against its label.
- Finding to discuss with the owner: from Lagunillas, leaving SENAPRED's evacuation area on foot
  is ≈ 3.2 km (30–60 min at FEMA paces); the whole coastal plain is inside the official area. The
  app shows this as is; it must not suggest anything (e.g. vertical evacuation) without an
  official source.
- Offline bundle after the change: ≈ 5.6 MB stored, ≈ 2.4 MB to download (tiles 1.8 MB, walking
  network 0.9 MB raw). E2e tests that wait for the offline precache are marked slow.
- Official-data audit (2026-10-04, owner: "basémonos en los datos oficiales"). Official
  (SENAPRED): evacuation area, safe line, meeting points, evacuation routes (drawn), guidance text.
  Computed by Evacua: the walking path over OpenStreetMap streets and its time (FEMA paces).
  Lagunillas' 3.2 km exit is set by the official area itself (≈ 2.4 km even in a straight line).
  Share of each DEMO route on official evacuation routes: Yobilo 45 %, Villa La Peña 69 %,
  Lagunillas 53 %, Coronel Centro 6 %. Forcing official routes in the centre would lengthen the
  exit from the danger area from ≈ 490 m to ≈ 825 m (+70 %, to PE015 instead of PE016). A milder
  rule (prefer official routes only if the exit grows ≤ 10 %) raises the exit's share on official
  routes from 31 % to 41 % across 65 sample points, +1.1 % length on average. Not applied:
  pending owner decision (routing is safety-critical; the current rule is "leave the area by the
  shortest way", in line with SENAPRED's "prioriza la evacuación horizontal").

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
