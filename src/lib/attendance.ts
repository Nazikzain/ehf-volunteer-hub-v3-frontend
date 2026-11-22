import { calcHours } from "./hours";
import { hasPermission, type DemoRole } from "./demo-roles";
export const ATTENDANCE_STATUSES = [
  "Checked In",
  "Checked Out",
  "Present",
  "Absent",
  "Excused Absence",
] as const;
export const APPROVAL_STATUSES = ["Pending Approval", "Approved", "Rejected"] as const;
export type Actor = {
  role: DemoRole;
  accountId?: string;
  name: string;
  volunteerId?: string | undefined;
  projects: string[];
};
export type Correction = {
  at: string;
  by: string;
  reason: string;
  patch: Partial<Attendance>;
  status: "Pending" | "Approved" | "Rejected";
  decidedBy?: string | undefined;
  decidedAt?: string | undefined;
  feedback?: string | undefined;
  original?: Partial<Attendance> | undefined;
};
export type Attendance = {
  key: string;
  volunteerId: string;
  project: string;
  activity: string;
  taskId?: string;
  location: string;
  date: string;
  start: string;
  end: string;
  hours: number;
  type: "Automatic" | "Manual";
  attendance: (typeof ATTENDANCE_STATUSES)[number];
  approval: (typeof APPROVAL_STATUSES)[number];
  reason: string;
  comments: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: string | undefined;
  reviewedAt?: string | undefined;
  rejectionReason?: string | undefined;
  corrections: Correction[];
  original?: Partial<Attendance> | undefined;
};
export type AttendanceFilter = {
  query: string;
  from: string;
  to: string;
  project: string;
  attendance: string;
  approval: string;
  type: string;
  volunteerId: string;
};
export const EMPTY_FILTER: AttendanceFilter = {
  query: "",
  from: "",
  to: "",
  project: "",
  attendance: "",
  approval: "",
  type: "",
  volunteerId: "",
};
export const PORTAL_ACTOR: Actor = {
  role: "Volunteer",
  name: "Amina Hassan",
  volunteerId: "V-1042",
  projects: ["Community Wellbeing Programme", "Digital Skills Support"],
};
export const SCOPED_ADMIN_PROJECTS = ["Community Wellbeing Programme", "Health Awareness Sessions"];
export function visibleAttendance(rows: Attendance[], actor: Actor) {
  return rows.filter(
    (r) =>
      hasPermission(actor, "attendance.view", r.project) ||
      (actor.role === "Volunteer" && r.volunteerId === actor.volunteerId),
  );
}
export function canReview(actor: Actor, row: Pick<Attendance, "project" | "volunteerId">) {
  return (
    actor.volunteerId !== row.volunteerId &&
    hasPermission(actor, "hours.review", row.project)
  );
}
export function filterAttendance(
  rows: Attendance[],
  f: AttendanceFilter,
  names: Record<string, string> = {},
) {
  return rows.filter(
    (r) =>
      (!f.query ||
        `${r.volunteerId} ${names[r.volunteerId] ?? ""}`
          .toLowerCase()
          .includes(f.query.toLowerCase())) &&
      (!f.from || r.date >= f.from) &&
      (!f.to || r.date <= f.to) &&
      (!f.project || r.project === f.project) &&
      (!f.attendance || r.attendance === f.attendance) &&
      (!f.approval || r.approval === f.approval) &&
      (!f.type || r.type === f.type) &&
      (!f.volunteerId || r.volunteerId === f.volunteerId),
  );
}
export function selectedVolunteerAttendance(rows: Attendance[], volunteerId: string) {
  return volunteerId ? rows.filter((r) => r.volunteerId === volunteerId) : [];
}
export function totals(rows: Attendance[]) {
  const hours = (s: string) =>
    Math.round(rows.filter((r) => r.approval === s).reduce((n, r) => n + r.hours, 0) * 100) / 100;
  return {
    records: rows.length,
    present: new Set(
      rows
        .filter((r) => ["Present", "Checked In", "Checked Out"].includes(r.attendance))
        .map((r) => r.volunteerId),
    ).size,
    checkedIn: rows.filter((r) => r.attendance === "Checked In").length,
    checkedOut: rows.filter((r) => r.attendance === "Checked Out").length,
    absent: rows.filter((r) => ["Absent", "Excused Absence"].includes(r.attendance)).length,
    pending: rows.filter(
      (r) =>
        r.approval === "Pending Approval" && !["Absent", "Excused Absence"].includes(r.attendance),
    ).length,
    approvedHours: hours("Approved"),
    pendingHours: hours("Pending Approval"),
    rejectedHours: hours("Rejected"),
  };
}
export function overlaps(
  rows: Attendance[],
  v: string,
  start: string,
  end: string,
  except?: string,
) {
  const a = new Date(start).getTime(),
    b = end ? new Date(end).getTime() : Infinity;
  return rows.some(
    (r) =>
      r.key !== except &&
      r.volunteerId === v &&
      r.start &&
      a < (r.end ? new Date(r.end).getTime() : Infinity) &&
      b > new Date(r.start).getTime(),
  );
}
function fail(message: string): never {
  throw new Error(message);
}
export function checkIn(
  rows: Attendance[],
  actor: Actor,
  project: string,
  at: string,
  activity = "",
  location = "",
  comments = "",
): Attendance[] {
  if (actor.role !== "Volunteer" || !actor.volunteerId || !actor.projects.includes(project))
    fail("Select an assigned project");
  if (rows.some((r) => r.volunteerId === actor.volunteerId && r.attendance === "Checked In"))
    fail("You already have an active check-in");
  if (!Number.isFinite(new Date(at).getTime()) || overlaps(rows, actor.volunteerId, at, ""))
    fail("Invalid or overlapping check-in");
  return [
    ...rows,
    {
      key: crypto.randomUUID(),
      volunteerId: actor.volunteerId,
      project,
      activity,
      location,
      date: at.slice(0, 10),
      start: at,
      end: "",
      hours: 0,
      type: "Automatic",
      attendance: "Checked In",
      approval: "Pending Approval",
      reason: "",
      comments,
      submittedBy: actor.name,
      createdAt: at,
      updatedAt: at,
      corrections: [],
    },
  ];
}
export function checkOut(rows: Attendance[], actor: Actor, at: string): Attendance[] {
  const r = rows.find((r) => r.volunteerId === actor.volunteerId && r.attendance === "Checked In");
  if (actor.role !== "Volunteer" || !r) fail("No active check-in session");
  const hours = calcHours(r.start, at);
  if (hours === null) fail("Check-out must be after check-in");
  if (overlaps(rows, r.volunteerId, r.start, at, r.key)) fail("Attendance times overlap");
  return rows.map((x) =>
    x.key === r.key ? { ...r, end: at, hours, attendance: "Checked Out", updatedAt: at } : x,
  );
}
export function manualEntry(
  rows: Attendance[],
  actor: Actor,
  input: Pick<
    Attendance,
    "project" | "activity" | "location" | "start" | "end" | "reason" | "comments"
  > & { adjustedHours?: number; taskId?: string },
  at: string,
): Attendance[] {
  if (actor.role !== "Volunteer" || !actor.volunteerId || !actor.projects.includes(input.project))
    fail("Select an assigned project");
  if (!input.reason.trim()) fail("A reason for manual entry is required");
  const calculated = calcHours(input.start, input.end);
  if (calculated === null)
    fail("End must be after start (include the next date for overnight work)");
  const hours = input.adjustedHours ?? calculated;
  if (!Number.isFinite(hours) || hours <= 0 || hours > calculated)
    fail("Adjusted hours must be positive and cannot exceed the attendance duration");
  if (overlaps(rows, actor.volunteerId, input.start, input.end))
    fail("Attendance times overlap an existing record");
  const original = {
    volunteerId: actor.volunteerId,
    start: input.start,
    end: input.end,
    hours: calculated,
    project: input.project,
    activity: input.activity,
    taskId: input.taskId ?? "",
    location: input.location,
    reason: input.reason,
    comments: input.comments,
    submittedBy: actor.name,
    createdAt: at,
    type: "Manual" as const,
  };
  return [
    ...rows,
    {
      ...input,
      key: crypto.randomUUID(),
      volunteerId: actor.volunteerId,
      date: input.start.slice(0, 10),
      hours,
      type: "Manual",
      attendance: "Present",
      approval: "Pending Approval",
      submittedBy: actor.name,
      createdAt: at,
      updatedAt: at,
      original,
      corrections: [],
    },
  ];
}
export function reviewHours(
  rows: Attendance[],
  key: string,
  actor: Actor,
  decision: "Approved" | "Rejected",
  reason: string,
  comments: string,
  at: string,
): Attendance[] {
  const r = rows.find((r) => r.key === key);
  if (!r || !canReview(actor, r)) fail("You cannot review this attendance record");
  if (
    r.attendance === "Checked In" ||
    ["Absent", "Excused Absence"].includes(r.attendance) ||
    r.approval !== "Pending Approval"
  )
    fail("Only completed pending hours can be reviewed");
  if (decision === "Rejected" && !reason.trim()) fail("A rejection reason is required");
  return rows.map((x) =>
    x.key === key
      ? {
          ...r,
          approval: decision,
          rejectionReason: decision === "Rejected" ? reason.trim() : "",
          comments,
          reviewer: actor.name,
          reviewedAt: at,
          updatedAt: at,
        }
      : x,
  );
}
export function requestCorrection(
  rows: Attendance[],
  key: string,
  actor: Actor,
  patch: Partial<Attendance>,
  reason: string,
  at: string,
): Attendance[] {
  const r = rows.find((r) => r.key === key);
  if (!r || actor.role !== "Volunteer" || r.volunteerId !== actor.volunteerId)
    fail("You can request changes to your own records only");
  if (!reason.trim()) fail("A correction reason is required");
  if (r.corrections.some((c) => c.status === "Pending"))
    fail("A correction request is already pending");
  const safe = {
    start: patch.start ?? r.start,
    end: patch.end ?? r.end,
    project: patch.project ?? r.project,
    activity: patch.activity ?? r.activity,
    location: patch.location ?? r.location,
  };
  if (!actor.projects.includes(safe.project) || calcHours(safe.start, safe.end) === null)
    fail("Select an assigned project and valid times");
  return rows.map((x) =>
    x.key === key
      ? {
          ...r,
          updatedAt: at,
          corrections: [
            ...r.corrections,
            { at, by: actor.name, reason: reason.trim(), patch: safe, status: "Pending" },
          ],
        }
      : x,
  );
}
export function reviewCorrection(
  rows: Attendance[],
  key: string,
  index: number,
  actor: Actor,
  decision: "Approved" | "Rejected",
  feedback: string,
  at: string,
): Attendance[] {
  const r = rows.find((r) => r.key === key);
  const c = r?.corrections[index];
  if (!r || !c || !canReview(actor, r) || c.status !== "Pending")
    fail("Correction cannot be reviewed");
  if (decision === "Rejected" && !feedback.trim()) fail("A rejection reason is required");
  const changed = { ...r, ...c.patch };
  if (
    decision === "Approved" &&
    (!canReview(actor, changed) ||
      overlaps(rows, r.volunteerId, changed.start, changed.end, key) ||
      calcHours(changed.start, changed.end) === null)
  )
    fail("Correction is outside your scope or overlaps another record");
  return rows.map((x) =>
    x.key === key
      ? {
          ...(decision === "Approved"
            ? {
                ...changed,
                date: changed.start.slice(0, 10),
                hours: calcHours(changed.start, changed.end) ?? 0,
                attendance: "Present" as const,
                approval: "Pending Approval" as const,
                reviewer: undefined,
                reviewedAt: undefined,
                rejectionReason: "",
              }
            : r),
          original: r.original ?? {
            start: r.start,
            end: r.end,
            project: r.project,
            hours: r.hours,
            activity: r.activity,
            location: r.location,
          },
          updatedAt: at,
          corrections: r.corrections.map((item, i) =>
            i === index
              ? {
                  ...item,
                  status: decision,
                  decidedAt: at,
                  decidedBy: actor.name,
                  feedback,
                  original: {
                    start: r.start,
                    end: r.end,
                    hours: r.hours,
                    project: r.project,
                    activity: r.activity,
                    location: r.location,
                  },
                }
              : item,
          ),
        }
      : x,
  );
}
export function recordAbsence(
  rows: Attendance[],
  actor: Actor,
  volunteerId: string,
  project: string,
  date: string,
  status: "Absent" | "Excused Absence",
  reason: string,
  comments: string,
  at: string,
): Attendance[] {
  if (!hasPermission(actor, "attendance.manage", project) || !date || !reason.trim())
    fail("Select a volunteer, date, authorised project and absence reason");
  if (rows.some((r) => r.volunteerId === volunteerId && r.date === date && r.project === project))
    fail("An attendance record already exists for this date and project");
  return [
    ...rows,
    {
      key: crypto.randomUUID(),
      volunteerId,
      project,
      date,
      start: "",
      end: "",
      hours: 0,
      activity: "",
      location: "",
      type: "Manual",
      attendance: status,
      approval: "Pending Approval",
      reason,
      comments,
      submittedBy: actor.name,
      createdAt: at,
      updatedAt: at,
      corrections: [],
    },
  ];
}
