# AI Disclosure

WarriorHacks 2.0 allows AI assistance with disclosure. This file records how AI was used,
phase by phase, as the work happened.

## Tools

- **Claude Code** (Anthropic), model Claude Opus 5.5, used as a pair programmer inside the
  project folder.

## Division of work

- **Human (project owner):** idea, problem framing, choice of pilot sector (Yobilo, Coronel),
  every product and scope decision, review and approval at the end of each phase,
  real-device testing.
- **AI (Claude Code):** proposed the plan and architecture, wrote most of the code, tests,
  configuration and documentation drafts under the owner's direction, researched public
  data sources, and — at the owner's request — ran the git commits, GitHub pushes and Vercel
  deploys. Commits made by the AI carry a `Co-Authored-By: Claude` trailer. Every AI
  suggestion was reviewed by the owner before being accepted.

## Safety-data rule for AI output

The AI was explicitly instructed never to invent safety data (inundation zones, routes,
meeting points, walking speeds). All geographic data must come from a cited source or be
visibly labeled DEMO. See `DATA_SOURCES.md`.

## Log

### Phase 0 — Planning (2026-10-01)

- AI asked clarifying questions, proposed the phased plan with acceptance criteria
  (`docs/PLAN.md`) and wrote the project rules file (`CLAUDE.md`).
- AI recommended Vite + React over Next.js (strict CSP without inline scripts); the owner approved.
- AI searched for official data and found SENAPRED's public "Amenaza por Tsunami" service
  covering Yobilo (findings in `docs/PLAN.md`).

### Phase 1 — Skeleton, CI, PWA, i18n (2026-10-01)

- AI generated the project scaffold, i18n (es-CL + en), service worker setup, security
  headers, unit and end-to-end tests, CI workflow and Dependabot config.
- AI designed the app icon (`public/logo.svg`); PNG icons are generated from it by
  `@vite-pwa/assets-generator`.
