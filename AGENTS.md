<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Volunteer Hub is a frontend prototype: all figures come from `src/lib/demo-data.ts` until the organisation's PHP backend is connected; never show fake success/references as real.
- Admin (`/admin/*`) and volunteer (`/portal/*`) areas share `components/ehf/AppShell`; public pages use `PublicLayout` — keep navigation consistent through these.
- Admin area (/admin/*) is locked behind ADMIN_LOGIN_CONNECTED in src/routes/admin.tsx until the PHP admin login is integrated; why: no real auth exists yet.
- Public Admin Dashboard button target comes from VITE_ADMIN_LOGIN_URL (https only); unset falls back to locked /admin. Why: live PHP login URL not confirmed yet.
- Admin Demo Mode (isPreviewHost + ADMIN_DEMO_MODE_FORCED in src/lib/admin-login.ts) opens /admin with synthetic in-memory data on Lovable preview hosts (checked by hostname after hydration, since built previews are production builds), the dev server, or VITE_ADMIN_DEMO_MODE="true"; the published domain stays locked. Why: lets the client review the dashboard before the PHP backend exists. Remove at Backend Integration.

- Phase 2 attendance and certificate views share a tab-scoped external store and pure workflow functions; why: approvals, eligibility, reports and profile totals must agree without backend persistence.
- Attendance detail selection and issued-only certificate history use pure selectors; certificate edits rederive approved hours and append history, so presentation never changes source attendance or volunteer identity.
- Demo organisational actions resolve current per-account grants through the shared permission evaluator, including action and project scope; why: stale actors and menu access must not bypass revocations.
- Document generation runs in browser event handlers with pdf-lib and dynamically imported ExcelJS; why: real demo downloads must not require server integrations.
- PDF previews dynamically load PDF.js and its bundled worker after hydration; why: certificates must render without a browser PDF plug-in and without server-side browser imports.
- Demo portal provisioning uses a separate tab-memory account store with deterministic expiring single-use simulation markers; why: acceptance and access must remain separate without real authentication or password persistence.
- Portal views derive volunteer identity from an active simulated account and a shared actor context; why: every portal screen must scope records to the same Volunteer ID rather than hardcoded names.
- Demo account and grant management uses the technical-only Users & Permissions page and a tab-scoped external store; why: preserve a single synthetic account/grant model without adding authentication or persistent credentials.
- Admin preview identity is selected by account, never a separate role switch; technical provisioning resolves the current active account through the shared evaluator, so labels alone cannot confer authority.
- Application decisions read the latest tab workflow state and guard in-flight actions; why: repeated clicks must never replay a stale acceptance or duplicate a profile.
- Portal projects, assignments, tasks, report versions, performance and notifications share the tab-scoped portal workflow store keyed by Volunteer ID; why: admin review and volunteer views must read back identical demo records.
- Final certificate criteria read approved attendance and authorised period completion across all projects; why: eligibility never creates per-project certificates or bypasses unresolved approvals.
- One-click portal review entry uses an isolated synthetic fixture in the existing tab stores and the preview-host gate; why: review access must not alter other volunteers, introduce authentication or expose production access. Its pre-issued final certificate covers the closed historical period, not current tasks.
- Restore the review-only portal after hydration from a tab-scoped non-secret demo-selection marker, cleared on exit; why: refreshing must retain password-free review access without persisting credentials or synthetic records. Refresh recreates original fixtures; simulated account forms remain separate and opt-in.
- Performance reviews use pure scoped workflow functions and shared evaluation rendering; drafts retain the last publication, each save appends a snapshot and audit entry, and only owned published evaluations reach portal views. Why: edits must preserve history without exposing unpublished changes or divergent review datasets.
- Volunteer hours use a dedicated manual-only view and a schema-validated pure submission function against current active assignments; why: remove volunteer automatic controls and listings without changing administrator review or historical attendance.
- Default workspace routes select PHP after hydration; demo requires an explicit preview-only query. Local PHP uses exact-origin CORS and native cookies/CSRF; nonlocal connections require a verified HTTPS API setting and never fall back to demo.
- All PHP reads, mutations, uploads and downloads resolve the same validated connection helper; the future hosting target is documentation-only until verified, because an intended hostname is not a deployed service.
- Homepage uses dedicated presentation components with the existing credentialed PHP session/login adapter; native sessions select the appropriate workspace, and the retired registration route redirects home. Why: visual redesign must not duplicate authentication or expose discontinued submissions.
- PHP manual-hours project choices come from active assignments independently of task assignments; why: a volunteer may log authorised project work before a task is assigned.
- Connected local workspaces use PHP session capability DTOs and confirmed screen/mutation requests inside the shared shell; why: connected screens must not consume demo stores or infer authority from role labels.
- Public application receipts are shown only from an in-memory confirmed PHP response, never URL parameters; why: a fabricated query must not appear to confirm submission, and form fields must be preserved by PHP.
- Keep the disabled PHP handoff source in `php-integration`, outside the frontend import graph; disposable active fixtures and database files stay under `/tmp` so runtime resets cannot erase source or expose test authority.
- Recover PHP tests through the guarded source-controlled Python runner against one owned socket-only schema; source-copy fixture activation never enters release code because resets must be recoverable without exposing authority.
- Generate activation/recovery links through the PHP AccountLinks origin validator; native cookies allow configured SameSite=None only with Secure because split-hosting must retain PHP identity and CSRF protection.
- PHP report downloads intersect source-screen visibility with independent export scope; unsupported Unicode/oversized PDFs fail explicitly rather than clipping confidential or unreadable output.
- ReportQuery uses fixed SQL projections, independent read/export scope intersections, database date/search/order/count and bounded batches; why: exports must not repeatedly materialise entire screen datasets or leak out-of-scope rows.

- Connected dashboard metrics use SQL aggregates and dependent selections use searchable 100-row pages; why: scoped counts remain accurate without materialising every record.
- Record corrections and technical checks use exact action gates and atomic history; issued-period source hours cannot change until certificate revocation, because issued evidence must remain trustworthy.
- Build external PHP hosting packages with an explicit migration allowlist, private app/public-controller separation and no legacy installers or synthetic fixtures; why: packaging must not activate policy, leak credentials or blindly migrate existing hosting data.
- Empty installs need allowlisted SQL and audit genesis. Hosted staff CLI fills missing references from PermissionDefinitions within its backup-gated account transaction and rejects conflicts; why: schema-only installs lack seeds, and private links must precede commit.

- V3 PHP facade rejects; preserve UI, never restore old transport.
