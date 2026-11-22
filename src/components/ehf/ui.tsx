import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}</div>
      {action}
    </div>
  );
}

export function Panel({ title, children, action, className = "" }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border bg-card p-5 shadow-card ${className}`}>
      {title && <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-base font-bold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

const tones: Record<string, string> = { blue: "text-brand-blue", green: "text-brand-green", orange: "text-brand-orange", red: "text-brand-red", yellow: "text-warning" };
export function Kpi({ icon: Icon, value, label, tone = "blue" }: { icon: LucideIcon; value: ReactNode; label: string; tone?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-card">
      <Icon className={`h-9 w-9 shrink-0 ${tones[tone]}`} />
      <div className="min-w-0"><p className="font-display text-2xl font-bold">{value}</p><p className="truncate text-sm text-muted-foreground">{label}</p></div>
    </div>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left"><tr>{columns.map((c) => <th key={c} className="whitespace-nowrap px-4 py-3 font-semibold">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t hover:bg-muted/50">{r.map((c, j) => <td key={j} className="whitespace-nowrap px-4 py-3">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function ActionButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <Button onClick={onClick} disabled={disabled}>{children}</Button>;
}
