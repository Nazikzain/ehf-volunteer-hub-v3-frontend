import { anyPermission, hasPermission } from "@/lib/demo-roles";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDemoActor } from "@/lib/demo-context";
import { useWorkflow } from "@/lib/workflow-store";
import { canOperate, getPortal, setPortal, usePortal, type Performance, type PerformanceValues } from "@/lib/portal-workflow";
import { PERFORMANCE_CRITERIA, RATING_SCALE, overallRating, reviewValues, savePerformance } from "@/lib/performance-workflow";
import { DataTable, PageHeader } from "./ui";
import { PerformanceDetails } from "./PerformanceDetails";
import { ReviewDatePicker } from "./ReviewDatePicker";
import { Timeline } from "./DetailBits";

const cls = "w-full min-w-0 rounded-md border bg-card px-3 py-2 text-sm";
const empty = (): PerformanceValues => ({ volunteerId: "", projectId: "", date: new Date().toISOString().slice(0, 10), reviewer: "", ratings: [3, 3, 3, 3, 3], strengths: "", improvements: "", comments: "", recommendations: "" });
export function AdminPerformanceWorkspace() {
  const actor = useDemoActor(), s = usePortal(), wf = useWorkflow();
  const [form, setForm] = useState<PerformanceValues | null>(null);
  const [id, setId] = useState<string>();
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);
  const [detail, setDetail] = useState<Performance | null>(null);
  const authorised = anyPermission(actor, "performance.write");
  const volunteers = wf.volunteers.filter(v => s.assignments.some(a => a.volunteerId === v.id && canOperate(s, actor, a.projectId, "performance.write")));
  const rows = s.performance.filter(r => canOperate(s, actor, r.projectId, "performance.view"));
  const open = (r?: Performance) => { setId(r?.id); setForm(r ? reviewValues(r) : empty()); setQuery(""); setPreview(false); };
  const save = (submit: boolean) => {
    if (!form) return;
    try {
      setPortal(savePerformance(getPortal(), actor, id, form, submit, new Date().toISOString()));
      setForm(null); setPreview(false);
      toast.success(submit ? "Review published in demo memory" : "Draft saved in demo memory");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Review could not be saved"); }
  };
  return <>
    <PageHeader title="Performance Reviews" action={authorised ? <Button onClick={() => open()}>Create Review</Button> : undefined} />
    <DataTable columns={["Volunteer", "Volunteer ID", "Project", "Date", "Reviewer", "Overall rating", "Publication", "Acknowledgement", "Actions"]} rows={rows.map(r => [
      wf.volunteers.find(v => v.id === r.volunteerId)?.name, r.volunteerId, s.projects.find(p => p.id === r.projectId)?.name, r.date, r.reviewer, `${overallRating(r.ratings)} / 5`, r.status ?? "Published", r.acknowledgedAt || "Unread",
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDetail(r)}>View Review</Button><Button variant="outline" disabled={!canOperate(s, actor, r.projectId, "performance.write")} onClick={() => open(r)}>Edit Review</Button></div>,
    ])} />
    <Dialog open={!!form} onOpenChange={o => { if (!o) { setForm(null); setPreview(false); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{preview ? "Preview Review" : id ? "Edit Review" : "Create Review"}</DialogTitle></DialogHeader>
        {form && (preview ? <PerformanceDetails review={{ ...form, reviewer: actor.name }} project={s.projects.find(p => p.id === form.projectId)?.name ?? "—"} /> : <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Search volunteer name or ID<input className={cls} value={query} disabled={!!id} onChange={e => setQuery(e.target.value)} /></label>
          <label className="grid gap-1 text-sm">Volunteer<select className={cls} value={form.volunteerId} disabled={!!id} onChange={e => setForm({ ...form, volunteerId: e.target.value, projectId: "" })}><option value="">Select volunteer</option>{volunteers.filter(v => v.id === form.volunteerId || `${v.name} ${v.id}`.toLowerCase().includes(query.toLowerCase())).map(v => <option key={v.id} value={v.id}>{v.name} · {v.id}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Volunteer ID<input className={cls} readOnly value={form.volunteerId} /></label>
          <label className="grid gap-1 text-sm">Project<select className={cls} value={form.projectId} disabled={!!id} onChange={e => setForm({ ...form, projectId: e.target.value })}><option value="">Select assigned project</option>{s.projects.filter(p => canOperate(s, actor, p.id, "performance.write") && s.assignments.some(a => a.projectId === p.id && a.volunteerId === form.volunteerId)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="grid gap-1 text-sm">Reviewer<input className={cls} readOnly value={actor.name} /></label>
          <div className="grid gap-1 text-sm"><span>Review Date</span><ReviewDatePicker value={form.date} onChange={date => setForm({ ...form, date })} /></div>
          {PERFORMANCE_CRITERIA.map((label, i) => <label className="grid gap-1 text-sm" key={label}>{label}<select className={cls} value={form.ratings[i]} onChange={e => setForm({ ...form, ratings: form.ratings.map((n, j) => i === j ? Number(e.target.value) : n) })}>{RATING_SCALE.map((text, j) => <option value={j + 1} key={text}>{j + 1} — {text}</option>)}</select></label>)}
          <div className="self-end border-b py-3 text-sm font-semibold">Overall rating: {overallRating(form.ratings)} / 5</div>
          {([["strengths", "Strengths (required)"], ["improvements", "Areas for improvement"], ["comments", "Admin comments (required)"], ["recommendations", "Development recommendations"]] as const).map(([key, label]) => <label key={key} className="grid gap-1 text-sm">{label}<textarea className={cls} rows={3} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
        </div>)}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save(false)}>Save Draft</Button>
          <Button variant="outline" onClick={() => setPreview(!preview)}>{preview ? "Back to Edit" : "Preview Review"}</Button>
          <Button disabled={!form || !canOperate(s, actor, form.projectId, "performance.publish")} onClick={() => save(true)}>Submit Review</Button>
          <Button variant="ghost" onClick={() => { setForm(null); setPreview(false); }}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!detail && canOperate(s, actor, detail.projectId, "performance.view")} onOpenChange={o => !o && setDetail(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Review Details & History</DialogTitle></DialogHeader>{detail && <>
      <PerformanceDetails review={detail} project={s.projects.find(p => p.id === detail.projectId)?.name ?? "—"} />
      <h3 className="font-bold">Audit history</h3><Timeline entries={detail.history ?? []} />
      <h3 className="font-bold">Previous versions</h3>{detail.versions?.map((v, i) => <details key={`${v.at}-${i}`} className="border-t pt-3"><summary className="cursor-pointer text-sm font-semibold">Version {i + 1} · {v.at}</summary><div className="py-3"><PerformanceDetails review={v.values} project={s.projects.find(p => p.id === v.values.projectId)?.name ?? "—"} /></div></details>)}
    </>}</DialogContent></Dialog>
  </>;
}