import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "./ui";
import { usePortalActor } from "@/lib/portal-actor";
import { usePortal, getPortal, setPortal, event } from "@/lib/portal-workflow";
import { getPhase2, setPhase2 } from "@/lib/phase2-store";
import { activeHoursProjects, manualHoursTimes, submitManualHours, type ManualHoursValues } from "@/lib/manual-hours";
import { usePhpIntegration } from "@/lib/php-api";
import { PhpManualHours } from "./PhpManualHours";

const cls = "w-full min-w-0 rounded-md border bg-card px-3 py-2 text-sm";
const empty: ManualHoursValues = { projectId: "", taskId: "", date: "", startTime: "", endTime: "", overnight: false, location: "", activity: "", reason: "" };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1 text-sm font-semibold">{label}{children}</label>;
}
export function ManualHoursWorkspace() {
  const connected = usePhpIntegration();
  if (connected === null) return <p role="status">Checking EHF connection…</p>;
  return connected ? <PhpManualHours /> : <DemoManualHoursWorkspace />;
}
function DemoManualHoursWorkspace() {
  const actor = usePortalActor();
  const portal = usePortal();
  const [values, setValues] = useState(empty);
  const [review, setReview] = useState<ManualHoursValues | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState("");
  const busy = useRef(false);
  const projects = activeHoursProjects(portal, actor);
  const tasks = portal.tasks.filter(t => t.volunteerId === actor.volunteerId && t.projectId === values.projectId);
  const update = <K extends keyof ManualHoursValues>(key: K, value: ManualHoursValues[K]) => {
    setValues(v => ({ ...v, [key]: value, ...(key === "projectId" ? { taskId: "" } : {}) }));
    setError(""); setSubmitted("");
  };
  let calculated: number | null = null;
  try { calculated = manualHoursTimes(values.date, values.startTime, values.endTime, values.overnight).hours; } catch { /* Incomplete form. */ }
  const submit = () => {
    if (!review || busy.current) return;
    busy.current = true;
    try {
      const at = new Date().toISOString();
      const s = getPhase2();
      const attendance = submitManualHours(s.attendance, getPortal(), actor, review, at);
      setPhase2({ ...s, attendance });
      if (actor.volunteerId) setPortal(event(getPortal(), actor.volunteerId, actor.name, "Manual hours submitted for approval (demo)", "/portal/hours", at));
      setReview(null); setValues(empty); setError("");
      setSubmitted("Manual hours submitted · Pending Approval · Demo only");
      toast.success("Manual hours submitted for approval (demo only)");
    } catch (e) { setError(e instanceof Error ? e.message : "Submission failed"); setReview(null); }
    finally { busy.current = false; }
  };
  return <>
    <PageHeader title="My Hours" subtitle="Synthetic records · changes are held in this preview tab only" />
    <section className="max-w-3xl">
      <h2 className="mb-4 text-lg font-bold">Manual Hours Entry</h2>
      <form onSubmit={e => {
        e.preventDefault();
        try { submitManualHours(getPhase2().attendance, getPortal(), actor, values, new Date().toISOString()); setReview({ ...values }); setError(""); }
        catch (err) { setError(err instanceof Error ? err.message : "Check the hours entry"); }
      }} className="grid gap-4 sm:grid-cols-2">
        <Field label="Volunteer ID"><input className={cls} value={actor.volunteerId ?? ""} readOnly /></Field>
        <Field label="Project"><select className={cls} required value={values.projectId} onChange={e => update("projectId", e.target.value)}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Task (optional)"><select className={cls} disabled={!values.projectId} value={values.taskId} onChange={e => update("taskId", e.target.value)}><option value="">No task</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></Field>
        <Field label="Date"><input className={cls} type="date" required value={values.date} onChange={e => update("date", e.target.value)} /></Field>
        <Field label="Start Time"><input className={cls} type="time" required value={values.startTime} onChange={e => update("startTime", e.target.value)} /></Field>
        <Field label="End Time"><input className={cls} type="time" required value={values.endTime} onChange={e => update("endTime", e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={values.overnight} onChange={e => update("overnight", e.target.checked)} />End time is on the following day</label>
        <Field label="Total Hours"><input className={cls} readOnly value={calculated === null ? "" : calculated.toFixed(2)} /></Field>
        <Field label="Location (optional)"><input className={cls} maxLength={200} value={values.location} onChange={e => update("location", e.target.value)} /></Field>
        <Field label="Activity Description (optional)"><textarea className={cls} maxLength={1000} value={values.activity} onChange={e => update("activity", e.target.value)} /></Field>
        <Field label="Reason / Comments"><textarea className={cls} required maxLength={1000} value={values.reason} onChange={e => update("reason", e.target.value)} /></Field>
        {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
        {submitted && <p role="status" className="text-sm text-success sm:col-span-2">{submitted}</p>}
        {!projects.length && <p className="text-sm text-muted-foreground sm:col-span-2">No active assigned projects.</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={!projects.length}>Review Hours</Button></div>
      </form>
    </section>
    <Dialog open={!!review} onOpenChange={open => { if (!open) setReview(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Review Manual Hours</DialogTitle></DialogHeader>
        {review && <><dl className="grid gap-3 text-sm">{Object.entries({ "Volunteer ID": actor.volunteerId, Project: projects.find(p => p.id === review.projectId)?.name, Task: portal.tasks.find(t => t.id === review.taskId)?.title ?? "—", Date: review.date, "Start Time": review.startTime, "End Time": `${review.endTime}${review.overnight ? " (following day)" : ""}`, "Total Hours": manualHoursTimes(review.date, review.startTime, review.endTime, review.overnight).hours.toFixed(2), Location: review.location || "—", "Activity Description": review.activity || "—", "Reason / Comments": review.reason }).map(([key, value]) => <div key={key}><dt className="font-semibold">{key}</dt><dd className="break-words">{value}</dd></div>)}</dl>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setReview(null)}>Back to Edit</Button><Button onClick={submit}>Submit Hours (demo)</Button></div></>}
      </DialogContent>
    </Dialog>
  </>;
}