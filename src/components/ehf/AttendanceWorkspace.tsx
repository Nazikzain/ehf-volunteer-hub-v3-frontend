import { anyPermission, hasPermission, requirePermission } from "@/lib/demo-roles";
import { useState } from "react";
import { Clock, CheckCircle2, Users, Hourglass, LogIn, LogOut, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Kpi, DataTable } from "./ui";
import { StatusBadge } from "./StatusBadge";
import { useWorkflow } from "@/lib/workflow-store";
import { usePhase2, getPhase2, setPhase2, demoNow } from "@/lib/phase2-store";
import { usePortalActor } from "@/lib/portal-actor";
import { useDemoActor } from "@/lib/demo-context";
import {
  PORTAL_ACTOR,
  EMPTY_FILTER,
  ATTENDANCE_STATUSES,
  APPROVAL_STATUSES,
  visibleAttendance,
  filterAttendance,
  selectedVolunteerAttendance,
  totals,
  canReview,
  manualEntry,
  requestCorrection,
  reviewCorrection,
  reviewHours,
  recordAbsence,
  type Attendance,
  type AttendanceFilter,
} from "@/lib/attendance";
import { usePortal, getPortal, setPortal, ownTasks, event } from "@/lib/portal-workflow";
import { ManualHoursWorkspace } from "./ManualHoursWorkspace";
import { calcHours } from "@/lib/hours";
import { projects } from "@/lib/demo-data";
import { csv, downloadBlob, reportPdf, spreadsheet } from "@/lib/demo-documents";
const cls = "w-full min-w-0 rounded-md border bg-card px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}
export function AttendanceWorkspace({
  portal = false,
  reports = false,
  daily = false,
}: {
  portal?: boolean;
  reports?: boolean;
  daily?: boolean;
}) {
  return portal ? <ManualHoursWorkspace /> : <AdminAttendanceWorkspace reports={reports} daily={daily} />;
}
function AdminAttendanceWorkspace({ reports = false, daily = false }: { reports?: boolean; daily?: boolean }) {
  const portal = false;
  const portalState = usePortal();
  const admin = useDemoActor();
  const portalActor = usePortalActor();
  const actor = portal ? portalActor : admin;
  const state = usePhase2();
  const wf = useWorkflow();
  const names = Object.fromEntries(wf.volunteers.map((v) => [v.id, v.name]));
  const [filter, setFilter] = useState<AttendanceFilter>({ ...EMPTY_FILTER });
  const [sort, setSort] = useState("newest");
  const [report, setReport] = useState("Daily Attendance Report");
  const [modal, setModal] = useState<"manual" | "absence" | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [project, setProject] = useState(actor.projects[0] ?? "");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [adjust, setAdjust] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
  const [date, setDate] = useState("");
  const [absence, setAbsence] = useState<"Absent" | "Excused Absence">("Absent");
  const allowedProjects =
    portalState.projects.filter(p => hasPermission(actor, reports ? "reports.view" : "attendance.view", p.name)).map(p => p.name);
  const assignedTasks = ownTasks(portalState, actor.volunteerId ?? "").filter(
    (t) => portalState.projects.find((p) => p.id === t.projectId)?.name === project,
  );
  const scoped = reports ? state.attendance.filter(r => hasPermission(actor, "reports.view", r.project)) : visibleAttendance(state.attendance, actor);
  const selectionRequired = !portal && !reports;
  const selectedVolunteer = wf.volunteers.find((v) => v.id === filter.volunteerId);
  const filtered = filterAttendance(scoped, filter, names);
  const selectedRows = selectionRequired
    ? selectedVolunteerAttendance(filtered, selectedVolunteer?.id ?? "")
    : filtered;
  const rows = [...selectedRows].sort((a, b) => sort === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  const sum = totals(selectionRequired ? scoped : filtered);
  const recordTotals = totals(rows);
  const selectedTotals = totals(scoped.filter((r) => r.volunteerId === selectedVolunteer?.id));
  const row = scoped.find((r) => r.key === key);
  const act = (fn: (r: Attendance[]) => Attendance[], message: string) => {
    try {
      const s = getPhase2();
      setPhase2({ ...s, attendance: fn(s.attendance) });
      if (portal && actor.volunteerId)
        setPortal(
          event(getPortal(), actor.volunteerId, actor.name, message, "/portal/hours", demoNow()),
        );
      toast.success(`${message} (demo only)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };
  const reset = () => {
    setReason("");
    setComments("");
    setStart("");
    setEnd("");
    setAdjust("");
    setActivity("");
    setLocation("");
  };
  const updateFilter = (k: keyof AttendanceFilter, v: string) =>
    setFilter((f) => ({ ...f, [k]: v }));
  const exportRows = rows.map((r) => [
    r.volunteerId,
    names[r.volunteerId] ?? "",
    r.date,
    r.project,
    r.hours,
    r.attendance,
    r.approval,
    r.type,
  ]);
  const headers = [
    "Volunteer ID",
    "Volunteer",
    "Date",
    "Project",
    "Hours",
    "Attendance",
    "Approval",
    "Type",
  ];
  const exportFile = async (format: string) => {
    try {
      for (const r of rows) requirePermission(actor, "reports.export", r.project);
      if (format === "CSV")
        downloadBlob(csv(headers, exportRows), "text/csv", "ehf-attendance-demo.csv");
      if (format === "Excel")
        downloadBlob(
          new Uint8Array(await spreadsheet(headers, exportRows)),
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "ehf-attendance-demo.xlsx",
        );
      if (format === "PDF")
        downloadBlob(
          new Uint8Array(
            await reportPdf(
              `${report} | Approved ${sum.approvedHours}h; Pending ${sum.pendingHours}h; Rejected ${sum.rejectedHours}h`,
              headers,
              exportRows,
            ),
          ),
          "application/pdf",
          "ehf-attendance-demo.pdf",
        );
    } catch (e) {
      toast.error(String(e));
    }
  };
  return (
    <>
      <PageHeader
        title={
          reports
            ? "Attendance Reports & Analytics"
            : portal
              ? daily
                ? "My Hours"
                : "My Attendance & Hours"
              : "Attendance & Hours"
        }
        subtitle="Synthetic records · changes are held in this preview tab only"
        action={
          !portal && !reports && anyPermission(actor, "attendance.manage") ? (
            <Button
              onClick={() => {
                reset();
                setModal("absence");
              }}
            >
              Record absence
            </Button>
          ) : undefined
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(portal
          ? [
              [Clock, sum.approvedHours, "Approved Hours"],
              [Hourglass, sum.pendingHours, "Pending Hours"],
              [UserX, sum.rejectedHours, "Rejected Hours"],
              [LogIn, sum.checkedIn, "Currently Checked In"],
            ]
          : [
              [Users, sum.records, "Attendance in Selected Dates"],
              [CheckCircle2, sum.present, "Present Volunteers"],
              [LogIn, sum.checkedIn, "Currently Checked In"],
              [LogOut, sum.checkedOut, "Checked Out"],
              [UserX, sum.absent, "Absent Volunteers"],
              [Hourglass, sum.pending, "Pending Hours Approval"],
              [Clock, sum.approvedHours, "Total Approved Hours"],
            ]
        ).map(([Icon, value, label]) => (
          <Kpi
            key={String(label)}
            icon={Icon as typeof Clock}
            value={value as number}
            label={String(label)}
          />
        ))}
      </div>
      {selectionRequired && (
        <section className="mb-6 grid gap-3 border-b pb-5 sm:grid-cols-2">
          <Field label="Search volunteer name or ID">
            <input
              className={cls}
              value={filter.query}
              onChange={(e) => updateFilter("query", e.target.value)}
              placeholder="Volunteer name or Volunteer ID"
            />
          </Field>
          <Field label="Select volunteer">
            <select
              className={cls}
              value={filter.volunteerId}
              onChange={(e) => setFilter((f) => ({ ...f, volunteerId: e.target.value, query: "" }))}
            >
              <option value="">Select a volunteer</option>
              {wf.volunteers
                .filter(
                  (v) =>
                    (hasPermission(actor, "attendance.view") ||
                      scoped.some((r) => r.volunteerId === v.id)) &&
                    `${v.name} ${v.id}`.toLowerCase().includes(filter.query.toLowerCase()),
                )
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.id}
                  </option>
                ))}
            </select>
          </Field>
          {selectedVolunteer && (
            <>
              <div className="text-sm">
                <h2 className="text-lg font-bold">{selectedVolunteer.name}</h2>
                <p>
                  {selectedVolunteer.id} · <StatusBadge status={selectedVolunteer.status} />
                </p>
                <p className="mt-2">
                  Total Approved Hours: {selectedTotals.approvedHours} · Pending Hours:{" "}
                  {selectedTotals.pendingHours} · Rejected Hours: {selectedTotals.rejectedHours}
                </p>
                <p>Current Attendance Status: {scoped.find(r => r.volunteerId === selectedVolunteer.id && r.attendance === "Checked In")?.attendance ?? "Not currently checked in"}</p>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilter({ ...EMPTY_FILTER });
                    setKey(null);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </>
          )}
        </section>
      )}
      {(!selectionRequired || selectedVolunteer) && <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {reports && (
          <Field label="Report">
            <select
              className={cls}
              value={report}
              onChange={(e) => {
                const v = e.target.value;
                setReport(v);
                setFilter((f) => ({
                  ...f,
                  attendance: v === "Absence Report" ? "Absent" : "",
                  approval:
                    v === "Total Approved Hours"
                      ? "Approved"
                      : v === "Pending Hours"
                        ? "Pending Approval"
                        : v === "Rejected Hours"
                          ? "Rejected"
                          : "",
                }));
              }}
            >
              {[
                "Daily Attendance Report",
                "Weekly Attendance Report",
                "Monthly Attendance Report",
                "Attendance by Project",
                "Attendance by Volunteer",
                "Total Approved Hours",
                "Pending Hours",
                "Rejected Hours",
                "Absence Report",
                "Manual vs Automatic Attendance Report",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        )}
        {!selectionRequired && (
          <Field label="Search volunteer name or ID">
            <input
              className={cls}
              value={filter.query}
              onChange={(e) => updateFilter("query", e.target.value)}
            />
          </Field>
        )}
        <Field label="From date">
          <input
            type="date"
            className={cls}
            value={filter.from}
            onChange={(e) => updateFilter("from", e.target.value)}
          />
        </Field>
        <Field label="To date">
          <input
            type="date"
            className={cls}
            value={filter.to}
            onChange={(e) => updateFilter("to", e.target.value)}
          />
        </Field>
        <Field label="Project filter">
          <select
            className={cls}
            value={filter.project}
            onChange={(e) => updateFilter("project", e.target.value)}
          >
            <option value="">All projects</option>
            {allowedProjects.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        {(
          [
            ["attendance", "Attendance status", ATTENDANCE_STATUSES],
            ["approval", "Hours approval status", APPROVAL_STATUSES],
            ["type", "Attendance type", ["Automatic", "Manual"]],
          ] as const
        ).map(([k, label, options]) => (
          <Field key={k} label={label}>
            <select
              className={cls}
              value={filter[k]}
              onChange={(e) => updateFilter(k, e.target.value)}
            >
              <option value="">All</option>
              {options.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        ))}
        {reports && (
          <Field label="Volunteer filter">
            <select
              className={cls}
              value={filter.volunteerId}
              onChange={(e) => updateFilter("volunteerId", e.target.value)}
            >
              <option value="">All volunteers</option>
              {wf.volunteers
                .filter((v) => scoped.some((r) => r.volunteerId === v.id))
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label="Sort by date"><select className={cls} value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></Field>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setFilter({
                ...EMPTY_FILTER,
                volunteerId: selectionRequired ? filter.volunteerId : "",
              })
            }
          >
            Clear Filters
          </Button>
          {!portal && (
            <Button
              variant="outline"
              onClick={() =>
                setFilter((f) => ({
                  ...f,
                  from: new Date().toISOString().slice(0, 10),
                  to: new Date().toISOString().slice(0, 10),
                }))
              }
            >
              Today
            </Button>
          )}
        </div>
      </section>}
      {reports && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {["CSV", "Excel", "PDF"].map((f) => (
              <Button key={f} disabled={!anyPermission(actor, "reports.export")} variant="outline" onClick={() => void exportFile(f)}>
                Export {f}
              </Button>
            ))}
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(
              rows.reduce<Record<string, number>>((groups, r) => {
                const group =
                  report === "Attendance by Volunteer"
                    ? (names[r.volunteerId] ?? r.volunteerId)
                    : report === "Attendance by Project"
                      ? r.project
                      : report === "Manual vs Automatic Attendance Report"
                        ? r.type
                        : report === "Monthly Attendance Report"
                          ? r.date.slice(0, 7)
                          : report === "Weekly Attendance Report"
                            ? `Week of ${new Date(new Date(r.date).getTime() - ((new Date(r.date).getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10)}`
                            : r.date;
                groups[group] = (groups[group] ?? 0) + (r.approval === "Approved" ? r.hours : 0);
                return groups;
              }, {}),
            ).map(([g, h]) => (
              <p key={g} className="border-b pb-2 text-sm">
                {g}: <b>{h.toFixed(2)} approved hours</b>
              </p>
            ))}
          </div>
        </>
      )}
      {selectionRequired && !selectedVolunteer ? (
        <p className="py-8 text-center text-muted-foreground">
          Select a volunteer to view their attendance records.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">
            {rows.length} records · Approved {recordTotals.approvedHours}h · Pending {recordTotals.pendingHours}h ·
            Rejected {recordTotals.rejectedHours}h
          </p>
          {selectionRequired ? <DataTable columns={["Attendance Date", "Project", "Task / Activity", "Check-in Time", "Check-out Time", "Total Hours", "Attendance Type", "Attendance Status", "Approval Status", "Reviewer", "Actions"]} rows={rows.map(r => [r.date, r.project, (portalState.tasks.find(t => t.id === (r.taskId || r.activity))?.title ?? r.activity) || "—", r.start ? new Date(r.start).toLocaleString("en-GB") : "—", r.end ? new Date(r.end).toLocaleString("en-GB") : "—", r.hours.toFixed(2), r.type, <StatusBadge status={r.attendance} />, <StatusBadge status={r.approval} />, r.reviewer || "—", <Button variant="outline" onClick={() => { reset(); setKey(r.key); setStart(r.start.slice(0,16)); setEnd(r.end.slice(0,16)); setProject(r.project); setActivity(r.activity); setLocation(r.location); }}>View record</Button>])} /> : <div className="grid gap-3">
            {rows.map((r) => (
              <article key={r.key} className="rounded-md border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <b>
                      {names[r.volunteerId]} · {r.volunteerId}
                    </b>
                    <p className="text-sm">
                      {r.date} · {r.project}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      reset();
                      setKey(r.key);
                      setStart(r.start.slice(0, 16));
                      setEnd(r.end.slice(0, 16));
                      setProject(r.project);
                      setActivity(r.activity);
                      setLocation(r.location);
                    }}
                  >
                    View record
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <span>Check-in: {r.start ? new Date(r.start).toLocaleString("en-GB") : "—"}</span>
                  <span>Check-out: {r.end ? new Date(r.end).toLocaleString("en-GB") : "—"}</span>
                  <span>
                    {r.hours.toFixed(2)} hours · {r.type}
                  </span>
                  <span>
                    Activity: {r.activity || "—"} · Location: {r.location || "—"}
                  </span>
                  <StatusBadge status={r.attendance} />
                  <StatusBadge status={r.approval} />
                  {r.attendance === "Checked In" && (
                    <span className="text-warning">Incomplete until checked out</span>
                  )}
                  {r.rejectionReason && (
                    <span className="text-destructive">{r.rejectionReason}</span>
                  )}
                </div>
              </article>
            ))}
            {!rows.length && (
              <p className="py-8 text-center text-muted-foreground">
                No matching attendance records.
              </p>
            )}
          </div>}
        </>
      )}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modal === "manual" ? "Manual hours entry" : "Record absence"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {modal === "manual" ? (
              <>
                <Field label="Volunteer ID">
                  <input className={cls} readOnly value={actor.volunteerId ?? ""} />
                </Field>
                <Field label="Volunteer Name">
                  <input className={cls} readOnly value={actor.name} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Volunteer">
                  <select
                    className={cls}
                    value={volunteerId}
                    onChange={(e) => setVolunteerId(e.target.value)}
                  >
                    <option value="">Select volunteer</option>
                    {wf.volunteers
                      .filter(
                        (v) =>
                          hasPermission(actor, "attendance.view") ||
                          scoped.some((r) => r.volunteerId === v.id),
                      )
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} · {v.id}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Attendance Date">
                  <input
                    type="date"
                    className={cls}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Field>
                <Field label="Absence status">
                  <select
                    className={cls}
                    value={absence}
                    onChange={(e) => setAbsence(e.target.value as typeof absence)}
                  >
                    <option>Absent</option>
                    <option>Excused Absence</option>
                  </select>
                </Field>
              </>
            )}
            <Field label="Project">
              <select
                className={cls}
                value={project}
                onChange={(e) => {
                  setProject(e.target.value);
                  setActivity("");
                }}
              >
                {allowedProjects.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            {modal === "manual" && (
              <>
                <Field label="Start date & time">
                  <input
                    type="datetime-local"
                    className={cls}
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </Field>
                <Field label="End date & time">
                  <input
                    type="datetime-local"
                    className={cls}
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </Field>
                <p>
                  Calculated hours: <b>{calcHours(start, end) ?? "—"}</b>
                </p>
                <Field label="Adjusted hours (optional)">
                  <input
                    type="number"
                    step="0.01"
                    className={cls}
                    value={adjust}
                    onChange={(e) => setAdjust(e.target.value)}
                  />
                </Field>
                <Field label="Activity / Task (optional)">
                  <select
                    className={cls}
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                  >
                    <option value="">No task</option>
                    {assignedTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Location (optional)">
                  <input
                    className={cls}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </Field>
              </>
            )}
            <Field
              label={
                modal === "manual"
                  ? "Reason for Manual Entry (required)"
                  : "Absence reason (required)"
              }
            >
              <textarea
                className={cls}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <Field label="Additional comments">
              <textarea
                className={cls}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </Field>
            <Button
              onClick={() => {
                const before = getPhase2();
                act(
                  (r) =>
                    modal === "manual"
                      ? manualEntry(
                          r,
                          actor,
                          {
                            project,
                            activity,
                            location,
                            start,
                            end,
                            reason,
                            comments,
                            ...(adjust ? { adjustedHours: Number(adjust) } : {}),
                          },
                          demoNow(),
                        )
                      : recordAbsence(
                          r,
                          actor,
                          volunteerId,
                          project,
                          date,
                          absence,
                          reason,
                          comments,
                          demoNow(),
                        ),
                  modal === "manual" ? "Manual hours submitted for approval" : "Absence recorded",
                );
                if (getPhase2() !== before) setModal(null);
              }}
            >
              Submit (demo)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!row} onOpenChange={(o) => !o && setKey(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {row && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {names[row.volunteerId]} · {row.volunteerId}
                </DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries({
                  "Attendance date": row.date,
                  Project: row.project,
                  Task: portalState.tasks.find(t => t.id === row.taskId)?.title,
                  Activity: row.activity,
                  Location: row.location,
                  "Check-in": row.start,
                  "Check-out": row.end,
                  "Calculated hours": calcHours(row.start, row.end) ?? 0,
                  "Recorded hours": row.hours,
                  Type: row.type,
                  Attendance: row.attendance,
                  Approval: row.approval,
                  "Manual / absence reason": row.reason,
                  "Admin comments": row.comments,
                  "Submitted by": row.submittedBy,
                  Created: row.createdAt,
                  Updated: row.updatedAt,
                  "Reviewed by": row.reviewer,
                  "Review date": row.reviewedAt,
                  "Rejection reason": row.rejectionReason,
                }).map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="break-words">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              {canReview(actor, row) &&
                row.approval === "Pending Approval" &&
                row.attendance !== "Checked In" &&
                !["Absent", "Excused Absence"].includes(row.attendance) && (
                  <section className="grid gap-3 border-t pt-4">
                    <h3 className="font-bold">Hours review</h3>
                    <Field label="Admin comments">
                      <textarea
                        className={cls}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                    </Field>
                    <Field label="Rejection reason">
                      <textarea
                        className={cls}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </Field>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          act(
                            (r) =>
                              reviewHours(r, row.key, actor, "Approved", "", comments, demoNow()),
                            "Hours approved",
                          )
                        }
                      >
                        Approve hours
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          act(
                            (r) =>
                              reviewHours(
                                r,
                                row.key,
                                actor,
                                "Rejected",
                                reason,
                                comments,
                                demoNow(),
                              ),
                            "Hours rejected",
                          )
                        }
                      >
                        Reject hours
                      </Button>
                    </div>
                  </section>
                )}
              {portal && (
                <section className="grid gap-3 border-t pt-4">
                  <h3 className="font-bold">Request correction</h3>
                  <Field label="Requested start">
                    <input
                      type="datetime-local"
                      className={cls}
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </Field>
                  <Field label="Requested end">
                    <input
                      type="datetime-local"
                      className={cls}
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </Field>
                  <Field label="Requested project">
                    <select
                      className={cls}
                      value={project}
                      onChange={(e) => {
                        setProject(e.target.value);
                        setActivity("");
                      }}
                    >
                      {allowedProjects.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Requested activity">
                    <input
                      className={cls}
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                    />
                  </Field>
                  <Field label="Requested location">
                    <input
                      className={cls}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </Field>
                  <Field label="Reason for correction">
                    <textarea
                      className={cls}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </Field>
                  <Button
                    onClick={() =>
                      act(
                        (r) =>
                          requestCorrection(
                            r,
                            row.key,
                            actor,
                            { start, end, project, activity, location },
                            reason,
                            demoNow(),
                          ),
                        "Correction requested; original values preserved",
                      )
                    }
                  >
                    Request correction
                  </Button>
                </section>
              )}
              <section className="border-t pt-4">
                <h3 className="mb-2 font-bold">Original submission & correction history</h3>
                {row.original && (
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(row.original, null, 2)}
                  </pre>
                )}
                {!row.corrections.length && (
                  <p className="text-sm text-muted-foreground">No correction requests.</p>
                )}
                {row.corrections.map((c, i) => (
                  <div key={c.at} className="mt-3 border-t pt-3 text-sm">
                    <b>
                      {c.status} · {c.by}
                    </b>
                    <p>
                      {c.at} · {c.reason}
                    </p>
                    <pre className="whitespace-pre-wrap break-words text-xs">
                      {JSON.stringify({ requested: c.patch, original: c.original }, null, 2)}
                    </pre>
                    <p>
                      {c.decidedBy} {c.decidedAt} {c.feedback}
                    </p>
                    {c.status === "Pending" && canReview(actor, row) && (
                      <div className="grid gap-2">
                        <Field label="Correction feedback / rejection reason">
                          <input
                            className={cls}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                          />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() =>
                              act(
                                (r) =>
                                  reviewCorrection(
                                    r,
                                    row.key,
                                    i,
                                    actor,
                                    "Approved",
                                    comments,
                                    demoNow(),
                                  ),
                                "Correction approved; hours returned for review",
                              )
                            }
                          >
                            Approve correction
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              act(
                                (r) =>
                                  reviewCorrection(
                                    r,
                                    row.key,
                                    i,
                                    actor,
                                    "Rejected",
                                    comments,
                                    demoNow(),
                                  ),
                                "Correction rejected",
                              )
                            }
                          >
                            Reject correction
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
