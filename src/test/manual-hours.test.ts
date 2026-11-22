import { describe, expect, it } from "vitest";
import { activeHoursProjects, manualHoursTimes, submitManualHours, type ManualHoursValues } from "@/lib/manual-hours";
import { initialPortal } from "@/lib/portal-workflow";
import { PORTAL_ACTOR, reviewHours, type Actor } from "@/lib/attendance";

const input: ManualHoursValues = { projectId: "P-1", taskId: "T-1", date: "2026-11-11", startTime: "10:00", endTime: "14:30", overnight: false, location: "Community centre", activity: "Workshop support", reason: "Completed workshop support" };
const at = "2026-11-11T15:28:00Z";
const primary: Actor = { role: "Admin", accountId: "U-02", name: "Demo Primary", projects: [] };
const supervisor: Actor = { role: "Admin", accountId: "U-03", name: "Demo Supervisor", projects: ["Community Wellbeing Programme"] };
const submit = (patch: Partial<ManualHoursValues> = {}) => submitManualHours([], initialPortal, PORTAL_ACTOR, { ...input, ...patch }, at);
describe("volunteer manual-only hours", () => {
  it("calculates 10:00 to 14:30 as 4.5 hours", () => expect(manualHoursTimes(input.date, "10:00", "14:30", false).hours).toBe(4.5));
  it("supports 22:00 to 02:00 on the following day as four hours", () => expect(manualHoursTimes("2026-11-11", "22:00", "02:00", true)).toEqual({ start: "2026-11-11T22:00", end: "2026-11-12T02:00", hours: 4 }));
  it("rejects zero-duration records", () => expect(() => submit({ endTime: "10:00" })).toThrow("after"));
  it("rejects negative same-day duration", () => expect(() => submit({ endTime: "09:00" })).toThrow("after"));
  it("rejects incomplete entries", () => expect(() => submit({ startTime: "" })).toThrow());
  it("rejects invalid calendar dates", () => expect(() => submit({ date: "2026-02-30" })).toThrow("valid date"));
  it("requires nonblank reason/comments", () => expect(() => submit({ reason: " " })).toThrow("required"));
  it("limits free text input", () => expect(() => submit({ activity: "x".repeat(1001) })).toThrow());
  it("includes only active assigned projects", () => expect(activeHoursProjects(initialPortal, PORTAL_ACTOR).map(p => p.id)).toEqual(["P-1", "P-2", "P-3"]));
  it("refuses completed project assignments", () => expect(() => submit({ projectId: "P-4", taskId: "" })).toThrow("active assigned"));
  it("refuses projects with inactive assignments", () => {
    const s = structuredClone(initialPortal); s.assignments = s.assignments.map(a => a.projectId === "P-1" ? { ...a, status: "Completed" } : a);
    expect(() => submitManualHours([], s, PORTAL_ACTOR, input, at)).toThrow("active assigned");
  });
  it("refuses a task from another project", () => expect(() => submit({ taskId: "T-2" })).toThrow("selected project"));
  it("refuses another volunteer's task", () => expect(() => submit({ projectId: "P-3", taskId: "T-7" })).toThrow("your tasks"));
  it("allows no task", () => expect(submit({ taskId: "" })[0]?.taskId).toBe(""));
  it("prevents overlapping records for the same volunteer across projects", () => expect(() => submitManualHours(submit(), initialPortal, PORTAL_ACTOR, { ...input, projectId: "P-2", taskId: "T-2" }, at)).toThrow("overlap"));
  it("saves Manual, Pending Approval, identity and submission timestamp", () => expect(submit()[0]).toMatchObject({ type: "Manual", approval: "Pending Approval", volunteerId: "V-1042", createdAt: at, hours: 4.5, taskId: "T-1" }));
  it("preserves all original submitted values after administrator review", () => {
    const rows = submit(); const row = rows[0]; if (!row) throw new Error("Missing submission");
    const approved = reviewHours(rows, row.key, primary, "Approved", "", "Reviewed", at);
    expect(approved[0]?.original).toMatchObject({ volunteerId: "V-1042", project: "Community Wellbeing Programme", taskId: "T-1", activity: "Workshop support", location: "Community centre", reason: input.reason, comments: "", start: "2026-11-11T10:00", end: "2026-11-11T14:30", hours: 4.5, createdAt: at });
  });
  it("allows scoped supervisor approval", () => { const rows=submit(); const row=rows[0]; if (!row) throw new Error("Missing submission"); expect(reviewHours(rows,row.key,supervisor,"Approved","","",at)[0]?.approval).toBe("Approved"); });
  it("refuses out-of-scope supervisor review", () => { const rows=submit(); const row=rows[0]; if (!row) throw new Error("Missing submission"); expect(() => reviewHours(rows,row.key,{...supervisor,accountId:"U-04",projects:["Digital Skills Support"]},"Approved","","",at)).toThrow(); });
  it("requires a rejection reason", () => { const rows=submit(); const row=rows[0]; if (!row) throw new Error("Missing submission"); expect(() => reviewHours(rows,row.key,primary,"Rejected"," ","",at)).toThrow("reason"); });
  it("refuses volunteer self-approval", () => { const rows=submit(); const row=rows[0]; if (!row) throw new Error("Missing submission"); expect(() => reviewHours(rows,row.key,PORTAL_ACTOR,"Approved","","",at)).toThrow(); });
});