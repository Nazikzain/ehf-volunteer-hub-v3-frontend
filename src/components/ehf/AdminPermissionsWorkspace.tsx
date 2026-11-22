import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, DataTable } from "./ui";
import { PortalProvisioning } from "./PortalProvisioning";
import { useDemoActor } from "@/lib/demo-context";
import { usePortal } from "@/lib/portal-workflow";
import { DEMO_ROLES, PERMISSIONS, useAdminAccess, getAdminAccess, setAdminAccess, grantPermission, revokePermission, saveDemoAccount, type DemoAccount, type Permission } from "@/lib/demo-roles";
import { run } from "./PortalWorkspaces";

const cls = "w-full rounded-md border bg-card px-3 py-2 text-sm";
export function AdminPermissionsWorkspace() {
  const actor = useDemoActor(), state = useAdminAccess(), portal = usePortal();
  const [selectedId, setSelectedId] = useState("U-03");
  const [permission, setPermission] = useState<Permission>("projects.view");
  const [project, setProject] = useState("");
  const [edit, setEdit] = useState<DemoAccount | null>(null);
  const selected = state.accounts.find(a => a.id === selectedId && a.role === "Admin");
  return <>
    <PageHeader title="Users & Permissions" subtitle="Synthetic accounts · changes are not saved" action={<Button onClick={() => setEdit({ id: crypto.randomUUID(), name: "", email: "", role: "Admin", lastLogin: "—", status: "Active" })}>Add User</Button>} />
    <DataTable columns={["ID", "Name", "Email", "Role", "Status", "Actions"]} rows={state.accounts.map(a => [a.id, a.name, a.email, a.role, a.status, <Button variant="outline" onClick={() => setEdit({ ...a })}>Edit {a.name}</Button>])} />
    <section className="my-6 border-b pb-6">
      <h2 className="mb-3 text-lg font-bold">Admin Permissions</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>Admin account<select className={cls} value={selectedId} onChange={e => setSelectedId(e.target.value)}><option value="">Select Admin</option>{state.accounts.filter(a => a.role === "Admin").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label>Operational permission<select className={cls} value={permission} onChange={e => setPermission(e.target.value as Permission)}>{PERMISSIONS.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
        <label>Permission scope<select className={cls} value={project} onChange={e => setProject(e.target.value)}><option value="">Organisation-wide</option>{portal.projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></label>
      </div>
      <Button className="my-3" disabled={!selected} onClick={() => run(() => setAdminAccess(grantPermission(getAdminAccess(), actor, selectedId, permission, project, new Date().toISOString())))}>Grant permission</Button>
      <DataTable columns={["Permission", "Scope", "Granted", "Actions"]} rows={state.grants.filter(g => g.accountId === selectedId && !g.revokedAt).map(g => [g.permission, g.project || "Organisation-wide", g.at, <Button variant="outline" onClick={() => run(() => setAdminAccess(revokePermission(getAdminAccess(), actor, g.id, new Date().toISOString())))}>Revoke {g.permission} · {g.project || "Organisation-wide"}</Button>])} />
    </section>
    <section className="my-6">
      <h2 className="mb-3 text-lg font-bold">Permission & Account History</h2>
      <DataTable columns={["Date", "Actor", "Account", "Action", "Permission", "Scope"]} rows={[...state.history].reverse().map(h => [h.at, state.accounts.find(a => a.id === h.by)?.name ?? h.by, state.accounts.find(a => a.id === h.accountId)?.name ?? h.accountId, h.action, h.permission ?? "—", h.project || "Organisation-wide"])} />
    </section>
    <PortalProvisioning embedded />
    <Dialog open={!!edit} onOpenChange={o => !o && setEdit(null)}><DialogContent><DialogHeader><DialogTitle>{edit && state.accounts.some(a => a.id === edit.id) ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>{edit && <div className="grid gap-3">
      <label>Name<input className={cls} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></label>
      <label>Email<input type="email" className={cls} value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} /></label>
      <label>Role<select className={cls} disabled={state.accounts.some(a => a.id === edit.id)} value={edit.role} onChange={e => { const role = DEMO_ROLES.find(r => r === e.target.value); if (role) setEdit({ ...edit, role }); }}>{DEMO_ROLES.map(r => <option key={r}>{r}</option>)}</select></label>
      <label>Status<select className={cls} value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}>{["Active", "Inactive", "Suspended"].map(s => <option key={s}>{s}</option>)}</select></label>
      <Button onClick={() => run(() => { setAdminAccess(saveDemoAccount(getAdminAccess(), actor, edit, new Date().toISOString())); setEdit(null); })}>Save User (demo)</Button>
    </div>}</DialogContent></Dialog>
  </>;
}