import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderKanban,
  ListChecks,
  Clock,
  Star,
  Award,
  BarChart3,
  ShieldCheck,
  Lock,
  Settings,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/ehf/AppShell";
import { PublicLayout } from "@/components/ehf/PublicLayout";
import { useEffect, useState } from "react";
import { ADMIN_DEMO_MODE_FORCED, isPreviewHost } from "@/lib/admin-login";
import { canAccess, useAdminAccess } from "@/lib/demo-roles";
import { DemoActorContext } from "@/lib/demo-context";
import { usePhpIntegration } from "@/lib/php-api";
import { PhpShell } from "@/components/ehf/PhpShell";

import { meta } from "@/lib/meta";
import { useAccess } from "@/lib/portal-access";

// Admin area stays locked until the organisation's PHP admin login is connected.
// Do not flip this to true without real server-side authentication in place.
const ADMIN_LOGIN_CONNECTED = false;

function AdminLocked() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Lock className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          The administrator sign-in is not connected yet. This area will open once the EHF admin
          login is linked.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Back to Home
        </Link>
      </div>
    </PublicLayout>
  );
}

function useDemoMode(): boolean | null {
  const [demo, setDemo] = useState<boolean | null>(ADMIN_DEMO_MODE_FORCED ? true : null);
  useEffect(() => {
    if (!ADMIN_DEMO_MODE_FORCED) setDemo(isPreviewHost(window.location.hostname));
  }, []);
  return demo;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin/portal-access", label: "Volunteer Portal Accounts", icon: ShieldCheck, group: "Technical Support" },
  { to: "/admin", label: "Dashboard Overview", icon: LayoutDashboard, group: "Main Dashboard" },
  {
    to: "/admin/applications",
    label: "Volunteer Applications",
    icon: FileText,
    group: "Volunteers",
  },
  { to: "/admin/volunteers", label: "Volunteer Profiles", icon: Users, group: "Volunteers" },
  { to: "/admin/time-logs", label: "Attendance & Hours", icon: Clock, group: "Volunteers" },
  { to: "/admin/performance", label: "Performance Reviews", icon: Star, group: "Volunteers" },
  { to: "/admin/certificates", label: "Certificates", icon: Award, group: "Volunteers" },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban, group: "Operations" },
  { to: "/admin/task-reports", label: "Task Report Reviews", icon: FileText, group: "Operations" },
  { to: "/admin/tasks", label: "Tasks & Assignments", icon: ListChecks, group: "Operations" },
  {
    to: "/admin/assignments",
    label: "Volunteer Assignments",
    icon: ListChecks,
    group: "Operations",
  },
  { to: "/admin/users", label: "Users & Permissions", icon: ShieldCheck, group: "Administration" },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3, group: "Administration" },
  { to: "/admin/settings", label: "System Settings", icon: Settings, group: "Administration" },
];

function AdminLayout() {
  const portalAccess = useAccess();
  const demo = useDemoMode();
  const ADMIN_DEMO_MODE = demo === true;
  const permissions = useAdminAccess();
  const [accountId, setAccountId] = useState("U-02");
  const account = permissions.accounts.find(a => a.id === accountId);
  const role = account?.role ?? "Volunteer";
  const actor = { role, accountId, name: account?.name ?? "Demo account", projects: [] };
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!ADMIN_LOGIN_CONNECTED && demo === null)
    return (
      <PublicLayout>
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      </PublicLayout>
    );
  if (!ADMIN_LOGIN_CONNECTED && !ADMIN_DEMO_MODE) return <AdminLocked />;
  const items = NAV_ITEMS.filter((i) => canAccess(actor, i.to));
  const portalSession = portalAccess.accounts.some(a => a.volunteerId === portalAccess.sessionId && a.status === "Active");
  const blocked = portalSession || !canAccess(actor, path)
    ? {
        title: "Access denied",
        message:
          portalSession || role === "Volunteer"
            ? "Volunteers use the Volunteer Portal for their own profile, projects, tasks, hours and certificates."
            : `The ${role} role does not have access to this page.`,
        linkTo: portalSession || role === "Volunteer" ? "/portal" : (items[0]?.to ?? "/"),
        linkLabel: portalSession || role === "Volunteer" ? "Go to Volunteer Portal" : "Go to your dashboard",
      }
    : undefined;
  return (
    <DemoActorContext.Provider
      value={actor}
    >
      <AppShell
        demo={ADMIN_DEMO_MODE && !ADMIN_LOGIN_CONNECTED}
        title="EHF Management · Administrator Workspace"
        user={actor.name}
        accountOptions={permissions.accounts.map(a => ({ value: a.id, label: `${a.name} · ${a.role}` }))}
        accountId={accountId}
        onAccountChange={setAccountId}
        role={role}
        items={items}
        blocked={blocked}
      />
    </DemoActorContext.Provider>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => meta("Administrator Workspace"),
  component: AdminEntry,
});
function AdminEntry() {
  const connected = usePhpIntegration();
  if (connected === null) return <p role="status" className="p-8">Checking EHF connection…</p>;
  return connected ? <PhpShell area="admin" /> : <AdminLayout />;
}
