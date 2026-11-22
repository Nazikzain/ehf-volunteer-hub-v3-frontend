// Demo Mode application workflow — pure rules for the Lovable preview only.
// The PHP system will own the real workflow; these rules mirror the agreed behaviour.
import { hasPermission, type DemoIdentity } from "./demo-roles";
export const APPLICATION_STATUSES = ["Pending", "Under Review", "Accepted", "Rejected"] as const;
export type AppStatus = (typeof APPLICATION_STATUSES)[number];
export const AVAILABILITY_TYPES = ["Specific Days of the Week", "Flexible"] as const;
export type AvailabilityType = (typeof AVAILABILITY_TYPES)[number];
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type HistoryEntry = { at: string; by: string; action: string; note?: string };
export type Applicant = {
  name: string; email: string; phone: string; address: string; postcode: string; nationality: string; language: string;
  skills: string; availabilityType: AvailabilityType; availabilityDays: string[];
};
export type Application = Applicant & {
  ref: string; date: string; interest: string; status: AppStatus;
  decisionDate?: string; decidedBy?: string; rejectionReason?: string;
  reviewer?: string; reviewStartedAt?: string;
  notes: HistoryEntry[]; history: HistoryEntry[]; volunteerId?: string;
};
export type Volunteer = Applicant & {
  id: string; applicationRef?: string; languages: string; hours: number; pendingHours: number;
  startDate: string; endDate?: string; status: string;
};
export type WorkflowState = { applications: Application[]; volunteers: Volunteer[] };
export type Result = { ok: true; state: WorkflowState; createdVolunteerId?: string } | { ok: false; error: string };

// Allowed moves: Pending → Under Review; Under Review → Accepted/Rejected. Decisions are final.
const NEXT: Record<AppStatus, AppStatus[]> = { Pending: ["Under Review"], "Under Review": ["Accepted", "Rejected"], Accepted: [], Rejected: [] };
export const allowedNext = (s: AppStatus) => NEXT[s];

export function validateAvailability(type: string, days: string[]): string | null {
  if (!(AVAILABILITY_TYPES as readonly string[]).includes(type)) return "Please select your availability";
  if (type === "Specific Days of the Week" && days.length === 0) return "Please select at least one day you are available";
  return null;
}
export function setAvailabilityType(type: AvailabilityType, days: string[]): string[] {
  return type === "Flexible" ? [] : days; // Flexible clears any previous weekday selection
}

function nextVolunteerId(vols: Volunteer[]): string {
  const max = vols.reduce((m, v) => Math.max(m, Number(v.id.replace(/\D/g, "")) || 0), 1000);
  return `V-${max + 1}`;
}

export function changeStatus(state: WorkflowState, ref: string, to: AppStatus, actor: string, at: string, opts: { reason?: string; role?: string; accountId?: string; actor?: DemoIdentity } = {}): Result {
  const identity = opts.actor ?? { role: opts.role ?? "", accountId: opts.accountId };
  if (!hasPermission(identity, to === "Under Review" ? "applications.review" : "applications.decide")) return { ok: false, error: "Application permission denied" };
  const app = state.applications.find((a) => a.ref === ref);
  if (!app) return { ok: false, error: "Application not found" };
  if (!NEXT[app.status].includes(to)) return { ok: false, error: `Cannot change status from ${app.status} to ${to}` };
  const reason = opts.reason?.trim() ?? "";
  if (to === "Rejected" && !reason) return { ok: false, error: "A rejection reason is required" };
  const decided = to === "Accepted" || to === "Rejected";
  let volunteers = state.volunteers;
  let createdVolunteerId: string | undefined;
  let volunteerId = app.volunteerId;
  const history: HistoryEntry[] = [...app.history, { at, by: actor, action: `Status changed to ${to}`, ...(reason ? { note: reason } : {}) }];
  if (to === "Accepted") {
    const existing = volunteers.find((v) => v.applicationRef === ref || v.email.toLowerCase() === app.email.toLowerCase());
    if (existing) { volunteerId = existing.id; if (!existing.applicationRef) volunteers = volunteers.map((v) => v.id === existing.id ? { ...v, applicationRef: ref } : v); history.push({ at, by: "System", action: `Linked to existing volunteer profile ${existing.id}` }); }
    else {
      const { ref: _r, date: _d, interest: _i, status: _s, notes: _n, history: _h, decisionDate: _dd, decidedBy: _db, rejectionReason: _rr, volunteerId: _v, ...applicant } = app;
      volunteerId = createdVolunteerId = nextVolunteerId(volunteers);
      volunteers = [{ ...applicant, id: volunteerId, applicationRef: ref, languages: app.language, hours: 0, pendingHours: 0, startDate: at.slice(0, 11).trim(), status: "Active" }, ...volunteers];
      history.push({ at, by: "System", action: `Volunteer profile ${volunteerId} created` });
    }
  }
  const updated: Application = { ...app, status: to, history, ...(to === "Under Review" ? { reviewer: actor, reviewStartedAt: at } : {}), ...(decided ? { decisionDate: at, decidedBy: actor } : {}), ...(to === "Rejected" ? { rejectionReason: reason } : {}), ...(volunteerId ? { volunteerId } : {}) };
  return { ok: true, state: { volunteers, applications: state.applications.map((a) => (a.ref === ref ? updated : a)) }, ...(createdVolunteerId ? { createdVolunteerId } : {}) };
}

export function addNote(state: WorkflowState, ref: string, actor: string, at: string, text: string, identity?: DemoIdentity): Result {
  if (!identity || !hasPermission(identity, "applications.review")) return { ok: false, error: "Application permission denied" };
  if (!text.trim()) return { ok: false, error: "Note cannot be empty" };
  if (!state.applications.some((a) => a.ref === ref)) return { ok: false, error: "Application not found" };
  return { ok: true, state: { ...state, applications: state.applications.map((a) => a.ref === ref ? { ...a, notes: [...a.notes, { at, by: actor, action: "Internal note", note: text.trim() }], history: [...a.history, { at, by: actor, action: "Internal review note added" }] } : a) } };
}
