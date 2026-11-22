import { describe, expect, it } from "vitest";
import { initialPhase2 } from "@/lib/phase2-store";
import { volunteers } from "@/lib/demo-data";
import { selectedVolunteerAttendance, type Actor } from "@/lib/attendance";
import {
  editCertificate,
  eligibility,
  issuedCertificates,
  issueCertificate,
  prepareCertificate,
} from "@/lib/certificate-workflow";

const actor: Actor = {
  role: "Admin", accountId: "U-02",
  name: "Demo Primary Administrator",
  projects: [],
};
const at = "2026-11-10T23:13:00Z";
function fixture() {
  const state = structuredClone(initialPhase2);
  const volunteer = volunteers.find((v) => v.id === "V-1042");
  const rule = { ...state.rules[0], key: "contribution", final: false, title: "Certificate of Volunteering", project: "Community Wellbeing Programme", minimumHours: 20, requireCompletion: false, requiredTasks: [], additional: "", automation: "Manual Generation" as const, approveEmail: true };
  state.rules = [rule];
  const template = state.templates[0];
  if (!volunteer || !rule || !template) throw new Error("Missing fixtures");
  const draft = prepareCertificate(
    [],
    actor,
    volunteer,
    rule,
    state.attendance,
    state.achievements,
    template,
    at,
  );
  const c = draft[0];
  if (!c) throw new Error("No draft");
  const issued = issueCertificate(
    draft,
    c.number,
    actor,
    at,
    state.attendance,
    state.rules,
    state.achievements,
  );
  return { state, volunteer, rule, template, draft, issued, c };
}
describe("volunteer-based attendance", () => {
  it("returns no detailed records before selecting a volunteer or after clearing", () => {
    expect(selectedVolunteerAttendance(initialPhase2.attendance, "")).toEqual([]);
  });
  it("returns only V-1042's four attendance records without deleting any records", () => {
    const rows = structuredClone(initialPhase2.attendance);
    const selected = selectedVolunteerAttendance(rows, "V-1042");
    expect(selected).toHaveLength(4);
    expect(selected.every((r) => r.volunteerId === "V-1042")).toBe(true);
    expect(rows).toEqual(initialPhase2.attendance);
  });
});
describe("certificate management corrections", () => {
  it("issued history excludes drafts and scopes portal records to their volunteer", () => {
    const { draft, issued } = fixture();
    expect(issuedCertificates(draft)).toEqual([]);
    expect(issuedCertificates(issued, "V-1042")).toHaveLength(1);
    expect(issuedCertificates(issued, "V-1031")).toEqual([]);
  });
  it("allows organisation-wide approved-hour requirements without a project", () => {
    const { state, rule } = fixture();
    expect(
      eligibility(
        "V-1042",
        { ...rule, project: "", minimumHours: 24 },
        state.attendance,
        state.achievements,
      ),
    ).toMatchObject({ eligible: true, hours: 24 });
    expect(
      eligibility(
        "V-1042",
        { ...rule, project: "", minimumHours: 25 },
        state.attendance,
        state.achievements,
      ).eligible,
    ).toBe(false);
  });
  it("refuses inactive designs and unrelated projects", () => {
    const { state, volunteer, rule, template } = fixture();
    expect(() =>
      prepareCertificate(
        [],
        actor,
        volunteer,
        rule,
        state.attendance,
        state.achievements,
        { ...template, active: false },
        at,
      ),
    ).toThrow("active");
    expect(() =>
      prepareCertificate(
        [],
        actor,
        volunteer,
        { ...rule, project: "Unrelated", minimumHours: 0 },
        state.attendance,
        state.achievements,
        template,
        at,
      ),
    ).toThrow("associated");
  });
  it("edits authorised display data, retains identity/number/date and adds history", () => {
    const { state, issued, c, template } = fixture();
    const updated = editCertificate(
      issued,
      c.number,
      actor,
      {
        title: "Corrected contribution certificate",
        project: c.project,
        template: { ...template, signatory: "Provided demo signatory" },
      },
      state.attendance,
      state.rules,
      state.achievements,
      at,
    );
    expect(updated[0]).toMatchObject({
      number: c.number,
      volunteerId: "V-1042",
      name: "Amina Hassan",
      issuedAt: at,
      title: "Corrected contribution certificate",
      hours: 24,
    });
    expect(updated[0]?.history).toHaveLength(3);
    expect(updated[0]?.template.signatory).toBe("Provided demo signatory");
    expect(state.attendance).toEqual(initialPhase2.attendance);
  });
  it("recalculates corrected certificate hours from approved attendance only", () => {
    const { state, issued, c, template } = fixture();
    const rows = state.attendance.map((r) =>
      r.volunteerId === "V-1042" && r.approval === "Approved" ? { ...r, hours: 7 } : r,
    );
    const updated = editCertificate(
      issued,
      c.number,
      actor,
      { title: c.title, project: c.project, template },
      rows,
      state.rules,
      state.achievements,
      at,
    );
    expect(updated[0]?.hours).toBe(21);
  });
  it("does not bypass project criteria by clearing the project or allow technical edits", () => {
    const { state, issued, c, template } = fixture();
    expect(() =>
      editCertificate(
        issued,
        c.number,
        actor,
        { title: c.title, project: "", template },
        state.attendance,
        state.rules,
        state.achievements,
        at,
      ),
    ).toThrow("requires a project");
    expect(() =>
      editCertificate(
        issued,
        c.number,
        { ...actor, role: "Technical System Administrator" },
        { title: c.title, project: c.project, template },
        state.attendance,
        state.rules,
        state.achievements,
        at,
      ),
    ).toThrow("Permission");
  });
});
