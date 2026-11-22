import { useSyncExternalStore } from "react";
import type { WorkflowState } from "./volunteer-workflow";
import { isTechnical, type DemoIdentity } from "./demo-roles";

export const ACCOUNT_STATUSES = ["Not Created", "Invitation Pending", "Active", "Invitation Expired", "Suspended"] as const;
export type AccountStatus = typeof ACCOUNT_STATUSES[number];
export type PortalAccount = { volunteerId: string; email: string; role: "Volunteer"; status: AccountStatus; history: { at: string; action: string; by: string }[]; invitation?: { marker: string; expiresAt: string; used: boolean; kind: "activation" | "recovery" } };
export type AccessState = { accounts: PortalAccount[]; sessionId: string | null; sequence: number };
export const EMPTY_ACCESS: AccessState = { accounts: [], sessionId: null, sequence: 0 };
// Demonstration markers are deliberately not authentication tokens. No password is persisted.
export const DEMO_LINK_LIFETIME_MS = 48 * 60 * 60 * 1000;
export function acceptedVolunteers(wf: WorkflowState) {
  return wf.volunteers.filter(v => wf.applications.some(a => a.status === "Accepted" && a.volunteerId === v.id));
}
export function accountStatus(account: PortalAccount | undefined, at: string): AccountStatus {
  if (!account) return "Not Created";
  if (account.status === "Invitation Pending" && account.invitation && new Date(at).getTime() >= new Date(account.invitation.expiresAt).getTime()) return "Invitation Expired";
  return account.status;
}
function technical(actor: DemoIdentity) { if (!isTechnical(actor)) throw new Error("Only Technical System Administrator can provision portal access"); }
export function inviteAccount(s: AccessState, wf: WorkflowState, id: string, actor: DemoIdentity, at: string, kind: "activation" | "recovery" = "activation"): AccessState {
  technical(actor);
  const v = acceptedVolunteers(wf).find(v => v.id === id);
  if (!v) throw new Error("Only accepted volunteers are eligible");
  const old = s.accounts.find(a => a.volunteerId === id);
  if (s.accounts.some(a => a.volunteerId !== id && a.email.toLowerCase() === v.email.toLowerCase())) throw new Error("This email already has a portal account");
  if (old?.status === "Suspended") throw new Error("Reactivate suspended access before sending an invitation");
  if (old?.status === "Active" && kind === "activation") throw new Error("Account is already active; use account recovery");
  if (kind === "recovery" && !old) throw new Error("Create portal access before requesting recovery");
  const sequence = s.sequence + 1;
  const account: PortalAccount = { volunteerId: id, email: v.email, role: "Volunteer", status: "Invitation Pending", history: [...(old?.history ?? []), { at, by: actor.name ?? actor.accountId ?? actor.role, action: `${kind === "recovery" ? "Recovery" : old ? "Invitation resent" : "Invitation created"} (simulated)` }], invitation: { marker: `demo-only-${sequence}-${id}`, expiresAt: new Date(new Date(at).getTime() + DEMO_LINK_LIFETIME_MS).toISOString(), used: false, kind } };
  return { accounts: [...s.accounts.filter(a => a.volunteerId !== id), account], sequence, sessionId: s.sessionId === id ? null : s.sessionId };
}
export function activateAccount(s: AccessState, marker: string, at: string): AccessState {
  const a = s.accounts.find(a => a.invitation?.marker === marker);
  if (!a || !a.invitation || a.invitation.used || accountStatus(a, at) !== "Invitation Pending") throw new Error("Invitation is invalid, expired, already used or suspended");
  const invitation = a.invitation;
  return { ...s, accounts: s.accounts.map(x => x.volunteerId === a.volunteerId ? { ...a, status: "Active", invitation: { ...invitation, used: true }, history: [...a.history, { at, by: a.volunteerId, action: "Password creation demonstrated; no password stored" }] } : x) };
}
export function setAccountAccess(s: AccessState, id: string, actor: DemoIdentity, status: "Active" | "Suspended", at: string): AccessState {
  technical(actor);
  const a = s.accounts.find(a => a.volunteerId === id);
  if (!a || (status === "Active" && (a.status !== "Suspended" || !a.history.some(h => h.action.startsWith("Password creation"))))) throw new Error("Only previously activated suspended accounts can be reactivated");
  return { ...s, sessionId: s.sessionId === id ? null : s.sessionId, accounts: s.accounts.map(x => x.volunteerId === id ? { ...x, status, history: [...x.history, { at, by: actor.name ?? actor.accountId ?? actor.role, action: `${status === "Suspended" ? "Access suspended" : "Access reactivated"} (demo)` }] } : x) };
}
export function demoSignIn(s: AccessState, email: string, at: string): AccessState {
  const a = s.accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!a || accountStatus(a, at) !== "Active") throw new Error("Activate your demo account first, or ask Technical Support to restore access");
  return { ...s, sessionId: a.volunteerId };
}
let state: AccessState = structuredClone(EMPTY_ACCESS);
const listeners = new Set<() => void>();
export const getAccess = () => state;
export function setAccess(next: AccessState) { state = next; listeners.forEach(f => f()); }
export const useAccess = () => useSyncExternalStore(f => { listeners.add(f); return () => { listeners.delete(f); }; }, () => state, () => state);