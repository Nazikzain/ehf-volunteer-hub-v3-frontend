import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  FolderKanban,
  ListChecks,
  Clock,
  Timer,
  MessageSquare,
  Award,
  Bell,
  Star,
  FileText,
} from "lucide-react";
import { meta } from "@/lib/meta";
import { Link } from "@tanstack/react-router";
import { PreviewOnly } from "@/components/ehf/PreviewOnly";
import { useAccess, setAccess, getAccess } from "@/lib/portal-access";
import { useWorkflow } from "@/lib/workflow-store";
import { PortalActorProvider, volunteerProjects } from "@/lib/portal-actor";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/lib/portal-workflow";
import { AppShell } from "@/components/ehf/AppShell";
import { useEffect, useState } from "react";
import { restorePortalDemo, leavePortalDemo } from "@/lib/portal-demo";
import { usePhpIntegration } from "@/lib/php-api";
import { PhpShell } from "@/components/ehf/PhpShell";
function PortalEntry() {
  const connected = usePhpIntegration();
  if (connected === null) return <p role="status" className="p-8">Checking EHF connection…</p>;
  return connected ? <PhpShell area="portal" /> : <PreviewOnly><PortalLayout /></PreviewOnly>;
}

export const Route = createFileRoute("/portal")({
  head: () => meta("Volunteer Portal"),
  component: PortalEntry,
});
function PortalLayout() {
  const [restored, setRestored] = useState(false);
  useEffect(() => { restorePortalDemo(); setRestored(true); }, []);
  usePortal();
  const access = useAccess();
  const wf = useWorkflow();
  const account = access.accounts.find(
    (a) => a.volunteerId === access.sessionId && a.status === "Active",
  );
  const v = wf.volunteers.find((v) => v.id === account?.volunteerId);
  if (!restored) return <p className="p-8">Loading demo portal…</p>;
  if (!v)
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="text-2xl font-bold">Volunteer Portal Demo</h1>
        <p className="my-4">
          Activate an accepted volunteer’s demo account before entering their portal. No real login
          is connected.
        </p>
        <Button asChild>
          <Link to="/portal-login">Demo sign-in</Link>
        </Button>
      </div>
    );
  return (
    <PortalActorProvider
      value={{ role: "Volunteer", name: v.name, volunteerId: v.id, projects: volunteerProjects(v) }}
    >
      <div>
        <Button
          className="m-4 relative z-20"
          variant="outline"
          onClick={leavePortalDemo}
        >
          Leave demo session
        </Button>
        <AppShell
          title="Volunteer Portal"
          user={v.name}
          role="Volunteer"
          demo
          items={[
            { to: "/portal", label: "My Dashboard", icon: LayoutDashboard },
            { to: "/portal/profile", label: "My Profile", icon: User },
            { to: "/portal/projects", label: "My Projects", icon: FolderKanban },
            { to: "/portal/tasks", label: "My Tasks", icon: ListChecks },
            { to: "/portal/hours", label: "My Hours", icon: Clock },
            { to: "/portal/task-reports", label: "My Task Reports", icon: FileText },
            { to: "/portal/performance", label: "My Performance", icon: Star },
            { to: "/portal/notifications", label: "Notifications", icon: Bell },
            { to: "/portal/certificates", label: "My Certificates", icon: Award },
          ]}
        />
      </div>
    </PortalActorProvider>
  );
}
