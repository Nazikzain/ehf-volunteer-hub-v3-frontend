import { hasPermission, requirePermission } from "@/lib/demo-roles";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, DataTable } from "./ui";
import { useDemoActor } from "@/lib/demo-context";
import { useWorkflow } from "@/lib/workflow-store";
import {
  usePortal,
  getPortal,
  setPortal,
  scopedProjects,
  assign,
  canOperate,
  event,
  type Task,
} from "@/lib/portal-workflow";
import { run } from "./PortalWorkspaces";
const cls = "w-full rounded-md border bg-card px-3 py-2";
export function AssignmentWorkspace() {
  const s = usePortal(),
    wf = useWorkflow(),
    actor = useDemoActor();
  const [volunteerId, setVolunteer] = useState(""),
    [project, setProject] = useState(""),
    [role, setRole] = useState(""),
    [title, setTitle] = useState(""),
    [due, setDue] = useState("");
  const scoped = scopedProjects(s, actor);
  return (
    <>
      <PageHeader title="Volunteer Assignments" />
      <section className="mb-6 border-b pb-6">
        <h2 className="mb-3 font-bold">Assign Project or Task</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            Volunteer
            <select
              className={cls}
              value={volunteerId}
              onChange={(e) => setVolunteer(e.target.value)}
            >
              <option value="">Select volunteer</option>
              {wf.volunteers.filter(v => hasPermission(actor, "volunteers.view") || s.assignments.some(a => a.volunteerId === v.id && canOperate(s, actor, a.projectId, "volunteers.view"))).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {v.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Project
            <select className={cls} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="">Select authorised project</option>
              {scoped.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsibility
            <input className={cls} value={role} onChange={(e) => setRole(e.target.value)} />
          </label>
          <div className="flex items-end">
            <Button
              disabled={!hasPermission(actor, "assignments.manage", s.projects.find(p => p.id === project)?.name)}
              onClick={() =>
                run(() => {
                  const v = wf.volunteers.find((v) => v.id === volunteerId);
                  if (!v) throw new Error("Select volunteer");
                  setPortal(assign(getPortal(), actor, v, project, role, new Date().toISOString()));
                })
              }
            >
              Assign project
            </Button>
          </div>
          <label>
            Task title
            <input className={cls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Task due date
            <input
              type="date"
              className={cls}
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <Button
            disabled={!canOperate(s, actor, project, "tasks.create") || !canOperate(s, actor, project, "tasks.assign")}
            onClick={() =>
              run(() => {
                const fresh = getPortal();
                if (!canOperate(fresh, actor, project, "tasks.create") || !canOperate(fresh, actor, project, "tasks.assign")) throw new Error("Project outside scope");
                if (
                  !fresh.assignments.some(
                    (a) =>
                      a.volunteerId === volunteerId &&
                      a.projectId === project &&
                      a.status === "Active",
                  )
                )
                  throw new Error("Assign this volunteer to the project first");
                if (!title.trim() || !due) throw new Error("Task title and due date required");
                const at = new Date().toISOString();
                const task: Task = {
                  id: crypto.randomUUID(),
                  volunteerId,
                  projectId: project,
                  title,
                  description: role || "Assigned support task",
                  instructions: "Complete the assigned work and submit a task report.",
                  deliverables: "Activity summary",
                  assignedBy: actor.name,
                  assignedAt: at,
                  start: at.slice(0, 10),
                  due,
                  priority: "Medium",
                  status: "Not Started",
                  progress: 0,
                  notes: "",
                  completionDate: "",
                  history: [{ at, by: actor.name, action: "Task assigned" }],
                };
                setPortal(
                  event(
                    { ...fresh, tasks: [...fresh.tasks, task] },
                    volunteerId,
                    actor.name,
                    "New task assignment",
                    "/portal/tasks",
                    at,
                  ),
                );
              })
            }
          >
            Assign task
          </Button>
        </div>
      </section>
      <DataTable
        columns={[
          "Volunteer ID",
          "Name",
          "Project",
          "Responsibility",
          "Assignment date",
          "Status",
          "Actions",
        ]}
        rows={s.assignments
          .filter((a) => canOperate(s, actor, a.projectId, "assignments.view"))
          .map((a) => [
            a.volunteerId,
            wf.volunteers.find((v) => v.id === a.volunteerId)?.name,
            s.projects.find((p) => p.id === a.projectId)?.name,
            a.role,
            a.date,
            a.status,
            <Button
              variant="outline"
              disabled={a.status === "Completed" || !canOperate(s, actor, a.projectId, "assignments.manage")}
              onClick={() =>
                run(() => {
                  const fresh = getPortal();
                  requirePermission(actor, "assignments.manage", fresh.projects.find(p => p.id === a.projectId)?.name);
                  setPortal({
                    ...fresh,
                    assignments: fresh.assignments.map((x) =>
                      x.id === a.id
                        ? {
                            ...x,
                            status: "Completed",
                            history: [
                              ...x.history,
                              {
                                at: new Date().toISOString(),
                                by: actor.name,
                                action: "Assignment completed",
                              },
                            ],
                          }
                        : x,
                    ),
                  });
                })
              }
            >
              Complete assignment
            </Button>,
          ])}
      />
    </>
  );
}
