import { hasPermission } from "@/lib/demo-roles";
import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataTable, PageHeader, Panel } from "@/components/ehf/ui";
import { projects, volunteers } from "@/lib/demo-data";
import { AttendanceWorkspace } from "@/components/ehf/AttendanceWorkspace";
import { usePhase2 } from "@/lib/phase2-store";
import { totals, visibleAttendance } from "@/lib/attendance";
import { useDemoActor } from "@/lib/demo-context";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin/reports")({
  head: () => meta("Reports & Export"),
  component: Reports,
});

function Reports() {
  const state = usePhase2();
  const actor = useDemoActor();
  const scoped = state.attendance.filter(r => hasPermission(actor, "reports.view", r.project));
  const scopedVolunteers = volunteers.filter((v) => scoped.some((r) => r.volunteerId === v.id));
  return (
    <>
      <PageHeader
        title="Reports & Export"
        subtitle="Volunteer statistics, participation and hours"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Volunteer Hours by Month">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={Object.entries(scoped.filter(r => r.approval === "Approved").reduce<Record<string, number>>((g,r) => { const month=r.date.slice(0,7); g[month]=(g[month]??0)+r.hours; return g; },{})).map(([month,hours]) => ({month,hours}))}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} width={30} />
                <Tooltip />
                <Bar dataKey="hours" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Project Participation">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={projects.filter(p => hasPermission(actor, "reports.view", p.name))} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" width={150} fontSize={11} />
                <Tooltip />
                <Bar dataKey="volunteers" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <div className="mt-8">
        <AttendanceWorkspace reports />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Volunteer Hours Summary</h2>
      <DataTable
        columns={["Volunteer", "Languages", "Approved Hours"]}
        rows={scopedVolunteers.map((v) => [
          v.name,
          v.languages,
          totals(scoped.filter((r) => r.volunteerId === v.id)).approvedHours,
        ])}
      />
    </>
  );
}
