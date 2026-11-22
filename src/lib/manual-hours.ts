import { z } from "zod";
import { calcHours } from "./hours";
import { manualEntry, type Actor, type Attendance } from "./attendance";
import type { PortalState } from "./portal-workflow";

const schema = z.object({
  projectId: z.string().trim().min(1, "Select an active assigned project").max(100),
  taskId: z.string().trim().max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a start time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter an end time"),
  overnight: z.boolean(),
  location: z.string().trim().max(200),
  activity: z.string().trim().max(1000),
  reason: z.string().trim().min(1, "Reason / Comments is required").max(1000),
});
export type ManualHoursValues = z.infer<typeof schema>;
export function activeHoursProjects(s: PortalState, actor: Actor) {
  return s.projects.filter(p => p.status === "Active" && s.assignments.some(a =>
    a.volunteerId === actor.volunteerId && a.projectId === p.id && a.status === "Active"));
}
export function manualHoursTimes(date: string, startTime: string, endTime: string, overnight: boolean) {
  const day = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime))
    throw new Error("Enter a valid date, start time and end time");
  if (overnight) day.setUTCDate(day.getUTCDate() + 1);
  const start = `${date}T${startTime}`;
  const end = `${day.toISOString().slice(0, 10)}T${endTime}`;
  const hours = calcHours(start, end);
  if (hours === null || hours <= 0) throw new Error("End time must be after start time");
  return { start, end, hours };
}
export function submitManualHours(rows: Attendance[], s: PortalState, actor: Actor, raw: ManualHoursValues, at: string) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the hours entry");
  const input = parsed.data;
  const project = activeHoursProjects(s, actor).find(p => p.id === input.projectId);
  if (actor.role !== "Volunteer" || !actor.volunteerId || !project)
    throw new Error("Select an active assigned project");
  if (input.taskId && !s.tasks.some(t => t.id === input.taskId && t.projectId === project.id && t.volunteerId === actor.volunteerId))
    throw new Error("Select one of your tasks from the selected project");
  if (!Number.isFinite(new Date(at).getTime())) throw new Error("Invalid submission date");
  const times = manualHoursTimes(input.date, input.startTime, input.endTime, input.overnight);
  return manualEntry(rows, { ...actor, projects: [project.name] }, {
    project: project.name, activity: input.activity, taskId: input.taskId,
    location: input.location, start: times.start, end: times.end, reason: input.reason, comments: "",
  }, at);
}