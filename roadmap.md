# EHF Volunteer Hub V3 — Roadmap

Each phase starts with an approved plan and ends with a report (changes, tests, lint, build, open issues) and explicit approval before the next phase.

| Phase | Scope                                       | Status      |
| ----- | ------------------------------------------- | ----------- |
| 0     | Repository and environment audit            | Done        |
| 1     | Clean frontend repository preparation       | In progress |
| 2     | New backend repository foundation           | Not started |
| 3     | Database design and migrations              | Not started |
| 4     | Authentication and permissions (four roles) | Not started |
| 5     | Volunteer management                        | Not started |
| 6     | Projects, assignments and tasks             | Not started |
| 7     | Task reports and approvals                  | Not started |
| 8     | Volunteer hours and monitoring              | Not started |
| 9     | Performance reviews                         | Not started |
| 10    | Volunteering periods and certificates       | Not started |
| 11    | Notifications and reporting                 | Not started |
| 12    | Frontend API integration                    | Not started |
| 13    | Security and feature-parity testing         | Not started |
| 14    | Hosting preparation and pilot deployment    | Not started |

## Phase 1 — Clean frontend repository

- [x] Export tracked files from `ea76b78` without Git history or legacy material.
- [x] Verify preserved file checksums and scan for secrets and personal data.
- [x] Restrict Demo Mode to development builds and automated tests.
- [x] Redirect `/application-received` to the homepage; test that public registration is disabled.
- [x] Replace `AGENTS.md`, `README.md` and `roadmap.md` for V3.
- [x] Regenerate `docs/legacy-dependencies.json` as the Phase 12 replacement inventory.
- [ ] Add the exact original images for the three Lovable-hosted asset pointers (awaiting files).
- [ ] Decide how this repository connects to Lovable.
