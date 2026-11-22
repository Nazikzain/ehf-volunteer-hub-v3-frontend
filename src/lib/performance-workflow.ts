import type { Actor } from "./attendance";
import { canOperate, event, type Performance, type PerformanceValues, type PortalState } from "./portal-workflow";

export const PERFORMANCE_CRITERIA = ["Attendance and reliability", "Communication", "Teamwork", "Task completion", "Initiative"] as const;
export const RATING_SCALE = ["Needs Significant Improvement", "Needs Improvement", "Meets Expectations", "Good", "Excellent"] as const;
export const overallRating = (ratings: number[]) => (ratings.reduce((n, v) => n + v, 0) / 5).toFixed(1);
export function reviewValues(r: PerformanceValues): PerformanceValues {
  return structuredClone({ volunteerId: r.volunteerId, projectId: r.projectId, date: r.date, reviewer: r.reviewer, ratings: r.ratings, strengths: r.strengths, improvements: r.improvements, comments: r.comments, recommendations: r.recommendations });
}
export function publishedReviews(s: PortalState, actor: Actor): Performance[] {
  if (actor.role !== "Volunteer" || !actor.volunteerId) return [];
  return s.performance.filter(r => r.volunteerId === actor.volunteerId && (r.status !== "Draft" || r.published)).map(r => r.published ? { ...r, ...structuredClone(r.published) } : r);
}
export function savePerformance(s: PortalState, actor: Actor, id: string | undefined, values: PerformanceValues, submit: boolean, at: string): PortalState {
  const old = id ? s.performance.find(r => r.id === id) : undefined;
  if (id && !old) throw new Error("Review not found");
  if (!canOperate(s, actor, values.projectId, "performance.write") || (submit && !canOperate(s, actor, values.projectId, "performance.publish")) || (old && !canOperate(s, actor, old.projectId, "performance.write")) || actor.volunteerId === values.volunteerId) throw new Error("Review is outside your authorised scope");
  if (old && (old.volunteerId !== values.volunteerId || old.projectId !== values.projectId)) throw new Error("An existing review's volunteer and project cannot change");
  if (!s.assignments.some(a => a.volunteerId === values.volunteerId && a.projectId === values.projectId)) throw new Error("Select an assigned volunteer and project");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || Number.isNaN(Date.parse(values.date)) || new Date(values.date).toISOString().slice(0, 10) !== values.date) throw new Error("A valid review date is required");
  if (values.ratings.length !== 5 || values.ratings.some(n => !Number.isInteger(n) || n < 1 || n > 5)) throw new Error("All five ratings must be integers from 1 to 5");
  if (submit && (values.strengths.trim().length < 10 || values.comments.trim().length < 10)) throw new Error("Provide meaningful strengths and Admin comments (at least 10 characters each)");
  const v = { ...reviewValues(values), reviewer: actor.name };
  const action = submit ? (old ? "Performance review updated and published" : "Performance review published") : "Performance review draft saved";
  const versions = old?.versions ?? (old && old.status !== "Draft" ? [{ at, values: reviewValues(old) }] : []);
  const published = !submit && old ? old.published ?? (old.status !== "Draft" ? reviewValues(old) : undefined) : undefined;
  const r: Performance = { ...v, id: old?.id ?? crypto.randomUUID(), status: submit ? "Published" : "Draft", acknowledgedAt: submit ? "" : old?.acknowledgedAt ?? "", versions: [...versions, { at, values: structuredClone(v) }], history: [...(old?.history ?? []), { at, by: actor.name, action }], ...(published ? { published } : {}) };
  const next = { ...s, performance: [...s.performance.filter(x => x.id !== r.id), r] };
  return submit ? event(next, v.volunteerId, actor.name, action, "/portal/performance", at) : next;
}
export function acknowledgePerformance(s: PortalState, actor: Actor, id: string, at: string): PortalState {
  const review = publishedReviews(s, actor).find(r => r.id === id);
  if (!review) throw new Error("Select your own published review");
  if (review.acknowledgedAt) return s;
  return { ...s, performance: s.performance.map(r => r.id === id ? { ...r, acknowledgedAt: at, history: [...(r.history ?? []), { at, by: actor.name, action: "Review acknowledged" }] } : r) };
}