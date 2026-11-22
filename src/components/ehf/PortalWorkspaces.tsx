import { canAccess } from "@/lib/demo-roles";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, DataTable } from "./ui";
import { StatusBadge } from "./StatusBadge";
import { Facts, Timeline } from "./DetailBits";
import { usePortalActor } from "@/lib/portal-actor";
import { useDemoActor } from "@/lib/demo-context";
import { usePhase2 } from "@/lib/phase2-store";
import {
  getPortal,
  usePortal,
  setPortal,
  ownTasks,
  ownAssignments,
  scopedProjects,
  updateTask,
  saveReport,
  reviewReport,
  approveTask,
  markRead,
  validateAttachment,
  canOperate,
  type Task,
  type Report,
  type ReportValues,
} from "@/lib/portal-workflow";
import { downloadBlob } from "@/lib/demo-documents";
import { acknowledgePerformance, publishedReviews } from "@/lib/performance-workflow";
import { PerformanceDetails } from "./PerformanceDetails";
const cls = "w-full min-w-0 rounded-md border bg-card px-3 py-2 text-sm";
export function run(action: () => void) {
  try {
    action();
    toast.success("Updated in demo memory");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Action failed");
  }
}
export function PortalProjects() {
  const actor = usePortalActor(),
    s = usePortal(),
    attendance = usePhase2();
  const [id, setId] = useState("");
  const rows = scopedProjects(s, actor),
    current = rows.find((p) => p.id === id);
  return (
    <>
      <PageHeader title="My Projects" />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => {
          const a = ownAssignments(s, actor.volunteerId ?? "").find((a) => a.projectId === p.id);
          const ts = ownTasks(s, actor.volunteerId ?? "").filter((t) => t.projectId === p.id);
          return (
            <article key={p.id} className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="my-2 text-sm">{p.description}</p>
              <Facts
                items={[
                  ["Objectives", p.objectives],
                  ["Dates", `${p.start} – ${p.end}`],
                  ["Status", <StatusBadge status={p.status} />],
                  ["Responsibility", a?.role],
                  ["Assignment date", a?.date],
                  ["Assignment status", a?.status],
                  ["Admin", p.supervisor],
                  ["Assigned tasks", ts.length],
                  [
                    "Progress",
                    `${ts.length ? Math.round(ts.reduce((n, t) => n + t.progress, 0) / ts.length) : 0}%`,
                  ],
                ]}
              />
              <Button className="mt-4" variant="outline" onClick={() => setId(p.id)}>
                View {p.name}
              </Button>
            </article>
          );
        })}
      </div>
      <Dialog open={!!current} onOpenChange={(o) => !o && setId("")}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {current && (
            <>
              <DialogHeader>
                <DialogTitle>{current.name}</DialogTitle>
              </DialogHeader>
              <p>{current.objectives}</p>
              <h3 className="font-bold">Activities & Timeline</h3>
              {current.activities.map((a) => (
                <p key={a}>{a}</p>
              ))}
              <h3 className="font-bold">Assigned Tasks</h3>
              {ownTasks(s, actor.volunteerId ?? "")
                .filter((t) => t.projectId === current.id)
                .map((t) => (
                  <p key={t.id}>
                    {t.title} · {t.status} · {t.due}
                  </p>
                ))}
              <h3 className="font-bold">Related Attendance</h3>
              {attendance.attendance
                .filter((r) => r.volunteerId === actor.volunteerId && r.project === current.name)
                .map((r) => (
                  <p key={r.key}>
                    {r.date} · {r.hours}h · {r.approval}
                  </p>
                ))}
              <h3 className="font-bold">Task Reports</h3>
              {s.reports
                .filter((r) => r.volunteerId === actor.volunteerId && r.projectId === current.id)
                .map((r) => (
                  <p key={r.id}>
                    {r.title} · {r.status}
                  </p>
                ))}
              <h3 className="font-bold">Assignment History</h3>
              <Timeline
                entries={(
                  ownAssignments(s, actor.volunteerId ?? "").find((a) => a.projectId === current.id)
                    ?.history ?? []
                ).map((h) => ({ ...h }))}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
export function PortalTasks({ admin = false }: { admin?: boolean }) {
  const volunteer = usePortalActor(),
    manager = useDemoActor(),
    actor = admin ? manager : volunteer,
    s = usePortal();
  const [id, setId] = useState(""),
    [q, setQ] = useState(""),
    [project, setProject] = useState(""),
    [status, setStatus] = useState(""),
    [priority, setPriority] = useState(""),
    [due, setDue] = useState(""),
    [progress, setProgress] = useState(0),
    [notes, setNotes] = useState("");
  const permitted = admin
    ? s.tasks.filter((t) => canOperate(s, actor, t.projectId, "tasks.view"))
    : ownTasks(s, actor.volunteerId ?? "");
  const shown = permitted.filter(
    (t) =>
      (!project || t.projectId === project) &&
      (!status || t.status === status) &&
      (!priority || t.priority === priority) &&
      (!due || t.due <= due) &&
      t.title.toLowerCase().includes(q.toLowerCase()),
  );
  const t = permitted.find((t) => t.id === id);
  return (
    <>
      <PageHeader
        title={admin ? "Task Management" : "My Tasks"}
        action={
          admin && canAccess(actor, "/admin/assignments") ? (
            <Button asChild>
              <Link to="/admin/assignments">Manage assignments</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <label>
          Search task title
          <input className={cls} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label>
          Project
          <select className={cls} value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">All</option>
            {scopedProjects(s, actor).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Task status
          <select className={cls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {[
              "Not Started",
              "In Progress",
              "Submitted for Review",
              "Completed",
              "Overdue",
              "Cancelled",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select className={cls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All</option>
            {["High", "Medium", "Low"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Due by
          <input type="date" className={cls} value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
      </div>
      <DataTable
        columns={["Task", "Project", "Due", "Priority", "Status", "Progress", "Actions"]}
        rows={shown.map((t) => [
          t.title,
          s.projects.find((p) => p.id === t.projectId)?.name,
          t.due,
          t.priority,
          <StatusBadge status={t.status} />,
          `${t.progress}%`,
          <Button
            variant="ghost"
            onClick={() => {
              setId(t.id);
              setProgress(t.progress);
              setNotes(t.notes);
            }}
          >
            View {t.title}
          </Button>,
        ])}
      />
      <Dialog open={!!t} onOpenChange={(o) => !o && setId("")}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {t && (
            <>
              <DialogHeader>
                <DialogTitle>{t.title}</DialogTitle>
              </DialogHeader>
              <Facts
                items={[
                  ["Description", t.description],
                  ["Instructions", t.instructions],
                  ["Deliverables", t.deliverables],
                  ["Assigned by", t.assignedBy],
                  ["Assigned date", t.assignedAt],
                  ["Start date", t.start],
                  ["Due date", t.due],
                  ["Completion date", t.completionDate],
                  ["Admin", s.projects.find((p) => p.id === t.projectId)?.supervisor],
                  ["Status", t.status],
                ]}
              />
              {!admin && !["Completed", "Cancelled", "Submitted for Review"].includes(t.status) && (
                <>
                  <label>
                    Progress (%)
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={cls}
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                    />
                  </label>
                  <progress className="w-full accent-primary" value={progress} max={100} />
                  <label>
                    Progress notes
                    <textarea
                      className={cls}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        run(() =>
                          setPortal(
                            updateTask(
                              getPortal(),
                              actor,
                              t.id,
                              progress,
                              notes,
                              false,
                              new Date().toISOString(),
                            ),
                          ),
                        )
                      }
                    >
                      {t.status === "Not Started" ? "Start task" : "Save progress"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        run(() =>
                          setPortal(
                            updateTask(
                              getPortal(),
                              actor,
                              t.id,
                              progress,
                              notes,
                              true,
                              new Date().toISOString(),
                            ),
                          ),
                        )
                      }
                    >
                      Submit task for review
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/portal/task-reports">Submit Task Report</Link>
                    </Button>
                  </div>
                </>
              )}
              {admin && canOperate(s, actor, t.projectId, "tasks.approve") && t.status === "Submitted for Review" && (
                <Button
                  onClick={() =>
                    run(() =>
                      setPortal(approveTask(getPortal(), actor, t.id, new Date().toISOString())),
                    )
                  }
                >
                  Approve task completion
                </Button>
              )}
              <h3 className="font-bold">Previous Reports & Admin Feedback</h3>
              {s.reports
                .filter((r) => r.taskId === t.id && (!admin || canOperate(s, actor, r.projectId, "taskReports.view")))
                .map((r) => (
                  <p key={r.id}>
                    {r.title} · {r.status} · {r.feedback || "Awaiting feedback"}
                  </p>
                ))}
              <Timeline entries={t.history} />
              <Button
                variant="outline"
                onClick={() =>
                  downloadBlob(t.instructions, "text/plain", `${t.id}-instructions.txt`)
                }
              >
                Download instructions
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
const blank: ReportValues = {
  title: "",
  projectId: "",
  taskId: "",
  date: "2026-11-10",
  work: "",
  activities: "",
  progress: 0,
  results: "",
  challenges: "",
  hours: 0,
  comments: "",
  attachments: [],
};
export function TaskReports({ admin = false }: { admin?: boolean }) {
  const volunteer = usePortalActor(),
    manager = useDemoActor(),
    actor = admin ? manager : volunteer,
    s = usePortal();
  const [edit, setEdit] = useState<ReportValues | null>(null),
    [id, setId] = useState<string | undefined>(),
    [view, setView] = useState(""),
    [preview, setPreview] = useState(false),
    [feedback, setFeedback] = useState(""),
    [error, setError] = useState("");
  const rows = s.reports.filter((r) =>
      admin ? canOperate(s, actor, r.projectId, "taskReports.view") : r.volunteerId === actor.volunteerId,
    ),
    current = rows.find((r) => r.id === view);
  const save = (submit: boolean) => {
    if (!edit) return;
    try {
      setPortal(saveReport(getPortal(), actor, id, edit, submit, new Date().toISOString()));
      setEdit(null);
      toast.success(submit ? "Report submitted in demo memory" : "Draft saved in demo memory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot save");
    }
  };
  const open = (r?: Report) => {
    setId(r?.id);
    setEdit(r ? structuredClone(r) : { ...blank, date: new Date().toISOString().slice(0, 10) });
    setPreview(false);
    setError("");
  };
  return (
    <>
      <PageHeader
        title={admin ? "Task Report Reviews" : "My Task Reports"}
        action={!admin ? <Button onClick={() => open()}>New Report</Button> : undefined}
      />
      <DataTable
        columns={["Title", "Project", "Task", "Date", "Progress", "Status", "Actions"]}
        rows={rows.map((r) => [
          r.title,
          s.projects.find((p) => p.id === r.projectId)?.name,
          s.tasks.find((t) => t.id === r.taskId)?.title,
          r.date,
          `${r.progress}%`,
          <StatusBadge status={r.status} />,
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setView(r.id);
                setFeedback(r.feedback);
              }}
            >
              View report
            </Button>
            {!admin && ["Draft", "Changes Requested"].includes(r.status) && (
              <Button variant="outline" onClick={() => open(r)}>
                {r.status === "Draft" ? "Edit Draft" : "Revise & resubmit"}
              </Button>
            )}
          </div>,
        ])}
      />
      {rows.length === 0 && <p className="mt-4 text-muted-foreground">No task reports.</p>}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {edit && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {preview ? "Preview Report" : id ? "Edit Task Report" : "New Task Report"}
                </DialogTitle>
              </DialogHeader>
              <p>
                {actor.name} · {actor.volunteerId}
              </p>
              {preview ? (
                <ReportBody r={edit} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    Report title
                    <input
                      className={cls}
                      value={edit.title}
                      onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                    />
                  </label>
                  <label>
                    Report date
                    <input
                      type="date"
                      className={cls}
                      value={edit.date}
                      onChange={(e) => setEdit({ ...edit, date: e.target.value })}
                    />
                  </label>
                  <label>
                    Related project
                    <select
                      className={cls}
                      value={edit.projectId}
                      onChange={(e) => setEdit({ ...edit, projectId: e.target.value, taskId: "" })}
                    >
                      <option value="">Select project</option>
                      {scopedProjects(s, actor).map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Related task
                    <select
                      className={cls}
                      value={edit.taskId}
                      onChange={(e) => setEdit({ ...edit, taskId: e.target.value })}
                    >
                      <option value="">Select assigned task</option>
                      {ownTasks(s, actor.volunteerId ?? "")
                        .filter((t) => t.projectId === edit.projectId)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  {(
                    [
                      ["work", "Work performed"],
                      ["activities", "Activities completed"],
                      ["results", "Results and deliverables"],
                      ["challenges", "Challenges and difficulties"],
                      ["comments", "Additional comments"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="sm:col-span-2">
                      {label}
                      <textarea
                        className={cls}
                        value={edit[key]}
                        onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label>
                    Progress (%)
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={cls}
                      value={edit.progress}
                      onChange={(e) => setEdit({ ...edit, progress: Number(e.target.value) })}
                    />
                    <progress className="w-full accent-primary" max={100} value={edit.progress} />
                  </label>
                  <label>
                    Time spent (hours)
                    <input
                      type="number"
                      min={0}
                      step="0.25"
                      className={cls}
                      value={edit.hours}
                      onChange={(e) => setEdit({ ...edit, hours: Number(e.target.value) })}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    Optional attachments (10 MB per file)
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                      onChange={async (e) => {
                        try {
                          const files = Array.from(e.target.files ?? []);
                          files.forEach((f) => validateAttachment(f));
                          const additions = await Promise.all(
                            files.map(async (f) => ({
                              name: f.name,
                              mime: f.type,
                              size: f.size,
                              bytes: new Uint8Array(await f.arrayBuffer()),
                            })),
                          );
                          setEdit({ ...edit, attachments: [...edit.attachments, ...additions] });
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Invalid file");
                        }
                      }}
                    />
                  </label>
                  {edit.attachments.map((a, i) => (
                    <div key={`${a.name}-${i}`} className="flex items-center justify-between gap-2">
                      <span className="break-all">{a.name}</span>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setEdit({
                            ...edit,
                            attachments: edit.attachments.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {error && (
                <p role="alert" className="text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setPreview(!preview)}>
                  {preview ? "Back to edit" : "Preview Report"}
                </Button>
                <Button variant="outline" onClick={() => save(false)}>
                  Save Draft
                </Button>
                <Button onClick={() => save(true)}>Submit for Review</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!current} onOpenChange={(o) => !o && setView("")}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {current && (
            <>
              <DialogHeader>
                <DialogTitle>{current.title}</DialogTitle>
              </DialogHeader>
              <StatusBadge status={current.status} />
              <ReportBody r={current} />
              <Facts
                items={[
                  ["Reviewer", current.reviewer],
                  ["Review date", current.reviewedAt],
                  ["Feedback", current.feedback],
                ]}
              />
              <h3 className="font-bold">Previous versions</h3>
              {current.versions.map((v, i) => (
                <details key={i} className="border-b py-2">
                  <summary>
                    Version {i + 1} · {v.at}
                  </summary>
                  <ReportBody r={v.values} />
                </details>
              ))}
              <Timeline entries={current.history} />
              {admin && canOperate(s, actor, current.projectId, "taskReports.review") && ["Submitted for Review", "Under Review"].includes(current.status) && (
                <>
                  <label>
                    Admin feedback
                    <textarea
                      className={cls}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(["Under Review", "Changes Requested", "Accepted"] as const).map((d) => (
                      <Button
                        key={d}
                        variant={d === "Changes Requested" ? "outline" : "default"}
                        onClick={() =>
                          run(() =>
                            setPortal(
                              reviewReport(
                                getPortal(),
                                actor,
                                current.id,
                                d,
                                feedback,
                                new Date().toISOString(),
                              ),
                            ),
                          )
                        }
                      >
                        {d === "Under Review"
                          ? "Start report review"
                          : d === "Changes Requested"
                            ? "Request changes"
                            : "Accept report"}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function ReportBody({ r }: { r: ReportValues }) {
  return (
    <>
      <Facts
        items={[
          ["Title", r.title],
          ["Report date", r.date],
          ["Work performed", r.work],
          ["Activities", r.activities],
          ["Progress", `${r.progress}%`],
          ["Results", r.results],
          ["Challenges", r.challenges],
          ["Time spent", `${r.hours}h`],
          ["Comments", r.comments],
        ]}
      />
      {r.attachments.map((a, i) => (
        <Button
          key={i}
          variant="outline"
          onClick={() => downloadBlob(new Uint8Array(a.bytes), a.mime, a.name)}
        >
          Download {a.name}
        </Button>
      ))}
    </>
  );
}
export function PortalPerformance() {
  const actor = usePortalActor(),
    s = usePortal();
  return (
    <>
      <PageHeader title="My Performance" />
      {publishedReviews(s, actor)
        .map((r) => (
          <article key={r.id} className="mb-4 rounded-lg border bg-card p-5">
            <h2 className="mb-3 font-bold">
              {s.projects.find((p) => p.id === r.projectId)?.name} · {r.date}
            </h2>
            <PerformanceDetails review={r} project={s.projects.find(p => p.id === r.projectId)?.name ?? "—"} />
            <Button
              className="mt-4"
              disabled={!!r.acknowledgedAt}
              onClick={() =>
                run(() => {
                  setPortal(acknowledgePerformance(getPortal(), actor, r.id, new Date().toISOString()));
                })
              }
            >
              {r.acknowledgedAt ? "Acknowledged" : "Acknowledge review"}
            </Button>
          </article>
        ))}
    </>
  );
}
export function PortalNotifications() {
  const actor = usePortalActor(),
    s = usePortal();
  const rows = s.notifications.filter((n) => n.volunteerId === actor.volunteerId);
  return (
    <>
      <PageHeader
        title="Notifications"
        action={
          <Button onClick={() => run(() => setPortal(markRead(getPortal(), actor)))}>
            Mark All as Read
          </Button>
        }
      />
      {rows.map((n) => (
        <article
          key={n.id}
          className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b py-4"
        >
          <div>
            <h2 className="font-semibold">{n.title}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(n.at).toLocaleString("en-GB")} · {n.read ? "Read" : "Unread"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={n.page}>Open</Link>
            </Button>
            <Button
              variant="ghost"
              disabled={n.read}
              onClick={() => run(() => setPortal(markRead(getPortal(), actor, n.id)))}
            >
              Mark as Read
            </Button>
          </div>
        </article>
      ))}
    </>
  );
}
