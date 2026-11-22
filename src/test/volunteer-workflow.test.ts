import { describe, expect, it } from "vitest";
import { applications, volunteers } from "@/lib/demo-data";
import { allowedNext, APPLICATION_STATUSES, changeStatus, setAvailabilityType, validateAvailability, type WorkflowState } from "@/lib/volunteer-workflow";

const fresh = (): WorkflowState => structuredClone({ applications, volunteers });
const pending = "EHF-VOL-2026-0158";
const identity = { actor: { role: "Admin", accountId: "U-02" } };
const at = "10 Nov 2026 21:00";
const ok = (r: ReturnType<typeof changeStatus>) => { if (!r.ok) throw new Error(r.error); return r; };

describe("application workflow", () => {
  it("uses exactly the four statuses, and the demo data uses only them", () => {
    expect(APPLICATION_STATUSES).toEqual(["Pending", "Under Review", "Accepted", "Rejected"]);
    for (const a of applications) expect(APPLICATION_STATUSES).toContain(a.status);
  });
  it("moves Pending → Under Review → Accepted/Rejected only", () => {
    expect(allowedNext("Pending")).toEqual(["Under Review"]);
    expect(allowedNext("Under Review")).toEqual(["Accepted", "Rejected"]);
    expect(changeStatus(fresh(), pending, "Accepted", "A", at, identity).ok).toBe(false);
  });
  it("requires a rejection reason", () => {
    const s = ok(changeStatus(fresh(), pending, "Under Review", "A", at, identity)).state;
    expect(changeStatus(s, pending, "Rejected", "A", at, { ...identity, reason: "  " })).toEqual({ ok: false, error: "A rejection reason is required" });
    const r = ok(changeStatus(s, pending, "Rejected", "Demo Supervisor", at, { ...identity, reason: "No vacancy" })).state.applications.find((a) => a.ref === pending)!;
    expect(r).toMatchObject({ status: "Rejected", rejectionReason: "No vacancy", decidedBy: "Demo Supervisor", decisionDate: at });
  });
  it("accepting creates exactly one linked volunteer profile and records the decision", () => {
    const s0 = fresh();
    const s1 = ok(changeStatus(s0, pending, "Under Review", "A", at, identity)).state;
    const r = ok(changeStatus(s1, pending, "Accepted", "Demo Primary Administrator", at, identity));
    expect(r.state.volunteers).toHaveLength(s0.volunteers.length + 1);
    const v = r.state.volunteers.find((x) => x.applicationRef === pending)!;
    const a = r.state.applications.find((x) => x.ref === pending)!;
    expect(a.volunteerId).toBe(v.id);
    expect(a).toMatchObject({ decidedBy: "Demo Primary Administrator", decisionDate: at });
    expect(a.history.map((h) => h.action)).toContain(`Volunteer profile ${v.id} created`);
    // Processing again is refused, so no second profile.
    expect(changeStatus(r.state, pending, "Accepted", "A", at, identity).ok).toBe(false);
  });
  it("links to an existing profile with the same email instead of duplicating", () => {
    const s0 = fresh();
    s0.applications[0] = { ...s0.applications[0]!, email: "AMINA.H@example.org" };
    const s1 = ok(changeStatus(s0, pending, "Under Review", "A", at, identity)).state;
    const r = ok(changeStatus(s1, pending, "Accepted", "A", at, identity));
    expect(r.createdVolunteerId).toBeUndefined();
    expect(r.state.volunteers).toHaveLength(s0.volunteers.length);
    expect(r.state.applications[0]!.volunteerId).toBe("V-1042");
  });
});

describe("availability", () => {
  it("requires at least one day for Specific Days of the Week", () => {
    expect(validateAvailability("Specific Days of the Week", [])).toBe("Please select at least one day you are available");
    expect(validateAvailability("Specific Days of the Week", ["Monday", "Friday"])).toBeNull();
    expect(validateAvailability("Flexible", [])).toBeNull();
    expect(validateAvailability("Weekends", [])).not.toBeNull();
  });
  it("clears weekdays when Flexible is chosen", () => {
    expect(setAvailabilityType("Flexible", ["Monday"])).toEqual([]);
    expect(setAvailabilityType("Specific Days of the Week", ["Monday"])).toEqual(["Monday"]);
  });
});
