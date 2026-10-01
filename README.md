# Evacua

Offline-first evacuation map (installable web app / PWA) for the **Yobilo** pilot sector of
Coronel, Chile. Pick a hazard — tsunami, wildfire or earthquake — and the app shows where to
evacuate from your location, even with no internet.

> **Support tool only.** It does not replace the authorities (SENAPRED, SHOA, Municipality of
> Coronel). Always follow their official instructions.

**Live demo:** https://evacua-phi.vercel.app

**Status:** work in progress for WarriorHacks 2.0 — Phase 2 of 7 (official data layer).
The full README (problem, audience, demo, screenshots, architecture, limits, roadmap) comes in Phase 7.

## Resumen en español

Mapa de evacuación que funciona sin internet para el sector Yobilo de Coronel. Eliges la
amenaza (tsunami, incendio forestal o terremoto) y te muestra hacia dónde evacuar según tu
ubicación. Es una herramienta de apoyo: no reemplaza a SENAPRED, al SHOA ni a la
Municipalidad. Sigue siempre sus instrucciones oficiales.

## Run it locally

Requires Node.js 22.12+ (see `.nvmrc`).

```bash
npm install
npm run dev          # development server
npm run check        # format, lint, typecheck, unit tests, build
npm run test:e2e     # Playwright end-to-end tests (first time: npx playwright install chromium)
```

## Privacy

No accounts, no analytics, no trackers, no backend. Settings stay on your device.

## AI use

Built with AI assistance (Claude Code). See [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## License

Evacua's code is free to use, study, modify and share for **noncommercial** purposes under the
[PolyForm Noncommercial License 1.0.0](LICENSE). Nobody may charge for it or use it
commercially. Public-safety organizations, government institutions (e.g. municipalities),
schools and charities may use it regardless of how they are funded. Because commercial use is
not allowed, this is _source-available_ software, not OSI "open source".

Map and safety data are **not** covered by that license and keep their own terms
(OpenStreetMap: ODbL; SENAPRED data: cited per IDE Chile guidance) — details in `DATA_SOURCES.md`.

**Licencia (resumen):** cualquiera puede usar, estudiar, modificar y compartir el código de
Evacua sin fines comerciales; nadie puede cobrar por él. Municipios, organismos de emergencia,
colegios y organizaciones sin fines de lucro pueden usarlo libremente. Los datos de mapas y de
seguridad mantienen sus propias licencias.
