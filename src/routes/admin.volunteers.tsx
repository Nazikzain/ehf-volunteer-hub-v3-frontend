import { hasPermission, requirePermission } from "@/lib/demo-roles";
import { canOperate } from "@/lib/portal-workflow";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionButton, DataTable, PageHeader } from "@/components/ehf/ui";
import { StatusBadge } from "@/components/ehf/StatusBadge";
import { Facts, Section, Timeline } from "@/components/ehf/DetailBits";
import { usePortal } from "@/lib/portal-workflow";
import { assignments, certificates, reviews } from "@/lib/demo-extra";
import {
  AVAILABILITY_TYPES,
  setAvailabilityType,
  validateAvailability,
  WEEKDAYS,
  type AvailabilityType,
  type Volunteer,
} from "@/lib/volunteer-workflow";
import { getWorkflow, setWorkflow, useWorkflow } from "@/lib/workflow-store";
import { usePhase2 } from "@/lib/phase2-store";
import { totals, visibleAttendance } from "@/lib/attendance";
import { useDemoActor } from "@/lib/demo-context";
import { accountStatus, useAccess } from "@/lib/portal-access";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin/volunteers")({
  head: () => meta("Volunteer Profiles"),
  validateSearch: (s: Record<string, unknown>): { id?: string } =>
    typeof s["id"] === "string" ? { id: s["id"] } : {},
  component: Page,
});
const STATUSES = ["Active", "Inactive", "Under Review"];
const List = ({ items }: { items: string[] }) =>
  items.length ? (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">None</p>
  );

