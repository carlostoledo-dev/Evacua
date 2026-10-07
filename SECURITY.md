# Security

## Reporting a vulnerability

Please report security problems **privately**, not in a public issue:

1. On GitHub, open the repository's **Security** tab → **Report a vulnerability** (private
   vulnerability reporting).
2. If that option is not available, open a public issue that only says you have a security
   report and asks for a private channel — without any details.

Include what you found, how to reproduce it, and its impact. You will get an answer as soon as
possible; please allow time for a fix before disclosing it publicly. Evacua is a volunteer
hackathon project with no bug bounty.

Because Evacua is a safety tool, also report anything that could make it **show wrong safety
information** (a wrong evacuation area, a route through the danger zone, a missing "DEMO" label),
even if it is not a classic security bug.

## Supported versions

Only the current `main` branch, deployed at https://evacua-phi.vercel.app, is supported.

## How Evacua is protected

**No server-side attack surface.** The app is static files: no backend, no database, no accounts,
no secrets, no API at runtime.

**HTTP security headers** (single source of truth: [`vercel.json`](vercel.json); `vite preview`
and the end-to-end tests use the same values; `npm run check:headers` compares a deployment
with it):

| Header                                | Value (summary)                                                                                                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content-Security-Policy               | `default-src 'self'`; scripts, styles, fonts, workers, manifest and connections only from the same origin; no `unsafe-inline`, no `unsafe-eval`; `object-src 'none'`; `base-uri 'none'`; `form-action 'none'`; `frame-ancestors 'none'` |
| Strict-Transport-Security             | 2 years, including subdomains                                                                                                                                                                                                           |
| X-Frame-Options                       | `DENY`                                                                                                                                                                                                                                  |
| X-Content-Type-Options                | `nosniff`                                                                                                                                                                                                                               |
| Referrer-Policy                       | `no-referrer`                                                                                                                                                                                                                           |
| Permissions-Policy                    | geolocation only for this site; camera, microphone, payment and USB off                                                                                                                                                                 |
| Cross-Origin-Opener / Resource-Policy | `same-origin`                                                                                                                                                                                                                           |

**Untrusted data is validated.** Every file the app loads (commune registry, manifest, official
layers, walking graph) is validated with zod before use; paths that would leave the site's origin
are refused. Any invalid file stops the app with an explicit error instead of a wrong map.

**Safe rendering.** React escapes all text; no `dangerouslySetInnerHTML`, no `eval` /
`new Function` (also enforced by the CSP, and zod runs in its no-eval mode). The MapLibre worker
is bundled from the same origin.

**Supply chain.** Few runtime dependencies (React, MapLibre GL JS, zod, workbox-window), all
under permissive licenses; GitHub Actions pinned to commit SHAs; Dependabot updates; CI runs
`npm audit --audit-level=high` on every push.

**Tests that guard this.** End-to-end tests check the CSP and fail on any CSP violation (even a
blocked, caught attempt), check that the app only requests its own origin, and that it works
offline. Unit tests assert the header policy in `vercel.json`.

## Privacy

See [PRIVACY.md](PRIVACY.md): no personal data is collected; the location never leaves the phone.
