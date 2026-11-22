import { hasPermission, canAccess, anyPermission } from "@/lib/demo-roles";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  UserCheck,
  FolderKanban,
  ListChecks,
  Hourglass,
  Clock,
  Award,
  Inbox,
  Plus,
  RefreshCw,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ActionButton, Kpi, PageHeader, Panel } from "@/components/ehf/ui";
import { StatusBadge } from "@/components/ehf/StatusBadge";
import { applications, projects, tasks, timeLogs, volunteers } from "@/lib/demo-data";
import { usePhase2 } from "@/lib/phase2-store";
import { totals, visibleAttendance } from "@/lib/attendance";
import { useDemoActor } from "@/lib/demo-context";
import { useWorkflow } from "@/lib/workflow-store";
import { usePortal } from "@/lib/portal-workflow";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin/")({
  head: () => meta("Dashboard Overview"),
  component: Dash,
});

const count = (s: string) => applications.filter((a) => a.status === s).length;
const later = () => toast("Available once connected to the EHF system");

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Dash() {
  const state = usePhase2();
  const actor = useDemoActor();
  const portal = usePortal();
  const projects = portal.projects
    .filter((p) => hasPermission(actor, "projects.view", p.name))
    .map((p) => ({ ...p, dates: `${p.start} – ${p.end}` }));
  const tasks = portal.tasks
    .filter(
      (t) =>
        hasPermission(actor, "tasks.view", portal.projects.find((p) => p.id === t.projectId)?.name),
    )
    .map((t) => ({ ...t, volunteer: t.volunteerId }));
  const workflow = useWorkflow();
  const applications = hasPermission(actor, "applications.view") ? workflow.applications : [];
  const volunteers = workflow.volunteers.filter(v => hasPermission(actor, "volunteers.view") || portal.assignments.some(a => a.volunteerId === v.id && hasPermission(actor, "volunteers.view", portal.projects.find(p => p.id === a.projectId)?.name)));
  const count = (s: string) => applications.filter((a) => a.status === s).length;
  const sum = totals(visibleAttendance(state.attendance, actor));
  const approvedHours = sum.approvedHours;
  const pendingHours = sum.pending;
  const taskBy = (s: string) => tasks.filter((t) => t.status === s).length;
  return (
    <>
      <PageHeader
        title="Dashboard Overview"
        subtitle="Live overview of volunteer applications and programme activity (demonstration data)"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} value={applications.length} label="Total Applications" />
        <Kpi
          icon={UserCheck}
          value={
            volunteers.filter(
              (v) =>
                v.status === "Active" &&
                (hasPermission(actor, "volunteers.view") ||
                  portal.assignments.some(
                    (a) => a.volunteerId === v.id && projects.some((p) => p.id === a.projectId),
                  )),
            ).length
          }
          label="Active Volunteers"
          tone="green"
        />
        <Kpi
          icon={FolderKanban}
          value={projects.filter((p) => p.status === "Active").length}
          label="Active Projects"
          tone="green"
        />
        <Kpi
          icon={ListChecks}
          value={taskBy("In Progress")}
          label="Tasks In Progress"
          tone="orange"
        />
        <Kpi icon={Hourglass} value={pendingHours} label="Pending Hours" tone="yellow" />
        <Kpi
          icon={Clock}
          value={approvedHours.toFixed(1)}
          label="Approved Volunteer Hours"
          tone="orange"
        />
        <Kpi
          icon={Award}
          value={hasPermission(actor, "certificates.view") ? state.certificates.filter((c) => c.status === "Issued").length : 0}
          label="Certificates Issued"
          tone="red"
        />
        <Kpi icon={Inbox} value={count("Pending")} label="Pending Applications" tone="red" />
      </div>

      <Panel title="Application Overview" className="mt-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Pending" value={count("Pending")} />
          <Stat label="Under Review" value={count("Under Review")} />
          <Stat label="Accepted" value={count("Accepted")} />
          <Stat label="Rejected" value={count("Rejected")} />
          <Stat label="Total Applications" value={applications.length} />
        </div>
      </Panel>

      <section className="mt-6 rounded-lg border bg-card p-5 shadow-card">
        <h2 className="text-xl font-bold">Programme Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and monitor the organisation's programmes, projects, tasks and volunteer
          allocation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton disabled={!hasPermission(actor, "projects.create")} onClick={() => window.location.assign("/admin/projects")}>
            <Plus className="h-4 w-4" /> Create Project
          </ActionButton>
          <ActionButton disabled={!canAccess(actor, "/admin/assignments") || !anyPermission(actor, "tasks.create") || !anyPermission(actor, "tasks.assign")} onClick={() => window.location.assign("/admin/assignments")}>
            <Plus className="h-4 w-4" /> Create Task
          </ActionButton>
          <ActionButton onClick={() => toast("Demonstration data refreshed")}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </ActionButton>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={FolderKanban} value={projects.length} label="Total Projects" />
          <Kpi
            icon={FolderKanban}
            value={projects.filter((p) => p.status === "Active").length}
            label="Active Projects"
            tone="green"
          />
          <Kpi
            icon={ListChecks}
            value={tasks.length - taskBy("Completed")}
            label="Open Tasks"
            tone="orange"
          />
          <Kpi
            icon={Users}
            value={new Set(tasks.map((t) => t.volunteer)).size}
            label="Assigned Volunteers"
          />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Panel
            title="Project Portfolio"
            action={canAccess(actor, "/admin/projects") &&
              <Link to="/admin/projects" className="text-sm font-semibold text-primary">
                View all projects →
              </Link>
            }
          >
            <p className="-mt-2 mb-3 text-sm text-muted-foreground">
              Review project status, timelines and delivery.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2">Project</th>
                    <th className="px-3 py-2">Timeline</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.name} className="border-t">
                      <td className="px-3 py-2 font-semibold">{p.name}</td>
                      <td className="whitespace-nowrap px-3 py-2">{p.dates}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel
            title="Task Monitoring"
            action={canAccess(actor, "/admin/tasks") &&
              <Link to="/admin/tasks" className="text-sm font-semibold text-primary">
                View all tasks →
              </Link>
            }
          >
            <p className="-mt-2 mb-3 text-sm text-muted-foreground">
              Track workload and task completion.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Pending", taskBy("Not Started")],
                ["In Progress", taskBy("In Progress")],
                ["Completed", taskBy("Completed")],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border p-3">
                  <p className="font-display text-2xl font-bold">{v}</p>
                  <p className="text-xs text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Volunteer Allocation"
            action={canAccess(actor, "/admin/assignments") &&
              <Link to="/admin/assignments" className="text-sm font-semibold text-primary">
                Manage assignments →
              </Link>
            }
          >
            <p className="-mt-2 mb-3 text-sm text-muted-foreground">
              Understand how volunteers are assigned across projects.
            </p>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="font-display text-2xl font-bold">{tasks.length}</p>
                <p className="text-xs text-muted-foreground">Active project assignments</p>
              </div>
            </div>
          </Panel>
          <Panel title="Management Alerts">
            <p className="-mt-2 mb-3 text-sm text-muted-foreground">
              Items that may need management attention.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <b>{taskBy("Not Started")}</b> task(s) not yet started
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <b>{pendingHours}</b> hours submission(s) awaiting approval
              </li>
            </ul>
          </Panel>
        </div>
      </section>
    </>
  );
}
