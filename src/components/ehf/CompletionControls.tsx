import { hasPermission, requirePermission } from "@/lib/demo-roles";
import { useState } from "react";
import { useWorkflow, getWorkflow, setWorkflow } from "@/lib/workflow-store";
import { getPortal, usePortal, setPortal, event } from "@/lib/portal-workflow";
import { getPhase2, usePhase2, setPhase2 } from "@/lib/phase2-store";
import { useDemoActor } from "@/lib/demo-context";
import { Button } from "@/components/ui/button";
import { run } from "./PortalWorkspaces";
export function CompletionControls() {
  const wf = useWorkflow(),
    s = usePortal(),
    phase = usePhase2(),
    actor = useDemoActor();
  const [id, setId] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  if (!hasPermission(actor, "periods.manage")) return null;
  return (
    <section className="mb-6 border-b pb-6">
      <h2 className="mb-3 text-lg font-bold">Volunteering Period Completion</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          Volunteer
          <select
            className="w-full rounded-md border bg-card p-2"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              const c = s.completions.find((c) => c.volunteerId === e.target.value);
              setStart(c?.start ?? "");
              setEnd(c?.end ?? "");
            }}
          >
            <option value="">Select volunteer</option>
            {wf.volunteers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Volunteer start date
          <input
            type="date"
            className="w-full rounded-md border bg-card p-2"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          Volunteer completion date
          <input
            type="date"
            className="w-full rounded-md border bg-card p-2"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <Button
        className="mt-3"
        onClick={() =>
          run(() => {
            requirePermission(actor, "periods.manage");
            if (!id || !start || !end || end < start || end > new Date().toISOString().slice(0, 10))
              throw new Error("Select a volunteer and valid completed period");
            const fresh = getPortal(),
              at = new Date().toISOString();
            setPortal(
              event(
                {
                  ...fresh,
                  completions: [
                    ...fresh.completions.filter((c) => c.volunteerId !== id),
                    { volunteerId: id, start, end, completed: true, approvedBy: actor.name, at },
                  ],
                },
                id,
                actor.name,
                "Volunteering period completion approved",
                "/portal/certificates",
                at,
              ),
            );
            const w = getWorkflow();
            setWorkflow({
              ...w,
              volunteers: w.volunteers.map((v) =>
                v.id === id ? { ...v, startDate: start, endDate: end } : v,
              ),
            });
          })
        }
      >
        Confirm period completion
      </Button>
      <h3 className="mb-2 mt-4 font-bold">Organisation Completion Criteria</h3>
      <label className="block">
        Configured minimum approved hours (0 = no hours threshold)
        <input
          type="number"
          min={0}
          className="mt-1 w-full max-w-xs rounded-md border bg-card p-2"
          value={phase.rules.find((r) => r.final)?.minimumHours ?? 0}
          onChange={(e) => {
            if (!hasPermission(actor, "periods.manage")) return;
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) {
              const p = getPhase2();
              setPhase2({
                ...p,
                rules: p.rules.map((r) => (r.final ? { ...r, minimumHours: n } : r)),
              });
            }
          }}
        />
      </label>
      <label className="mt-3 flex gap-2">
        <input
          type="checkbox"
          checked={phase.rules.find((r) => r.final)?.requireCompletion ?? true}
          onChange={(e) => {
            if (!hasPermission(actor, "periods.manage")) return;
            const p = getPhase2();
            setPhase2({
              ...p,
              rules: p.rules.map((r) =>
                r.final ? { ...r, requireCompletion: e.target.checked } : r,
              ),
            });
          }}
        />
        Require all assigned tasks to be completed or cancelled
      </label>
    </section>
  );
}
