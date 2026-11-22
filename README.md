# EHF Volunteer Hub V3 — Frontend

Preserved React/TanStack Start UI for Ethnic Health Forum.

## Ownership boundaries
- Lovable: frontend UI only.
- GitHub: intended new private V3 source repository; creation/privacy has not been performed by this cleanup.
- Claude Code: independently designed new MySQL database and PHP backend/API.
- Namecheap: future new backend/database hosting; no deployment authorised here.

The complete old PHP tree and historical evidence are privately archived outside this checkout. Do not reuse their schema, migrations, controllers, authentication or API.

## Connection state
All legacy service operations reject before any network request. Inherited API/login settings are ignored. Existing routes/forms/workspace designs remain in source; protected workspaces cannot open without a future real backend. Existing demo workflow source remains for preservation, but workspace routing cannot fall back to demo access.

`src/server.ts` and `src/start.ts` remain TanStack rendering/framework support, not a business backend. No database or authentication service was added.

## Development
`bun install`, `bun run dev`, `bun run test`, `bun run lint`.

See `docs/frontend-preservation-manifest.json`, `docs/legacy-dependencies.json` and `docs/phase1-separation-report.md` for exact inventories and verification.

A new V3 repository must start from an allowlisted clean source export, not a clone carrying legacy Git history. The platform-managed `.gitignore` was not changed. `.env` is removed from this checkout; no old configuration should be imported into a new repository.
