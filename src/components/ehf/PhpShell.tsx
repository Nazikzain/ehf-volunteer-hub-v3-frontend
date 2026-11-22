import { Component, Suspense, type ReactNode } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Award, Bell, Clock, FileText, FolderKanban, LayoutDashboard, ListChecks, Settings, ShieldCheck, Star, Users, BarChart3 } from "lucide-react";
import { AppShell, type NavItem } from "./AppShell";
import { PhpWorkspace } from "./PhpWorkspace";
import { PhpPortalAccess } from "./PhpPortalAccess";
import { phpRequest, type PhpAccess } from "@/lib/php-api";
import { Button } from "@/components/ui/button";

class PhpError extends Component<{ children: ReactNode }, { error: string }> {
  override state = { error: "" };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  override render() { return this.state.error ? <section className="p-8"><h1 className="text-2xl font-bold">Unable to open this page</h1><p role="alert" className="my-4 text-destructive">{this.state.error}</p><Button onClick={() => window.location.reload()}>Retry</Button></section> : this.props.children; }
}
const admin: (NavItem & { permission: string })[] = [
  { to: "/admin", label: "Dashboard Overview", icon: LayoutDashboard, permission: "session" },
  { to: "/admin/applications", label: "Volunteer Applications", icon: FileText, permission: "applications.view" },
  { to: "/admin/volunteers", label: "Volunteer Profiles", icon: Users, permission: "volunteers.view" },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban, permission: "projects.view" },
  { to: "/admin/assignments", label: "Volunteer Assignments", icon: ListChecks, permission: "assignments.view" },
  { to: "/admin/tasks", label: "Tasks & Assignments", icon: ListChecks, permission: "tasks.view" },
  { to: "/admin/task-reports", label: "Task Report Reviews", icon: FileText, permission: "task_reports.view" },
  { to: "/admin/time-logs", label: "Attendance & Hours", icon: Clock, permission: "timelogs.view" },
  { to: "/admin/performance", label: "Performance Reviews", icon: Star, permission: "reviews.view" },
  { to: "/admin/certificates", label: "Certificates", icon: Award, permission: "certificates.view" },
  { to: "/admin/periods", label: "Volunteering Period History", icon: Clock, permission: "periods.view" },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3, permission: "reports.view" },
  { to: "/admin/portal-access", label: "Volunteer Portal Accounts", icon: ShieldCheck, permission: "users.manage" },
  { to: "/admin/users", label: "Users & Permissions", icon: ShieldCheck, permission: "users.manage" },
  { to: "/admin/settings", label: "System Settings", icon: Settings, permission: "settings.manage" },
  { to: "/admin/audit", label: "Audit History", icon: ShieldCheck, permission: "security.manage" },
];
const portal: (NavItem & { permission: string })[] = [
  { to: "/portal", label: "My Dashboard", icon: LayoutDashboard, permission: "dashboard.own" },
  { to: "/portal/profile", label: "My Profile", icon: Users, permission: "volunteers.own" },
  { to: "/portal/projects", label: "My Projects", icon: FolderKanban, permission: "projects.own" },
  { to: "/portal/tasks", label: "My Tasks", icon: ListChecks, permission: "tasks.own" },
  { to: "/portal/hours", label: "My Hours", icon: Clock, permission: "timelogs.own" },
  { to: "/portal/task-reports", label: "My Task Reports", icon: FileText, permission: "task_reports.own" },
  { to: "/portal/performance", label: "My Performance", icon: Star, permission: "reviews.own" },
  { to: "/portal/certificates", label: "My Certificates", icon: Award, permission: "certificates.own" },
  { to: "/portal/notifications", label: "Notifications", icon: Bell, permission: "notifications.own" },
  { to: "/portal/feedback", label: "Feedback & History", icon: Star, permission: "reviews.own" },
];
export function PhpShell({ area }: { area: "admin" | "portal" }) { return <PhpError><Suspense fallback={<p role="status" className="p-8">Checking session…</p>}><Shell area={area} /></Suspense></PhpError>; }
function Shell({ area }: { area: "admin" | "portal" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({ queryKey: ["php-session"], queryFn: () => phpRequest<{ access: PhpAccess }>("session"), retry: false, staleTime: 0 });
  const path = useRouterState({ select: s => s.location.pathname }); const access = data.access;
  if (!access.authenticated) return <PhpPortalAccess />;
  const navigation = (area === "admin" ? admin : portal).map(i => i.to === "/admin/audit" && access.role === "admin" ? { ...i, permission: "audit.view" } : i);
  const items = navigation.filter(i => i.permission === "session" || Boolean(access.capabilities[i.permission]));
  const allowed = area === "portal" ? access.role === "volunteer" : access.role !== "volunteer";
  const rawKey = path.split("/")[2] ?? "dashboard";
  const key = rawKey === "log-hours" ? "hours" : rawKey;
  const known = navigation.find(i => i.to === path);
  const blocked = !allowed || !known || (known.permission !== "session" && !access.capabilities[known.permission]) ? { title: "Access denied", message: "Your current account does not have permission for this page." } : undefined;
  return <AppShell connected title={area === "portal" ? "Volunteer Portal" : "EHF Management · Administrator Workspace"} role={access.role === "technical_system_administrator" ? "Technical System Administrator" : access.role === "admin" ? "Admin" : "Volunteer"} user={access.email ?? "Account"} items={items} blocked={blocked} onLogout={async () => { await queryClient.cancelQueries(); await phpRequest("logout", {}); queryClient.clear(); await navigate({ to: "/portal-login", replace: true }); }}><PhpError key={path}><PhpWorkspace screen={`${area}/${key}`} /></PhpError></AppShell>;
}