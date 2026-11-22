// Synthetic preview authorisation only. PHP remains the production security boundary.
import { useSyncExternalStore } from "react";
export const DEMO_ROLES = ["Technical System Administrator", "Admin", "Volunteer"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];
export const DEFAULT_DEMO_ROLE: DemoRole = "Admin";
export const PERMISSIONS = [
  "applications.view", "applications.manage", "applications.review", "applications.decide",
  "volunteers.view", "volunteers.edit", "notes.view", "notes.write",
  "projects.view", "projects.manage", "projects.create", "projects.edit", "assignments.view", "assignments.manage", "admins.assign",
  "tasks.view", "tasks.manage", "tasks.create", "tasks.assign", "tasks.approve", "progress.view",
  "activities.view", "activities.manage", "taskReports.view", "taskReports.review",
  "attendance.view", "attendance.manage", "hours.review",
  "performance.view", "performance.write", "performance.publish",
  "certificates.view", "certificates.manage", "reports.view", "reports.export", "periods.manage",
  "training.view", "training.manage", "trainingTypes.manage", "announcements.view", "announcements.manage", "notifications.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export type DemoIdentity = { role: string; accountId?: string | undefined; name?: string; projects?: string[] };
export type PermissionGrant = { id: string; accountId: string; permission: Permission; project: string; at: string; by: string; revokedAt?: string };
export type DemoAccount = { id: string; name: string; email: string; role: DemoRole; lastLogin: string; status: string };
export type PermissionAudit = { at: string; by: string; action: string; accountId: string; permission?: Permission; project?: string };
export type AdminAccessState = { accounts: DemoAccount[]; grants: PermissionGrant[]; assignments: { accountId: string; project: string; by: string; at: string }[]; history: PermissionAudit[] };
export const initialAdminAccess: AdminAccessState = {
  accounts: [
    { id: "U-01", name: "Demo Tech Admin", email: "tech.admin@demo.invalid", role: "Technical System Administrator", lastLogin: "10 Nov 2026", status: "Active" },
    { id: "U-02", name: "Demo Admin", email: "primary.admin@demo.invalid", role: "Admin", lastLogin: "10 Nov 2026", status: "Active" },
    { id: "U-03", name: "Sarah Ahmed", email: "sarah.a@demo.invalid", role: "Admin", lastLogin: "08 Nov 2026", status: "Active" },
    { id: "U-04", name: "Mark Taylor", email: "mark.t@demo.invalid", role: "Admin", lastLogin: "02 Nov 2026", status: "Inactive" },
    { id: "U-05", name: "Amina Hassan", email: "amina.h@demo.invalid", role: "Volunteer", lastLogin: "09 Nov 2026", status: "Active" },
  ],
  grants: [], assignments: [], history: [],
};
// Explicit review fixture grants; these are not defaults for new accounts.
initialAdminAccess.grants = PERMISSIONS.map((permission, i) => ({ id: `fixture-all-${i}`, accountId: "U-02", permission, project: "", by: "U-01", at: "2026-11-11T16:03:00Z" }));
for (const project of ["Community Wellbeing Programme", "Health Awareness Sessions"]) {
  for (const permission of ["volunteers.view", "projects.view", "assignments.view", "assignments.manage", "tasks.view", "tasks.create", "tasks.assign", "tasks.approve", "progress.view", "taskReports.view", "taskReports.review", "attendance.view", "attendance.manage", "hours.review", "performance.view", "performance.write", "performance.publish", "reports.view", "reports.export"] as Permission[]) {
    initialAdminAccess.grants.push({ id: `fixture-scoped-${project}-${permission}`, accountId: "U-03", permission, project, by: "U-01", at: "2026-11-11T16:03:00Z" });
  }
}
let state = structuredClone(initialAdminAccess);
const listeners = new Set<() => void>();
export const getAdminAccess = () => state;
export function setAdminAccess(next: AdminAccessState) { state = next; listeners.forEach(f => f()); }
export const useAdminAccess = () => useSyncExternalStore(f => { listeners.add(f); return () => { listeners.delete(f); }; }, () => state, () => initialAdminAccess);
export function hasPermission(actor: DemoIdentity, permission: Permission, project?: string, source = state): boolean {
  if (actor.role !== "Admin" || !actor.accountId || !PERMISSIONS.includes(permission)) return false;
  const account = source.accounts.find(a => a.id === actor.accountId);
  if (account?.role !== "Admin" || account.status !== "Active") return false;
  const dependency = VIEW_DEPENDENCIES[permission];
  if (dependency && !hasPermission(actor, dependency, project, source)) return false;
  return source.grants.some(g => g.accountId === actor.accountId && g.permission === permission && !g.revokedAt && (!g.project || (project !== undefined && g.project === project)));
}
export function anyPermission(actor: DemoIdentity, permission: Permission, source = state) {
  return hasPermission(actor, permission, undefined, source) || source.grants.some(g => g.permission === permission && !!g.project && hasPermission(actor, permission, g.project, source));
}
export function requirePermission(actor: DemoIdentity, permission: Permission, project?: string) {
  if (!hasPermission(actor, permission, project)) throw new Error("Permission denied: outside your authorised scope");
}
export function isTechnical(actor: DemoIdentity, source = state) {
  return actor.role === "Technical System Administrator" && source.accounts.some(a => a.id === actor.accountId && a.role === actor.role && a.status === "Active");
}
function technical(actor: DemoIdentity, s: AdminAccessState) { if (!isTechnical(actor, s)) throw new Error("Technical System Administrator required"); }
const VIEW_DEPENDENCIES: Partial<Record<Permission, Permission>> = {
  "applications.manage": "applications.view", "applications.review": "applications.view", "applications.decide": "applications.view",
  "volunteers.edit": "volunteers.view", "notes.write": "notes.view", "projects.manage": "projects.view", "projects.create": "projects.view", "projects.edit": "projects.view",
  "assignments.manage": "assignments.view", "admins.assign": "projects.view", "tasks.manage": "tasks.view", "tasks.create": "tasks.view", "tasks.assign": "tasks.view", "tasks.approve": "tasks.view",
  "activities.manage": "activities.view", "taskReports.review": "taskReports.view", "attendance.manage": "attendance.view", "hours.review": "attendance.view",
  "performance.write": "performance.view", "performance.publish": "performance.view", "certificates.manage": "certificates.view", "reports.export": "reports.view",
  "training.manage": "training.view", "announcements.manage": "announcements.view",
};
export function grantPermission(s: AdminAccessState, actor: DemoIdentity, accountId: string, permission: Permission, project: string, at: string): AdminAccessState {
  technical(actor, s);
  if (!PERMISSIONS.includes(permission) || !s.accounts.some(a => a.id === accountId && a.role === "Admin")) throw new Error("Select an Admin and operational permission");
  if (project && ["applications.view", "applications.manage", "applications.review", "applications.decide", "projects.create", "certificates.view", "certificates.manage", "periods.manage", "trainingTypes.manage"].includes(permission)) throw new Error("This permission requires organisation-wide scope");
  const dependency = VIEW_DEPENDENCIES[permission];
  if (dependency && !hasPermission({ role: "Admin", accountId }, dependency, project || undefined, { ...s, accounts: s.accounts.map(a => a.id === accountId ? { ...a, status: "Active" } : a) })) throw new Error(`Grant ${dependency} for this scope first`);
  if (s.grants.some(g => g.accountId === accountId && g.permission === permission && g.project === project && !g.revokedAt)) throw new Error("Permission already granted");
  const by = actor.accountId ?? "";
  return { ...s, grants: [...s.grants, { id: crypto.randomUUID(), accountId, permission, project, by, at }], history: [...s.history, { at, by, accountId, permission, project, action: "Permission granted" }] };
}
export function revokePermission(s: AdminAccessState, actor: DemoIdentity, id: string, at: string): AdminAccessState {
  technical(actor, s);
  const grant = s.grants.find(g => g.id === id && !g.revokedAt);
  if (!grant) throw new Error("Active grant not found");
  return { ...s, grants: s.grants.map(g => g.id === id ? { ...g, revokedAt: at } : g), history: [...s.history, { at, by: actor.accountId ?? "", accountId: grant.accountId, permission: grant.permission, project: grant.project, action: "Permission revoked" }] };
}
export function saveDemoAccount(s: AdminAccessState, actor: DemoIdentity, account: DemoAccount, at: string): AdminAccessState {
  technical(actor, s);
  if (!DEMO_ROLES.includes(account.role) || !account.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(account.email)) throw new Error("Valid account details required");
  const old = s.accounts.find(a => a.id === account.id);
  if (old && old.role !== account.role) throw new Error("Existing account roles cannot be silently remapped");
  if (s.accounts.some(a => a.id !== account.id && a.email.toLowerCase() === account.email.toLowerCase())) throw new Error("Email already belongs to another account");
  if (old?.role === "Technical System Administrator" && old.status === "Active" && account.status !== "Active" && s.accounts.filter(a => a.role === old.role && a.status === "Active").length === 1) throw new Error("Keep an active Technical System Administrator");
  return { ...s, accounts: old ? s.accounts.map(a => a.id === account.id ? account : a) : [...s.accounts, account], history: [...s.history, { at, by: actor.accountId ?? "", accountId: account.id, action: old ? "Account updated" : "Account created without operational grants" }] };
}
export function assignAdminProject(s: AdminAccessState, actor: DemoIdentity, accountId: string, project: string, at: string): AdminAccessState {
  requirePermission(actor, "admins.assign", project);
  if (!s.accounts.some(a => a.id === accountId && a.role === "Admin" && a.status === "Active") || !s.grants.some(g => g.accountId === accountId && !g.revokedAt && (!g.project || g.project === project))) throw new Error("Select an authorised Admin");
  if (s.assignments.some(a => a.accountId === accountId && a.project === project)) throw new Error("Admin already assigned");
  return { ...s, assignments: [...s.assignments, { accountId, project, at, by: actor.accountId ?? "" }], history: [...s.history, { at, by: actor.accountId ?? "", accountId, project, action: "Admin project assigned; permissions unchanged" }] };
}
const ROUTE_PERMISSION: Record<string, Permission> = {
  "/admin/applications": "applications.view", "/admin/volunteers": "volunteers.view", "/admin/projects": "projects.view", "/admin/tasks": "tasks.view", "/admin/task-reports": "taskReports.view", "/admin/assignments": "assignments.view", "/admin/time-logs": "attendance.view", "/admin/performance": "performance.view", "/admin/certificates": "certificates.view", "/admin/reports": "reports.view",
};
export const ROLE_ACCESS: Record<DemoRole, readonly string[]> = { "Technical System Administrator": ["/admin/users", "/admin/portal-access", "/admin/settings"], Admin: ["/admin", ...Object.keys(ROUTE_PERMISSION)], Volunteer: [] };
export function canAccess(identity: DemoIdentity | DemoRole, path: string): boolean {
  const actor = typeof identity === "string" ? { role: identity } : identity;
  const p = path.replace(/\/+$/, "") || "/";
  if (["/admin/settings", "/admin/users", "/admin/portal-access"].includes(p)) return isTechnical(actor);
  if (p === "/admin") return actor.role === "Admin" && Object.values(ROUTE_PERMISSION).some(permission => anyPermission(actor, permission));
  const permission = ROUTE_PERMISSION[p];
  return !!permission && anyPermission(actor, permission);
}
