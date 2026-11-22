import { useSyncExternalStore } from "react";
import { hasPermission, type Permission } from "./demo-roles";
import type { Actor } from "./attendance";
import type { Volunteer } from "./volunteer-workflow";
export const PROJECT_STATUSES = ["Planned", "Active", "Completed", "On Hold", "Cancelled"] as const;
export const TASK_STATUSES = [
  "Not Started",
  "In Progress",
  "Submitted for Review",
  "Completed",
  "Overdue",
  "Cancelled",
] as const;
export const REPORT_STATUSES = [
  "Draft",
  "Submitted for Review",
  "Under Review",
  "Changes Requested",
  "Accepted",
] as const;
export type Project = {
  id: string;
  name: string;
  description: string;
  objectives: string;
  start: string;
  end: string;
  status: (typeof PROJECT_STATUSES)[number];
  supervisor: string;
  activities: string[];
};
export type Assignment = {
  id: string;
  volunteerId: string;
  projectId: string;
  role: string;
  date: string;
  status: "Active" | "Completed";
  history: Event[];
};
export type Event = { at: string; by: string; action: string };
export type Task = {
  id: string;
  volunteerId: string;
  projectId: string;
  title: string;
  description: string;
  instructions: string;
  deliverables: string;
  assignedBy: string;
  assignedAt: string;
  start: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: (typeof TASK_STATUSES)[number];
  progress: number;
  notes: string;
  completionDate: string;
  history: Event[];
};
export type Attachment = { name: string; mime: string; size: number; bytes: Uint8Array };
export type ReportValues = {
  title: string;
  projectId: string;
  taskId: string;
  date: string;
  work: string;
  activities: string;
  progress: number;
  results: string;
  challenges: string;
  hours: number;
  comments: string;
  attachments: Attachment[];
};
export type Report = ReportValues & {
  id: string;
  volunteerId: string;
  status: (typeof REPORT_STATUSES)[number];
  feedback: string;
  reviewer: string;
  reviewedAt: string;
  versions: { at: string; values: ReportValues }[];
  history: Event[];
};
export type Performance = {
  id: string;
  volunteerId: string;
  projectId: string;
  date: string;
  reviewer: string;
  ratings: number[];
  strengths: string;
  improvements: string;
  comments: string;
  recommendations: string;
  acknowledgedAt: string;
  status?: "Draft" | "Published";
  published?: PerformanceValues;
  versions?: { at: string; values: PerformanceValues }[];
  history?: Event[];
};
export type PerformanceValues = Pick<Performance, "volunteerId" | "projectId" | "date" | "reviewer" | "ratings" | "strengths" | "improvements" | "comments" | "recommendations">;
export type Notification = {
  id: string;
  volunteerId: string;
  title: string;
  at: string;
  page: string;
  projectId: string;
  taskId: string;
  read: boolean;
};
export type Completion = {
  volunteerId: string;
  start: string;
  end: string;
  completed: boolean;
  approvedBy: string;
  at: string;
};
export type PortalState = {
  projects: Project[];
  assignments: Assignment[];
  tasks: Task[];
  reports: Report[];
  performance: Performance[];
  notifications: Notification[];
  completions: Completion[];
  events: (Event & { volunteerId: string })[];
};
const at = "2026-11-01T10:00:00.000Z";
const projectNames = [
  "Community Wellbeing Programme",
  "Digital Skills Support",
  "Health Awareness Sessions",
  "Carers Support Network",
];
const projects: Project[] = projectNames.map((name, i) => ({
  id: `P-${i + 1}`,
  name,
  description: "Synthetic community support programme for local residents.",
  objectives: "Improve access to community resources and build practical skills.",
  start: "2026-09-01",
  end: "2026-12-31",
  status: i === 3 ? "Completed" : "Active",
  supervisor: i === 1 ? "Mark Taylor" : "Sarah Ahmed",
  activities: ["Community workshop · 2026-11-20", "Volunteer support session · 2026-11-27"],
}));
const assignment = (
  id: string,
  volunteerId: string,
  projectId: string,
  status: "Active" | "Completed" = "Active",
): Assignment => ({
  id,
  volunteerId,
  projectId,
  role: "Community support",
  date: "2026-09-01",
  status,
  history: [{ at, by: "Demo Primary Administrator", action: "Project assigned" }],
});
const assignments = [
  assignment("A-501", "V-1042", "P-1"),
  assignment("A-505", "V-1042", "P-2"),
  assignment("A-506", "V-1042", "P-3"),
  assignment("A-507", "V-1042", "P-4", "Completed"),
  assignment("A-502", "V-1038", "P-3"),
  assignment("A-508", "V-1015", "P-1"),
  assignment("A-503", "V-1031", "P-2"),
  assignment("A-509", "V-1027", "P-3"),
  assignment("A-504", "V-1019", "P-4", "Completed"),
];
const task = (
  id: string,
  volunteerId: string,
  projectId: string,
  title: string,
  status: Task["status"],
  progress: number,
): Task => ({
  id,
  volunteerId,
  projectId,
  title,
  status,
  progress,
  description: "Prepare and deliver the assigned community support work.",
  instructions:
    "Review the briefing, complete the work, and submit a report describing the deliverables.",
  deliverables: "Session notes and a completed activity summary",
  assignedBy: "Demo Sarah Ahmed",
  assignedAt: "2026-09-02",
  start: "2026-09-03",
  due: status === "Overdue" ? "2026-10-30" : "2026-11-30",
  priority: "Medium",
  notes: "",
  completionDate: status === "Completed" ? "2026-10-28" : "",
  history: [{ at, by: "Demo Primary Administrator", action: "Task assigned" }],
});
const tasks = [
  task("T-1", "V-1042", "P-1", "Prepare workshop materials", "In Progress", 40),
  task("T-2", "V-1042", "P-2", "Digital support session", "Not Started", 0),
  task("T-3", "V-1042", "P-3", "Health leaflet summary", "Submitted for Review", 100),
  task("T-4", "V-1042", "P-1", "Community session notes", "Completed", 100),
  task("T-5", "V-1042", "P-3", "Follow-up calls", "Overdue", 20),
  task("T-6", "V-1042", "P-4", "Archived outreach activity", "Cancelled", 0),
  task("T-7", "V-1038", "P-3", "Translate health leaflet", "In Progress", 60),
  task("T-8", "V-1015", "P-1", "Support community event", "Completed", 100),
  task("T-9", "V-1031", "P-2", "Computer workshop", "In Progress", 50),
];
const values = (t: Task): ReportValues => ({
  title: `${t.title} report`,
  projectId: t.projectId,
  taskId: t.id,
  date: "2026-11-01",
  work: "Prepared demonstration resources.",
  activities: "Community session preparation",
  progress: t.progress,
  results: "Draft materials completed",
  challenges: "Feedback requested on format",
  hours: 2,
  comments: "Synthetic report",
  attachments: [],
});
const reports: Report[] = tasks
  .slice(0, 4)
  .map((t, i) => ({
    ...values(t),
    id: `RP-${i + 1}`,
    volunteerId: t.volunteerId,
    status:
      (["Draft", "Changes Requested", "Submitted for Review", "Accepted"] as const)[i] ?? "Draft",
    feedback: i === 1 ? "Please add the session outcomes." : "Demonstration feedback",
    reviewer: i === 1 || i === 3 ? "Demo Sarah Ahmed" : "",
    reviewedAt: at,
    versions: [{ at, values: values(t) }],
    history: [{ at, by: "Demo volunteer", action: "Report created" }],
  }));
