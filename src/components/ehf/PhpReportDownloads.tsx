import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { phpDownload } from "@/lib/php-api";

export function PhpReportDownloads() {
  const [kind, setKind] = useState("approved-hours");
  const [format, setFormat] = useState("csv");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dir, setDir] = useState("asc");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const control = "mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm";
  return <section className="mb-8 border-b pb-6"><h2 className="mb-4 text-lg font-bold">Download Report</h2>
    <form className="grid max-w-3xl gap-4 sm:grid-cols-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError("");
      try { await phpDownload(`reports/export?kind=${encodeURIComponent(kind)}&format=${format}&q=${encodeURIComponent(q)}&from=${from}&to=${to}&dir=${dir}`, `${kind}.${format}`); }
      catch (e) { setError(e instanceof Error ? e.message : "Report unavailable."); }
      finally { setBusy(false); }
    }}>
      <label>Report<select className={control} value={kind} onChange={e => setKind(e.target.value)}>{[["volunteers","Volunteer Directory"],["volunteer-status","Volunteer Status"],["applications","Applications"],["projects","Projects"],["participation","Project Participation"],["tasks","Task Completion"],["attendance","Attendance"],["approved-hours","Approved Hours"],["performance","Performance Reviews"],["certificates","Certificates"],["audit","Audit Records"]].map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
      <label>Format<select className={control} value={format} onChange={e => setFormat(e.target.value)}><option value="csv">CSV</option><option value="xlsx">XLSX</option><option value="pdf">PDF</option></select></label>
      <label>Search records<input className={control} value={q} onChange={e => setQ(e.target.value)} /></label>
      <label>From date<input type="date" className={control} value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label>To date<input type="date" className={control} value={to} onChange={e => setTo(e.target.value)} /></label>
      <label>Order<select className={control} value={dir} onChange={e => setDir(e.target.value)}><option value="asc">Oldest first</option><option value="desc">Newest first</option></select></label>
      <Button type="submit" disabled={busy}><Download className="size-4" />{busy ? "Preparing…" : "Download"}</Button>
      {error && <p role="alert" className="text-destructive sm:col-span-3">{error}</p>}
    </form>
  </section>;
}