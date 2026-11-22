# EHF Volunteer Hub V3 — Frontend

The volunteer portal and administration dashboard UI for Ethnic Health Forum (EHF), Manchester.

## Repositories

| Repository                                                                          | Purpose                                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ehf-volunteer-hub-v3-frontend` (this)                                              | React frontend, typed API client, frontend tests                                                                 |
| [`ehf-volunteer-hub-v3-api`](https://github.com/Nazikzain/ehf-volunteer-hub-v3-api) | New PHP REST API (`/api/v3`), MySQL schema and migrations, authentication, authorisation, backend tests, OpenAPI |

This repository started from a clean export of the preserved frontend (source commit `ea76b78` of `ehf-volunteer-hub-v3`) with no earlier Git history and no files from the retired backend.

## Current status

- The frontend design, pages and components are preserved; `docs/frontend-preservation-manifest.json` records the original file checksums.
- No backend is connected yet. Sign-in and data operations reject with a "not connected" message and make no network requests.
- Demo Mode (synthetic in-memory data) runs only on the local dev server and in automated tests. Production builds cannot enable it.
- Public volunteer registration is disabled; `/register` and `/application-received` redirect to the homepage.
- `docs/legacy-dependencies.json` lists the remaining legacy frontend references to replace during API integration (Phase 12).
- See `roadmap.md` for the phase plan.

## Development

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev
bun run test
bun run lint
bun run build
```

`bun run build` currently produces a Cloudflare Workers build (Nitro preset `cloudflare-module`, configured by `@lovable.dev/vite-tanstack-config` in `vite.config.ts`). The production hosting choice is part of a later phase.

## Security

- Never commit passwords, API keys, tokens, private credentials, `.env` files or real personal information. This repository is public.
- The frontend holds no database credentials or backend secrets; all authorisation is enforced by the API.

See `AGENTS.md` for contributor and agent rules.