export const initialPortal: PortalState = {
  projects,
  assignments,
  tasks,
  reports,
  performance: [
    {
      id: "PR-1",
      volunteerId: "V-1042",
      projectId: "P-1",
      date: "2026-10-28",
      reviewer: "Demo Sarah Ahmed",
      ratings: [4, 4, 5, 4, 4],
      strengths: "Reliable and considerate community support.",
      improvements: "Submit session summaries promptly.",
      comments: "Good contribution across the programme.",
      recommendations: "Develop workshop facilitation skills.",
      acknowledgedAt: "",
    },
    {
      id: "PR-2",
      volunteerId: "V-1015",
      projectId: "P-1",
      date: "2026-10-31",
      reviewer: "Demo Sarah Ahmed",
      ratings: [5, 4, 5, 5, 4],
      strengths: "Consistent contribution.",
      improvements: "Continue developing confidence.",
      comments: "Volunteering period completed successfully.",
      recommendations: "Maintain community involvement.",
      acknowledgedAt: "",
    },
  ],
  notifications: assignments.map((a, i) => ({
    id: `N-${i}`,
    volunteerId: a.volunteerId,
    title: "Project assignment confirmed (demo)",
    at,
    page: "/portal/projects",
    projectId: a.projectId,
    taskId: "",
    read: false,
  })),
  completions: [
    {
      volunteerId: "V-1015",
      start: "2026-09-01",
      end: "2026-10-31",
      completed: true,
      approvedBy: "Demo Primary Administrator",
      at,
    },
  ],
  events: assignments.map((a) => ({
    volunteerId: a.volunteerId,
    at,
    by: "Demo Primary Administrator",
    action: "Project assigned",
  })),
};
let state = structuredClone(initialPortal);
const listeners = new Set<() => void>();
export const getPortal = () => state;
export function setPortal(next: PortalState) {
  state = next;
  listeners.forEach((f) => f());
}
export const usePortal = () =>
  useSyncExternalStore(
    (f) => {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    () => state,
    () => state,
  );
export function ownAssignments(s: PortalState, id: string) {
  return s.assignments.filter((a) => a.volunteerId === id);
}
export function scopedProjects(s: PortalState, actor: Actor) {
  return s.projects.filter(
    (p) =>
hasPermission(actor, "projects.view", p.name) ||
      (actor.role === "Volunteer" &&
        s.assignments.some((a) => a.volunteerId === actor.volunteerId && a.projectId === p.id)),
  );
}
export function canOperate(s: PortalState, actor: Actor, projectId: string, permission: Permission = "projects.view") {
  const p = s.projects.find((p) => p.id === projectId);
  return (
    !!p &&
    hasPermission(actor, permission, p.name)
  );
}
export function ownTasks(s: PortalState, id: string) {
  return s.tasks.filter(
    (t) =>
      t.volunteerId === id &&
      s.assignments.some((a) => a.volunteerId === id && a.projectId === t.projectId),
  );
}
export function requireTask(s: PortalState, actor: Actor, id: string) {
  const t = ownTasks(s, actor.volunteerId ?? "").find((t) => t.id === id);
  if (actor.role !== "Volunteer" || !t) throw new Error("Select your assigned task");
  return t;
}
export function event(
  s: PortalState,
  id: string,
  actor: string,
  action: string,
  page: string,
  at: string,
): PortalState {
  return {
    ...s,
    events: [...s.events, { volunteerId: id, by: actor, action, at }],
    notifications: [
      ...s.notifications,
      {
        id: crypto.randomUUID(),
        volunteerId: id,
        title: action,
        at,
        page,
        projectId: "",
        taskId: "",
        read: false,
      },
    ],
  };
}
export function updateTask(
  s: PortalState,
  actor: Actor,
  id: string,
  progress: number,
  notes: string,
  submit: boolean,
  at: string,
): PortalState {
  const t = requireTask(s, actor, id);
  if (["Completed", "Cancelled", "Submitted for Review"].includes(t.status))
    throw new Error("This task is not editable");
  if (!Number.isFinite(progress) || progress < 0 || progress > 100)
    throw new Error("Progress must be between 0 and 100");
  const action = submit ? "Task submitted for review" : "Task progress updated";
  return event(
    {
      ...s,
      tasks: s.tasks.map((x) =>
        x.id === id
          ? {
              ...t,
              progress,
              notes,
              status: submit ? "Submitted for Review" : "In Progress",
              history: [...t.history, { at, by: actor.name, action }],
            }
          : x,
      ),
    },
    t.volunteerId,
    actor.name,
    action,
    "/portal/tasks",
    at,
  );
}
export function approveTask(s: PortalState, actor: Actor, id: string, at: string) {
  const t = s.tasks.find((t) => t.id === id);
  if (!t || !canOperate(s, actor, t.projectId, "tasks.approve"))
    throw new Error("Task is outside your review scope");
  if (t.status !== "Submitted for Review") throw new Error("Only submitted tasks can be completed");
  return event(
    {
      ...s,
      tasks: s.tasks.map((x) =>
        x.id === id
          ? {
              ...t,
              status: "Completed",
              progress: 100,
              completionDate: at.slice(0, 10),
              history: [...t.history, { at, by: actor.name, action: "Task completion approved" }],
            }
          : x,
      ),
    },
    t.volunteerId,
    actor.name,
    "Task completion approved",
    "/portal/tasks",
    at,
  );
}
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export function validateAttachment(a: Pick<Attachment, "name" | "size">) {
  if (!/\.(pdf|docx|xlsx|jpg|jpeg|png)$/i.test(a.name))
    throw new Error("Use PDF, DOCX, XLSX, JPG or PNG");
  if (a.size > MAX_ATTACHMENT_BYTES || a.size <= 0)
    throw new Error("Attachments must be between 1 byte and 10 MB");
}
export function saveReport(
  s: PortalState,
  actor: Actor,
  id: string | undefined,
  v: ReportValues,
  submit: boolean,
  at: string,
): PortalState {
  const t = requireTask(s, actor, v.taskId);
  if (t.projectId !== v.projectId) throw new Error("Task must belong to the selected project");
  if (!v.title.trim() || !v.date) throw new Error("Report title and date are required");
  if (
    !Number.isFinite(v.progress) ||
    v.progress < 0 ||
    v.progress > 100 ||
    !Number.isFinite(v.hours) ||
    v.hours < 0
  )
    throw new Error("Use progress 0–100 and non-negative time spent");
  if (submit && (!v.work.trim() || !v.activities.trim() || !v.results.trim()))
    throw new Error("Work performed, activities and results are required for submission");
  v.attachments.forEach(validateAttachment);
  const old = id ? s.reports.find((r) => r.id === id) : undefined;
  if (id && (!old || old.volunteerId !== actor.volunteerId)) throw new Error("Report not found");
  if (old && !["Draft", "Changes Requested"].includes(old.status))
    throw new Error("Submitted reports cannot be silently edited");
  const action = submit
    ? old?.status === "Changes Requested"
      ? "Report resubmitted"
      : "Report submitted for review"
    : "Report draft saved";
  const r: Report = {
    ...v,
    id: old?.id ?? crypto.randomUUID(),
    volunteerId: t.volunteerId,
    status: submit ? "Submitted for Review" : "Draft",
    feedback: old?.feedback ?? "",
    reviewer: old?.reviewer ?? "",
    reviewedAt: old?.reviewedAt ?? "",
    versions: submit
      ? [...(old?.versions ?? []), { at, values: structuredClone(v) }]
      : (old?.versions ?? []),
    history: [...(old?.history ?? []), { at, by: actor.name, action }],
  };
  return event(
    { ...s, reports: [...s.reports.filter((x) => x.id !== r.id), r] },
    t.volunteerId,
    actor.name,
    action,
    "/portal/task-reports",
    at,
  );
}
export function reviewReport(
  s: PortalState,
  actor: Actor,
  id: string,
  decision: "Under Review" | "Changes Requested" | "Accepted",
  feedback: string,
  at: string,
) {
  const r = s.reports.find((r) => r.id === id);
  if (!r || !canOperate(s, actor, r.projectId, "taskReports.review"))
    throw new Error("Report is outside your review scope");
  if (!["Submitted for Review", "Under Review"].includes(r.status))
    throw new Error("Report cannot be reviewed");
  if (decision === "Changes Requested" && !feedback.trim())
    throw new Error("Feedback is required when requesting changes");
  const action = `Report ${decision.toLowerCase()}`;
  const task = s.tasks.find((t) => t.id === r.taskId);
  return event(
    {
      ...s,
      reports: s.reports.map((x) =>
        x.id === id
          ? {
              ...r,
              status: decision,
              feedback: feedback.trim(),
              reviewer: actor.name,
              reviewedAt: at,
              history: [...r.history, { at, by: actor.name, action }],
            }
          : x,
      ),
      tasks: s.tasks.map((t) =>
        t.id === task?.id
          ? {
              ...t,
              history: [...t.history, { at, by: actor.name, action }],
              ...(decision === "Changes Requested" && t.status !== "Completed"
                ? { status: "In Progress" as const }
                : {}),
            }
          : t,
      ),
    },
    r.volunteerId,
    actor.name,
    action,
    "/portal/task-reports",
    at,
  );
}
export function assign(
  s: PortalState,
  actor: Actor,
  volunteer: Volunteer,
  projectId: string,
  role: string,
  at: string,
) {
  if (!canOperate(s, actor, projectId, "assignments.manage")) throw new Error("Project is outside your assignment scope");
  if (!hasPermission(actor, "volunteers.view") && !s.assignments.some(a => a.volunteerId === volunteer.id && canOperate(s, actor, a.projectId, "volunteers.view"))) throw new Error("Volunteer outside scope");
  if (
    s.assignments.some(
      (a) => a.volunteerId === volunteer.id && a.projectId === projectId && a.status === "Active",
    )
  )
    throw new Error("This volunteer is already assigned");
  if (!role.trim()) throw new Error("Responsibility is required");
  const a = assignment(crypto.randomUUID(), volunteer.id, projectId);
  return event(
    { ...s, assignments: [...s.assignments, { ...a, role, date: at.slice(0, 10) }] },
    volunteer.id,
    actor.name,
    "New project assignment",
    "/portal/projects",
    at,
  );
}
export function markRead(s: PortalState, actor: Actor, id?: string) {
  if (actor.role !== "Volunteer" || !actor.volunteerId)
    throw new Error("Volunteer session required");
  return {
    ...s,
    notifications: s.notifications.map((n) =>
      n.volunteerId === actor.volunteerId && (!id || n.id === id) ? { ...n, read: true } : n,
    ),
  };
}
