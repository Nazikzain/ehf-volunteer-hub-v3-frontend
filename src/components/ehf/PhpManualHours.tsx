import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./ui";
import { phpRequest } from "@/lib/php-api";

type Own = { volunteer_id: number; assignments: { id: number; project_id: number; name: string }[] };
export function PhpManualHours({ showHeading = true }: { showHeading?: boolean }) {
  const [choiceQ, setChoiceQ] = useState(""); const [choicePage, setChoicePage] = useState(1);
  const [own, setOwn] = useState<Own | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [project, setProject] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { phpRequest<Own>(`own?q=${encodeURIComponent(choiceQ)}&page=${choicePage}`).then(setOwn).catch(e => setError(e.message)); }, [choiceQ, choicePage]);
  const cls = "w-full rounded-md border bg-card px-3 py-2";
  return <>{showHeading && <PageHeader title="My Hours" />}<section className="max-w-3xl"><h2 className="mb-4 text-lg font-bold">Manual Hours Entry</h2>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={async e => {
      e.preventDefault(); if (submitting) return; setSubmitting(true); setError(""); setSaved("");
      try { const result = await phpRequest<{ result: number }>("workflow", { operation: "hours", project_id: Number(project), hours: { date, end_date: endDate, start, end, comments } }); setSaved(`Manual hours submitted · Pending Approval · Entry ${result.result}`); }
      catch (err) { setError(err instanceof Error ? err.message : "Submission failed"); }
      finally { setSubmitting(false); }
    }}>
      <label>Volunteer ID<input className={cls} readOnly value={own?.volunteer_id ?? ""} /></label>
      <fieldset className="sm:col-span-2 grid gap-2"><label>Find project<input className={cls} value={choiceQ} onChange={e => { setChoiceQ(e.target.value); setChoicePage(1); }} /></label><div className="flex gap-2"><Button type="button" variant="outline" disabled={choicePage === 1} onClick={() => setChoicePage(p => p - 1)}>Previous projects</Button><Button type="button" variant="outline" disabled={(own?.assignments.length ?? 0) < 100} onClick={() => setChoicePage(p => p + 1)}>Next projects</Button></div></fieldset>
      <label>Project<select className={cls} required value={project} onChange={e => setProject(e.target.value)}><option value="">Select project</option>{own?.assignments.map(a => <option key={a.id} value={a.project_id}>{a.name}</option>)}</select></label>
      <label>Start Date<input className={cls} type="date" required value={date} onChange={e => { setDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} /></label>
      <label>End Date<input className={cls} type="date" required value={endDate} min={date} onChange={e => setEndDate(e.target.value)} /></label>
      <label>Start Time<input className={cls} type="time" required value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>End Time<input className={cls} type="time" required value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label>Reason / Comments<textarea className={cls} required maxLength={500} value={comments} onChange={e => setComments(e.target.value)} /></label>
      {error && <p role="alert" className="text-destructive sm:col-span-2">{error}</p>}
      {saved && <p role="status" className="text-success sm:col-span-2">{saved}</p>}
      <Button type="submit" disabled={!own || submitting}>Submit Hours</Button>
    </form>
  </section></>;
}