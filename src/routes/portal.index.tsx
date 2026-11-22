import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Clock, FolderKanban, ListChecks } from "lucide-react";
import { Kpi, PageHeader } from "@/components/ehf/ui";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/ehf/DetailBits";
import { usePortalActor } from "@/lib/portal-actor";
import { usePortal, ownTasks, ownAssignments } from "@/lib/portal-workflow";
import { usePhase2 } from "@/lib/phase2-store";
import { totals } from "@/lib/attendance";
import { meta } from "@/lib/meta";
export const Route = createFileRoute("/portal/")({
  head: () => meta("My Dashboard"),
  component: Dash,
});
function Dash() {
  const actor = usePortalActor(),
    s = usePortal(),
    p = usePhase2(),
    tasks = ownTasks(s, actor.volunteerId ?? ""),
    attendance = p.attendance.filter((r) => r.volunteerId === actor.volunteerId),
    sum = totals(attendance),
    assignments = ownAssignments(s, actor.volunteerId ?? ""),
    active = attendance.find((r) => r.attendance === "Checked In");
  return (
    <>
      <PageHeader title="My Dashboard" subtitle={`Welcome back, ${actor.name}`} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          [
            FolderKanban,
            assignments.filter(
              (a) =>
                a.status === "Active" &&
                s.projects.find((p) => p.id === a.projectId)?.status === "Active",
            ).length,
            "Active Projects",
          ],
          [ListChecks, tasks.length, "Assigned Tasks"],
          [ListChecks, tasks.filter((t) => t.status === "Completed").length, "Completed Tasks"],
          [
            ListChecks,
            tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status)).length,
            "Pending Tasks",
          ],
          [Clock, sum.approvedHours, "Approved Volunteer Hours"],
          [Clock, sum.pendingHours, "Pending Hours Approval"],
          [
            Award,
            p.certificates.filter(
              (c) => c.volunteerId === actor.volunteerId && c.status === "Issued" && c.valid,
            ).length,
            "Issued Certificate",
          ],
        ].map(([Icon, value, label]) => (
          <Kpi
            key={String(label)}
            icon={Icon as typeof Clock}
            value={value as number}
            label={String(label)}
          />
        ))}
      </div>
      <section className="my-6 border-b pb-6">
        <h2 className="mb-3 text-lg font-bold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["/portal/hours", "Enter Manual Hours"],
              ["/portal/projects", "View Projects"],
              ["/portal/tasks", "View Tasks"],
              ["/portal/task-reports", "Submit Task Report"],
              ["/portal/hours", "View My Hours"],
              ["/portal/certificates", "View My Certificate"],
            ] as [string, string][]
          ).map(([to, label]) => (
            <Button asChild key={label} variant="outline">
              <Link to={to}>{label}</Link>
            </Button>
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold">Current Activity</h2>
          <p>{active ? `Active attendance: ${active.project}` : "No active attendance session"}</p>
          <p className="my-2">
            {
              s.reports.filter(
                (r) =>
                  r.volunteerId === actor.volunteerId &&
                  ["Submitted for Review", "Under Review"].includes(r.status),
              ).length
            }{" "}
            reports awaiting review
          </p>
          {tasks
            .filter((t) => t.status === "In Progress")
            .map((t) => (
              <p key={t.id}>
                {t.title} · {t.progress}%
              </p>
            ))}
          <h3 className="mb-2 mt-4 font-semibold">Latest Admin Feedback</h3>
          {s.reports
            .filter((r) => r.volunteerId === actor.volunteerId && r.feedback)
            .slice(-3)
            .map((r) => (
              <p key={r.id}>
                {r.title}: {r.feedback}
              </p>
            ))}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Upcoming Activities & Deadlines</h2>
          {s.projects
            .filter((p) => assignments.some((a) => a.projectId === p.id && a.status === "Active"))
            .flatMap((p) =>
              p.activities.map((a) => (
                <p key={`${p.id}-${a}`}>
                  {p.name}: {a}
                </p>
              )),
            )}
          {tasks
            .filter((t) => !["Completed", "Cancelled"].includes(t.status))
            .map((t) => (
              <p key={t.id} className="mt-2">
                {t.title} · due {t.due} · {t.status}
              </p>
            ))}
        </section>
      </div>
      <section className="mt-6 border-t pt-6">
        <h2 className="mb-3 text-lg font-bold">Recent Activity</h2>
        <Timeline
          entries={[
            ...s.events.filter((e) => e.volunteerId === actor.volunteerId),
            ...attendance.map((r) => ({
              at: r.updatedAt,
              by: r.reviewer || actor.name,
              action: `${r.attendance} · ${r.project} · ${r.approval}`,
            })),
            ...p.certificates
              .filter((c) => c.volunteerId === actor.volunteerId)
              .flatMap((c) => c.history),
          ]
            .sort((a, b) => b.at.localeCompare(a.at))
            .slice(0, 15)}
        />
      </section>
    </>
  );
}
