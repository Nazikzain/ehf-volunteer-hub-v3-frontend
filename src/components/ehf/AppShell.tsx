import { Link, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, ChevronDown, Menu, X, UserCircle2, ShieldAlert } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export type NavItem = { to: string; label: string; icon: LucideIcon; badge?: number; group?: string };
export type Blocked = { title: string; message: string; linkTo?: string; linkLabel?: string };

export function AppShell({ title, items, user, role, demo = false, blocked, accountOptions, accountId, onAccountChange, children, connected = false, onLogout }: { title: string; items: NavItem[]; user: string; role: string; demo?: boolean; blocked?: Blocked | undefined; accountOptions?: { value: string; label: string }[]; accountId?: string; onAccountChange?: (id: string) => void; children?: ReactNode; connected?: boolean; onLogout?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between bg-nav px-4 py-3">
          <Link to="/"><Logo className="h-11" /></Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5 text-nav-foreground" /></button>
        </div>
        <div className="brand-bar h-1" />
        <p className="px-5 py-4 font-display text-base font-bold text-sidebar-accent-foreground">{title}</p>
        <nav className="space-y-0.5 px-3 pb-6">
          {items.map((i, idx) => (<div key={i.to}>
            {i.group && i.group !== items[idx - 1]?.group && <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider opacity-60">{i.group}</p>}
            <Link to={i.to} search={prev => demo ? { ...prev, demo: 1 } : prev} onClick={() => setOpen(false)} activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary" }}>
              <i.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{i.label}</span>
              {i.badge ? <span className="rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">{i.badge}</span> : null}
            </Link>
          </div>))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-nav/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 bg-nav px-4 py-3 text-nav-foreground">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
          <span className="hidden rounded bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning sm:inline">{connected ? "Isolated PHP · synthetic records" : "Prototype · demonstration data"}</span>
          <div className="ml-auto flex items-center gap-5">
            {role === "Volunteer" && <Link to="/portal/notifications" search={prev => demo ? { ...prev, demo: 1 } : prev} aria-label="Notifications"><Bell className="h-5 w-5" /></Link>}
            {onLogout && <Button variant="ghost" size="sm" onClick={onLogout}>Sign out</Button>}
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-8 w-8 shrink-0" />
              <div className="hidden leading-tight sm:block"><p className="text-sm font-semibold">{user}</p><p className="text-xs opacity-70">{role}</p></div>
              {accountOptions && <select aria-label="Demo account" value={accountId} onChange={e => onAccountChange?.(e.target.value)} className="max-w-40 rounded-md border border-nav-foreground/30 bg-nav px-2 py-1 text-xs text-nav-foreground">{accountOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select>}
              {!accountOptions && <ChevronDown className="h-4 w-4 opacity-70" />}
            </div>
          </div>
        </header>
        {demo && <div role="status" className="border-b-2 border-warning bg-warning-soft px-4 py-2 text-center text-sm font-bold tracking-wide text-warning">DEMO MODE · Preview only · Synthetic data — changes are not saved and no real records are used</div>}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {blocked ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-4 text-xl font-bold">{blocked.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{blocked.message}</p>
              {blocked.linkTo && <Link to={blocked.linkTo} className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{blocked.linkLabel ?? "Back"}</Link>}
            </div>
          ) : children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
