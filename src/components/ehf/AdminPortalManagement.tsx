import { hasPermission, requirePermission, useAdminAccess, assignAdminProject, getAdminAccess, setAdminAccess } from "@/lib/demo-roles";
import { useState } from "react";
import { useDemoActor } from "@/lib/demo-context";
import {
  getPortal,
  setPortal,
  usePortal,
  scopedProjects,
  canOperate,
  PROJECT_STATUSES,
  type Project,
} from "@/lib/portal-workflow";
import { Button } from "@/components/ui/button";
import { PageHeader, DataTable } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { run } from "./PortalWorkspaces";
const cls = "w-full rounded-md border bg-card px-3 py-2";
export function AdminProjects() {
  const actor = useDemoActor(),
    s = usePortal();
  const adminAccess = useAdminAccess();
  const [assignedAdmin, setAssignedAdmin] = useState("");
  const [edit, setEdit] = useState<Project | null>(null);
  const rows = scopedProjects(s, actor);
  return (
    <>
      <PageHeader
        title="Project Management"
        action={
          hasPermission(actor, "projects.create") ? (
            <Button
              onClick={() =>
                setEdit({
                  id: crypto.randomUUID(),
                  name: "",
                  description: "",
                  objectives: "",
                  start: "",
                  end: "",
                  status: "Planned",
                  supervisor: "",
                  activities: [],
                })
              }
            >
              Create Project
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          "Project",
          "Admin",
          "Timeline",
          "Unique Volunteers",
          "Progress",
          "Status",
          "Actions",
        ]}
        rows={rows.map((p) => {
          const ts = s.tasks.filter((t) => t.projectId === p.id);
          return [
            p.name,
            p.supervisor,
            `${p.start} – ${p.end}`,
            new Set(s.assignments.filter((a) => a.projectId === p.id).map((a) => a.volunteerId))
              .size,
            `${ts.length ? Math.round(ts.reduce((n, t) => n + t.progress, 0) / ts.length) : 0}%`,
            p.status,
            <Button variant="outline" disabled={!hasPermission(actor, "projects.edit", p.name)} onClick={() => setEdit(structuredClone(p))}>
              Edit project
            </Button>,
          ];
        })}
      />
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {edit && (
            <>
              <DialogHeader>
                <DialogTitle>Project Details</DialogTitle>
              </DialogHeader>
              {(["name", "description", "objectives", "supervisor", "start", "end"] as const).map(
                (k) => (
                  <label key={k} className="capitalize">
                    {k}
                    <input
                      type={k === "start" || k === "end" ? "date" : "text"}
                      className={cls}
                      value={edit[k]}
                      onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                    />
                  </label>
                ),
              )}
              <label>
                Status
                <select
                  className={cls}
                  value={edit.status}
                  onChange={(e) =>
                    setEdit({ ...edit, status: e.target.value as Project["status"] })
                  }
                >
                  {PROJECT_STATUSES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Activities (one per line)
                <textarea
                  className={cls}
                  value={edit.activities.join("\n")}
                  onChange={(e) =>
                    setEdit({ ...edit, activities: e.target.value.split("\n").filter(Boolean) })
                  }
                />
              </label>
              {hasPermission(actor, "admins.assign", edit.name) && <div className="grid gap-2"><label>Assign authorised Admin<select className={cls} value={assignedAdmin} onChange={e => setAssignedAdmin(e.target.value)}><option value="">Select Admin</option>{adminAccess.accounts.filter(a => a.role === "Admin" && a.status === "Active").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><Button variant="outline" onClick={() => run(() => setAdminAccess(assignAdminProject(getAdminAccess(), actor, assignedAdmin, edit.name, new Date().toISOString())))}>Assign Admin</Button></div>}
              <Button
                onClick={() =>
                  run(() => {
                    const fresh = getPortal();
                    const old = fresh.projects.find(p => p.id === edit.id);
                    requirePermission(actor, old ? "projects.edit" : "projects.create", old?.name);
                    if (!edit.name.trim() || !edit.start || !edit.end || edit.end < edit.start)
                      throw new Error("Project name and valid dates required");
                    setPortal({
                      ...fresh,
                      projects: [...fresh.projects.filter((p) => p.id !== edit.id), edit],
                    });
                    setEdit(null);
                  })
                }
              >
                Save project
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
