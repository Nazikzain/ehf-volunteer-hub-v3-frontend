import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionButton, DataTable, PageHeader } from "@/components/ehf/ui";
import { StatusBadge } from "@/components/ehf/StatusBadge";

export type Field = { key: string; label: string; type?: "text" | "number" | "select"; options?: string[]; table?: boolean };
type Row = Record<string, string | number>;

// In-memory store: demo edits last only for this browser session and never leave the page.
const stores: Record<string, Row[]> = {};

export function DemoCrud({ storeKey, title, subtitle, entity, fields, initial, idKey, statusOptions, extraActions }: {
  storeKey: string; title: string; subtitle: string; entity: string; fields: Field[]; initial: Row[]; idKey: string;
  statusOptions?: string[]; extraActions?: (row: Row, update: (patch: Row) => void) => ReactNode;
}) {
  const [rows, setRowsState] = useState<Row[]>(() => stores[storeKey] ?? initial.map((r) => ({ ...r })));
  const setRows = (fn: (p: Row[]) => Row[]) => setRowsState((p) => (stores[storeKey] = fn(p)));
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<Row | null>(null);
  const [edit, setEdit] = useState<{ row: Row; isNew: boolean } | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const cols = fields.filter((f) => f.table !== false);
  const shown = useMemo(() => rows.filter((r) => (!status || r["status"] === status) && Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase())), [rows, q, status]);
  const update = (id: string | number) => (patch: Row) => setRows((p) => p.map((r) => (r[idKey] === id ? { ...r, ...patch } : r)));

  const blank = () => { const r: Row = { [idKey]: `DEMO-${Date.now().toString().slice(-5)}` }; fields.forEach((f) => { if (f.key !== idKey) r[f.key] = f.type === "number" ? 0 : f.options?.[0] ?? ""; }); return r; };
  const save = () => {
    if (!edit) return;
    const missing = fields.find((f) => f.type !== "number" && !String(edit.row[f.key] ?? "").trim());
    if (missing) { toast.error(`${missing.label} is required`); return; }
    if (edit.isNew) setRows((p) => [edit.row, ...p]); else update(edit.row[idKey]!)(edit.row);
    toast.success(`${entity} ${edit.isNew ? "added" : "updated"} (demo only — not saved)`); setEdit(null);
  };

  return (<>
    <PageHeader title={title} subtitle={subtitle} action={<ActionButton onClick={() => setEdit({ row: blank(), isNew: true })}><Plus className="h-4 w-4" /> Add {entity}</ActionButton>} />
    <div className="mb-4 flex flex-wrap gap-3">
      <label className="relative min-w-60 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search" className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm" /></label>
      {statusOptions && <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="rounded-md border bg-card px-3 py-2 text-sm"><option value="">All Statuses</option>{statusOptions.map((s) => <option key={s}>{s}</option>)}</select>}
    </div>
    <p className="mb-2 text-xs text-muted-foreground">{shown.length} of {rows.length} records · synthetic data</p>
    <DataTable columns={[...cols.map((f) => f.label), "Actions"]} rows={shown.map((r) => [
      ...cols.map((f) => (f.key === "status" ? <StatusBadge status={String(r[f.key])} /> : f.key === "name" || f.key === "volunteer" ? <b>{r[f.key]}</b> : r[f.key])),
      <div className="flex gap-3">
        <button aria-label="View" onClick={() => setView(r)}><Eye className="h-4 w-4 text-primary" /></button>
        <button aria-label="Edit" onClick={() => setEdit({ row: { ...r }, isNew: false })}><Pencil className="h-4 w-4 text-primary" /></button>
        {extraActions?.(r, update(r[idKey]!))}
        <button aria-label="Delete" onClick={() => setDel(r)}><Trash2 className="h-4 w-4 text-destructive" /></button>
      </div>])} />
    {shown.length === 0 && <p className="mt-4 text-center text-sm text-muted-foreground">No records match your search.</p>}

    <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
      <DialogContent><DialogHeader><DialogTitle>{entity} details</DialogTitle></DialogHeader>
        {view && <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">{fields.map((f) => <Fragment key={f.key}><dt className="font-semibold">{f.label}</dt><dd>{f.key === "status" ? <StatusBadge status={String(view[f.key])} /> : view[f.key]}</dd></Fragment>)}</dl>}
      </DialogContent>
    </Dialog>

    <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
      <DialogContent><DialogHeader><DialogTitle>{edit?.isNew ? `Add ${entity}` : `Edit ${entity}`}</DialogTitle></DialogHeader>
        {edit && <div className="grid gap-3">{fields.filter((f) => f.key !== idKey).map((f) => (
          <label key={f.key} className="grid gap-1 text-sm font-medium">{f.label}
            {f.type === "select"
              ? <select value={String(edit.row[f.key])} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, [f.key]: e.target.value } })} className="rounded-md border bg-card px-3 py-2">{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
              : <input type={f.type === "number" ? "number" : "text"} value={edit.row[f.key]} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value } })} className="rounded-md border bg-card px-3 py-2 font-normal" />}
          </label>))}</div>}
        <DialogFooter><button onClick={() => setEdit(null)} className="rounded-md border px-4 py-2 text-sm">Cancel</button><ActionButton onClick={save}>Save (demo)</ActionButton></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
      <DialogContent><DialogHeader><DialogTitle>Delete {entity.toLowerCase()}?</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">This removes the demonstration record from this preview session only.</p>
        <DialogFooter><button onClick={() => setDel(null)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => { setRows((p) => p.filter((r) => r[idKey] !== del![idKey])); toast.success(`${entity} deleted (demo only)`); setDel(null); }} className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">Delete</button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>);
}
