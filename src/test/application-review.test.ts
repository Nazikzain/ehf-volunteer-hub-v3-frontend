import { describe, expect, it } from "vitest";
import { applications, volunteers } from "@/lib/demo-data";
import { addNote, changeStatus, type Result } from "@/lib/volunteer-workflow";

const ref = "EHF-VOL-2026-0158";
const reviewer = "Demo Primary Administrator";
const at = "10 Nov 2026 23:31";
const primary = { role: "Admin", accountId: "U-02" };
const fresh = () => structuredClone({ applications, volunteers });
function stateOf(result: Result) {
  if (!result.ok) throw new Error(result.error);
  return result.state;
}
const reviewed = () => stateOf(changeStatus(fresh(), ref, "Under Review", reviewer, at, primary));

describe("application review safeguards", () => {
  it("records review metadata without removing submitted history", () => {
    const before = fresh().applications.find(a => a.ref === ref);
    const after = reviewed().applications.find(a => a.ref === ref);
    expect(after).toMatchObject({ status: "Under Review", reviewer, reviewStartedAt: at });
    expect(after?.history.slice(0, -1)).toEqual(before?.history);
    expect(after?.history.at(-1)).toMatchObject({ at, by: reviewer, action: "Status changed to Under Review" });
  });
  it("rejection preserves history, saves its reason and creates no profile", () => {
    const before = reviewed();
    const after = stateOf(changeStatus(before, ref, "Rejected", reviewer, at, { ...primary, reason: "No available placement" }));
    expect(after.volunteers).toEqual(before.volunteers);
    const app = after.applications.find(a => a.ref === ref);
    expect(app).toMatchObject({ status: "Rejected", rejectionReason: "No available placement", decidedBy: reviewer, decisionDate: at });
    expect(app?.volunteerId).toBeUndefined();
    expect(app?.history.slice(0, -1)).toEqual(before.applications.find(a => a.ref === ref)?.history);
  });
  it.each(["Accepted", "Rejected"] as const)("locks all decisions after %s", status => {
    const state = stateOf(changeStatus(reviewed(), ref, status, reviewer, at, { ...primary, reason: "Not suitable" }));
    for (const next of ["Under Review", "Accepted", "Rejected"] as const) {
      expect(changeStatus(state, ref, next, reviewer, at, { ...primary, reason: "Retry" }).ok).toBe(false);
    }
  });
  it.each(["Admin", "Technical System Administrator", "Volunteer"])("refuses both final decisions for %s", role => {
    for (const to of ["Accepted", "Rejected"] as const) {
      expect(changeStatus(reviewed(), ref, to, "Other", at, { role, reason: "Denied" }).ok).toBe(false);
    }
    expect(addNote(reviewed(), ref, "Other", at, "Denied note", { role }).ok).toBe(false);
  });
  it("adds notes and history separately from the rejection reason", () => {
    const before = reviewed();
    const after = stateOf(addNote(before, ref, reviewer, at, "Discuss availability", primary));
    const app = after.applications.find(a => a.ref === ref);
    expect(app?.notes.at(-1)).toMatchObject({ at, by: reviewer, note: "Discuss availability" });
    expect(app?.history.at(-1)).toMatchObject({ at, by: reviewer, action: "Internal review note added" });
    expect(app?.history.slice(0, -1)).toEqual(before.applications.find(a => a.ref === ref)?.history);
    expect(app?.rejectionReason).toBeUndefined();
  });
});