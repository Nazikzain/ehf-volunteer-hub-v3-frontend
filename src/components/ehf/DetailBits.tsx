import type { ReactNode } from "react";
import type { HistoryEntry } from "@/lib/volunteer-workflow";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border bg-card p-4"><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">{title}</h3>{children}</section>;
}
export function Facts({ items }: { items: [string, ReactNode][] }) {
  return <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">{items.map(([k, v]) => <div key={k} className="contents"><dt className="font-semibold text-muted-foreground">{k}</dt><dd className="break-words">{v || "—"}</dd></div>)}</dl>;
}
export function Timeline({ entries, empty = "No entries yet." }: { entries: HistoryEntry[]; empty?: string }) {
  if (!entries.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return <ol className="space-y-2 border-l-2 border-primary/30 pl-4 text-sm">{entries.map((e, i) => <li key={i}><p className="font-semibold">{e.action}</p><p className="text-xs text-muted-foreground">{e.at} · {e.by}</p>{e.note && <p className="mt-1 rounded bg-muted px-2 py-1">{e.note}</p>}</li>)}</ol>;
}