function Page() {
  const wf = useWorkflow();
  const phase2 = usePhase2();
  const portal = usePortal();
  const access = useAccess();
  const actor = useDemoActor();
  const attendance = visibleAttendance(phase2.attendance, actor);
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/volunteers" });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const shown = useMemo(
    () =>
      wf.volunteers
        .filter(
          (v) => hasPermission(actor, "volunteers.view") || portal.assignments.some(a => a.volunteerId === v.id && canOperate(portal, actor, a.projectId, "volunteers.view")),
        )
        .filter(
          (v) =>
            (!status || v.status === status) &&
            [v.id, v.name, v.email, v.languages, v.skills]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase()),
        ),
    [wf, q, status, actor, attendance],
  );
  const v = shown.find((x) => x.id === id);
  const open = (vid?: string) => navigate({ search: vid ? { id: vid } : {} });

  return (
    <>
      <PageHeader title="Volunteer Management" subtitle="Profiles, skills, languages and status" />
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            aria-label="Search"
            className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-md border bg-card px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        {shown.length} of {wf.volunteers.length} volunteers · synthetic data
      </p>
      <DataTable
        columns={["ID", "Name", "Languages", "Approved Hours", "Status", "Actions"]}
        rows={shown.map((x) => [
          x.id,
          <b>{x.name}</b>,
          x.languages,
          totals(attendance.filter((r) => r.volunteerId === x.id)).approvedHours,
          <StatusBadge status={x.status} />,
          <button
            aria-label={`View ${x.name}`}
            onClick={() => open(x.id)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <Eye className="h-4 w-4" /> View profile
          </button>,
        ])}
      />
      {shown.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No volunteers match your search.
        </p>
      )}

      <Dialog open={!!v} onOpenChange={(o) => !o && open()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {v && <Profile v={v} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Profile({ v }: { v: Volunteer }) {
  const wf = useWorkflow();
  const phase2 = usePhase2();
  const portal = usePortal();
  const access = useAccess();
  const actor = useDemoActor();
  const attendance = visibleAttendance(phase2.attendance, actor).filter(
    (r) => r.volunteerId === v.id,
  );
  const summary = totals(attendance);
  const app = wf.applications.find((a) => a.ref === v.applicationRef);
  const [type, setType] = useState<AvailabilityType>(v.availabilityType);
  const [days, setDays] = useState<string[]>(v.availabilityDays);
  const [err, setErr] = useState("");
  const canEdit = hasPermission(actor, "volunteers.edit") || portal.assignments.some(a => a.volunteerId === v.id && canOperate(portal, actor, a.projectId, "volunteers.edit"));
  const saveAvail = () => {
    if (!hasPermission(actor, "volunteers.edit") && !portal.assignments.some(a => a.volunteerId === v.id && canOperate(portal, actor, a.projectId, "volunteers.edit"))) return;
    const e = validateAvailability(type, days);
    setErr(e ?? "");
    if (e) return;
    setWorkflow({
      ...getWorkflow(),
      volunteers: getWorkflow().volunteers.map((x) =>
        x.id === v.id ? { ...x, availabilityType: type, availabilityDays: days } : x,
      ),
    });
    toast.success("Availability updated (demo only — not saved)");
  };
  const mine = <T extends { volunteer: string }>(xs: T[]) =>
    xs.filter((x) => x.volunteer === v.name);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-3">
          {v.name} <StatusBadge status={v.status} />
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          {v.id}
          {v.applicationRef ? ` · from application ${v.applicationRef}` : ""}
        </p>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Personal Information">
          <Facts
            items={[
              ["Volunteer ID", v.id],
              ["Full name", v.name],
              ["Email", hasPermission(actor, "volunteers.view") ? v.email : "Restricted"],
              ["Phone", hasPermission(actor, "volunteers.view") ? v.phone : "Restricted"],
              ["Address", hasPermission(actor, "volunteers.view") ? v.address : "Restricted"],
              ["Postcode", hasPermission(actor, "volunteers.view") ? v.postcode : "Restricted"],
              ["Nationality", hasPermission(actor, "volunteers.view") ? v.nationality : "Restricted"],
              ["Preferred language", v.language],
            ]}
          />
        </Section>
        <Section title="Volunteer Information">
          <Facts
            items={[
              ["Skills & experience", v.skills],
              [
                "Availability",
                v.availabilityType === "Flexible" ? "Flexible" : v.availabilityDays.join(", "),
              ],
              ["Start date", v.startDate],
              ["End date", v.endDate],
              ["Status", <StatusBadge status={v.status} />],
              [
                "Portal account",
                <StatusBadge
                  status={accountStatus(
                    access.accounts.find((a) => a.volunteerId === v.id),
                    new Date().toISOString(),
                  )}
                />,
              ],
            ]}
          />
        </Section>
      </div>
      <Section title="Availability">
        <div className="grid gap-3">
          <select
            aria-label="Availability"
            value={type}
            onChange={(e) => {
              const t = e.target.value as AvailabilityType;
              setType(t);
              setDays(setAvailabilityType(t, days));
              setErr("");
            }}
            className="rounded-md border bg-card px-3 py-2 text-sm"
          >
            {AVAILABILITY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {type === "Specific Days of the Week" && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Available days</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WEEKDAYS.map((d) => (
                  <label
                    key={d}
                    className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={days.includes(d)}
                      onChange={(e) => {
                        setDays(
                          WEEKDAYS.filter((x) => (x === d ? e.target.checked : days.includes(x))),
                        );
                        setErr("");
                      }}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div>
            <ActionButton disabled={!canEdit} onClick={saveAvail}>Save availability</ActionButton>
          </div>
        </div>
      </Section>
      <Section title="Activity and History">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-success-soft p-3">
            <p className="text-2xl font-bold text-success">{summary.approvedHours}</p>
            <p className="text-xs">Approved hours</p>
          </div>
          <div className="rounded-md bg-warning-soft p-3">
            <p className="text-2xl font-bold text-warning">{summary.pendingHours}</p>
            <p className="text-xs">Pending hours</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-1 text-sm font-semibold">Assigned projects</h4>
            <List
              items={portal.assignments
                .filter((a) => a.volunteerId === v.id && canOperate(portal, actor, a.projectId, "assignments.view"))
                .map(
                  (a) =>
                    `${portal.projects.find((p) => p.id === a.projectId)?.name} — ${a.role} (${a.status})`,
                )}
            />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Assigned tasks</h4>
            <List
              items={portal.tasks
                .filter((t) => t.volunteerId === v.id && canOperate(portal, actor, t.projectId, "tasks.view"))
                .map((t) => `${t.title} — due ${t.due} (${t.status})`)}
            />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Time logs</h4>
            <List items={attendance.map((t) => `${t.start}: ${t.hours}h (${t.approval})`)} />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Performance reviews</h4>
            <List
              items={mine(reviews).filter(r => hasPermission(actor, "performance.view", r.project)).map(
                (r) => `${r.period} by ${r.reviewer}: ${r.rating}/5 (${r.status})`,
              )}
            />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Certificates</h4>
            <List
              items={phase2.certificates
                .filter((c) => c.volunteerId === v.id && hasPermission(actor, "certificates.view"))
                .map((c) => `${c.title} — ${c.status}, ${c.issuedAt || "Pending"}`)}
            />
          </div>
        </div>
        <h4 className="mb-2 mt-4 text-sm font-semibold">Application history</h4>
        {app && hasPermission(actor, "applications.view") ? (
          <Timeline entries={app.history} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No linked application (profile added before online applications).
          </p>
        )}
      </Section>
      <p className="text-xs text-muted-foreground">
        Demo only — synthetic data, changes are not saved.
      </p>
    </>
  );
}
