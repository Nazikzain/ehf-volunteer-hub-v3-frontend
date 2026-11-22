import { requirePermission } from "./demo-roles";
import type { Attendance, Actor } from "./attendance";
import { getPortal, type Completion } from "./portal-workflow";
import type { Volunteer } from "./volunteer-workflow";
export type CertificateRule = {
  final?: boolean | undefined;
  key: string;
  title: string;
  project: string;
  minimumHours: number;
  requireCompletion: boolean;
  requiredTasks: string[];
  additional: string;
  automation: "Manual Generation" | "Automatic Generation" | "Automatic Generation and Email";
  approveEmail: boolean;
};
export type Achievement = {
  volunteerId: string;
  project: string;
  completed: boolean;
  tasks: string[];
  additionalMet: boolean;
  completionDate: string;
};
export type CertificateTemplate = {
  key: string;
  name: string;
  title?: string | undefined;
  filename?: string | undefined;
  bytes?: Uint8Array | undefined;
  mime?: string | undefined;
  previewUrl?: string | undefined;
  active: boolean;
  signatory: string;
  signatoryTitle: string;
  signatureBytes?: Uint8Array | undefined;
  signatureMime?: string | undefined;
  logo: boolean;
  nameY: number;
  detailY: number;
};
export type Certificate = {
  final?: boolean | undefined;
  startDate?: string | undefined;
  replaces?: string;
  number: string;
  volunteerId: string;
  name: string;
  project: string;
  title: string;
  hours: number;
  completionDate: string;
  issuedAt: string;
  status: "Pending Issue" | "Issued";
  emailStatus: "Not Sent" | "Pending" | "Email Sent" | "Email Failed";
  ruleKey: string;
  template: CertificateTemplate;
  history: { at: string; action: string; by: string; recipient?: string | undefined }[];
  valid: boolean;
  attendanceKeys: string[];
  emailRecipient?: string | undefined;
  emailAt?: string | undefined;
};
export function eligibility(
  volunteerId: string,
  rule: CertificateRule,
  rows: Attendance[],
  achievements: Achievement[],
) {
  const records = rows.filter(
    (r) =>
      r.volunteerId === volunteerId &&
      (!rule.project || r.project === rule.project) &&
      r.approval === "Approved",
  );
  const hours = Math.round(records.reduce((n, r) => n + r.hours, 0) * 100) / 100;
  const a = achievements.find((a) => a.volunteerId === volunteerId && a.project === rule.project);
  const reasons: string[] = [];
  if (rule.final) {
    const s = getPortal(),
      completion = s.completions.find((c) => c.volunteerId === volunteerId);
    if (!completion?.completed || !completion.end || !completion.approvedBy)
      reasons.push("Volunteering period completion must be approved");
    if (
      rows.some(
        (r) =>
          r.volunteerId === volunteerId &&
          (r.approval === "Pending Approval" ||
            r.corrections.some((c) => c.status === "Pending") ||
            r.attendance === "Checked In"),
      )
    )
      reasons.push("Attendance approvals or corrections remain unresolved");
    if (
      rule.requireCompletion &&
      s.tasks.some(
        (t) => t.volunteerId === volunteerId && !["Completed", "Cancelled"].includes(t.status),
      )
    )
      reasons.push("Required task completion approvals remain unresolved");
    if (
      rule.requiredTasks.some(
        (id) =>
          !s.tasks.some(
            (t) => t.id === id && t.volunteerId === volunteerId && t.status === "Completed",
          ),
      )
    )
      reasons.push("Required tasks incomplete");
    if (
      s.reports.some(
        (r) =>
          r.volunteerId === volunteerId &&
          ["Submitted for Review", "Under Review", "Changes Requested"].includes(r.status),
      )
    )
      reasons.push("Task report approvals remain unresolved");
  }
  if (hours < rule.minimumHours) reasons.push(`${rule.minimumHours} approved hours required`);
  if (!rule.final && rule.requireCompletion && !a?.completed)
    reasons.push("Project completion required");
  if (!rule.final && rule.requiredTasks.some((t) => !a?.tasks.includes(t)))
    reasons.push("Required tasks incomplete");
  if (rule.additional && !a?.additionalMet) reasons.push(rule.additional);
  return {
    eligible: reasons.length === 0,
    hours,
    reasons,
    records,
    completionDate: rule.final
      ? (getPortal().completions.find((c) => c.volunteerId === volunteerId)?.end ?? "")
      : (a?.completionDate ?? ""),
  };
}
function primary(actor: Actor) {
  requirePermission(actor, "certificates.manage");
}
export function prepareCertificate(
  list: Certificate[],
  actor: Actor,
  volunteer: Volunteer,
  rule: CertificateRule,
  rows: Attendance[],
  achievements: Achievement[],
  template: CertificateTemplate,
  at: string,
): Certificate[] {
  primary(actor);
  if (rule.final && rule.project) throw new Error("Final certificates cannot be project-specific");
  if (!template.active) throw new Error("Select an active certificate template");
  if (
    rule.project &&
    !rows.some((r) => r.volunteerId === volunteer.id && r.project === rule.project) &&
    !achievements.some((a) => a.volunteerId === volunteer.id && a.project === rule.project)
  )
    throw new Error("Select a project associated with this volunteer");
  const e = eligibility(volunteer.id, rule, rows, achievements);
  if (!e.eligible) throw new Error(e.reasons.join("; "));
  if (
    list.some(
      (c) =>
        c.volunteerId === volunteer.id &&
        (rule.final ? c.final && c.valid : c.ruleKey === rule.key),
    )
  )
    throw new Error(
      "A certificate already exists for this volunteer and achievement; reissue the original record",
    );
  const seq = list.reduce((n, c) => Math.max(n, Number(c.number.split("-").at(-1)) || 0), 0) + 1;
  const number = `DEMO-EHF-${at.slice(0, 4)}-${String(seq).padStart(5, "0")}`;
  return [
    ...list,
    {
      number,
      final: rule.final,
      startDate: rule.final
        ? getPortal().completions.find((c) => c.volunteerId === volunteer.id)?.start
        : undefined,
      volunteerId: volunteer.id,
      name: volunteer.name,
      project: rule.project,
      title: template.title || rule.title,
      hours: e.hours,
      completionDate: e.completionDate,
      issuedAt: "",
      status: "Pending Issue",
      emailStatus: "Not Sent",
      ruleKey: rule.key,
      template: structuredClone({ ...template, previewUrl: undefined }),
      history: [{ at, action: "Demo certificate prepared", by: actor.name }],
      valid: true,
      attendanceKeys: e.records.map((r) => r.key),
    },
  ];
}
export function editCertificate(
  list: Certificate[],
  number: string,
  actor: Actor,
  patch: Pick<Certificate, "title" | "project" | "template">,
  rows: Attendance[],
  rules: CertificateRule[],
  achievements: Achievement[],
  at: string,
): Certificate[] {
  primary(actor);
  const c = list.find((c) => c.number === number && c.status === "Issued");
  if (!c) throw new Error("Only issued certificates can be edited");
  if (!patch.title.trim()) throw new Error("Certificate title is required");
  const rule = rules.find((r) => r.key === c.ruleKey);
  if (c.final && patch.project) throw new Error("Final certificate hours cover all projects");
  if (!rule) throw new Error("Certificate criteria not found");
  if (rule.project && !patch.project)
    throw new Error("A project-specific certificate requires a project");
  if (
    patch.project &&
    !rows.some((r) => r.volunteerId === c.volunteerId && r.project === patch.project) &&
    !achievements.some((a) => a.volunteerId === c.volunteerId && a.project === patch.project)
  )
    throw new Error("Select a project associated with this volunteer");
  const e = eligibility(c.volunteerId, { ...rule, project: patch.project }, rows, achievements);
  if (!e.eligible) throw new Error(e.reasons.join("; "));
  return list.map((x) =>
    x.number === number
      ? {
          ...c,
          ...patch,
          template: structuredClone({ ...patch.template, previewUrl: undefined }),
          hours: e.hours,
          attendanceKeys: e.records.map((r) => r.key),
          completionDate: e.completionDate,
          history: [
            ...c.history,
            { at, action: "Demo certificate information corrected", by: actor.name },
          ],
        }
      : x,
  );
}
export function issuedCertificates(list: Certificate[], volunteerId?: string) {
  return list.filter(
    (c) => c.status === "Issued" && c.valid && (!volunteerId || c.volunteerId === volunteerId),
  );
}
export function issueCertificate(
  list: Certificate[],
  number: string,
  actor: Actor,
  at: string,
  rows: Attendance[],
  rules: CertificateRule[],
  achievements: Achievement[],
): Certificate[] {
  primary(actor);
  const c = list.find((c) => c.number === number);
  if (!c || c.status !== "Pending Issue")
    throw new Error("Only a pending certificate can be issued");
  const rule = rules.find((r) => r.key === c.ruleKey);
  if (!rule) throw new Error("Certificate criteria not found");
  const e = eligibility(c.volunteerId, rule, rows, achievements);
  if (!e.eligible) throw new Error("Volunteer no longer meets the eligibility requirements");
  if (
    c.final &&
    list.some(
      (x) =>
        x.number !== number &&
        x.volunteerId === c.volunteerId &&
        x.final &&
        x.valid &&
        x.status === "Issued",
    )
  )
    throw new Error("One final certificate already issued");
  return list.map((x) =>
    x.number === number
      ? {
          ...c,
          hours: e.hours,
          attendanceKeys: e.records.map((r) => r.key),
          status: "Issued",
          issuedAt: at,
          history: [...c.history, { at, action: "Demo certificate issued", by: actor.name }],
        }
      : x,
  );
}
export function certificateAction(
  list: Certificate[],
  number: string,
  actor: Actor,
  at: string,
  action: "Reissue" | "Email Sent" | "Email Failed",
  recipient?: string,
): Certificate[] {
  primary(actor);
  const c = list.find((c) => c.number === number);
  if (!c || c.status !== "Issued") throw new Error("Issue the certificate first");
  if (action !== "Reissue" && !recipient) throw new Error("Volunteer email not available");
  return list.map((x) =>
    x.number === number
      ? {
          ...c,
          ...(action === "Reissue"
            ? {}
            : { emailStatus: action, emailRecipient: recipient, emailAt: at }),
          history: [
            ...c.history,
            {
              at,
              by: actor.name,
              action:
                action === "Reissue"
                  ? "Demo reissue — original preserved"
                  : `Simulated ${action.toLowerCase()}`,
              recipient,
            },
          ],
        }
      : x,
  );
}
export function verification(list: Certificate[], number: string) {
  const c = list.find((c) => c.number === number && c.status === "Issued");
  return c
    ? {
        number: c.number,
        name: c.name,
        project: c.project,
        issueDate: c.issuedAt,
        validity: c.valid ? "Valid (demo only)" : "Revoked (demo only)",
      }
    : null;
}

export function revokeCertificate(
  list: Certificate[],
  number: string,
  actor: Actor,
  reason: string,
  at: string,
) {
  primary(actor);
  if (!reason.trim()) throw new Error("Revocation reason required");
  const c = list.find((c) => c.number === number && c.status === "Issued" && c.valid);
  if (!c) throw new Error("Valid issued certificate not found");
  return list.map((x) =>
    x.number === number
      ? {
          ...x,
          valid: false,
          history: [...x.history, { at, by: actor.name, action: `Revoked: ${reason.trim()}` }],
        }
      : x,
  );
}
export function replaceCertificate(list: Certificate[], number: string, actor: Actor, at: string) {
  primary(actor);
  const c = list.find((c) => c.number === number && !c.valid && c.status === "Issued");
  if (!c) throw new Error("Revoke the incorrect certificate first");
  if (list.some((x) => x.replaces === number)) throw new Error("Replacement already exists");
  const seq = list.reduce((n, c) => Math.max(n, Number(c.number.split("-").at(-1)) || 0), 0) + 1;
  const replacement = {
    ...structuredClone(c),
    number: `DEMO-EHF-${at.slice(0, 4)}-${String(seq).padStart(5, "0")}`,
    replaces: number,
    status: "Pending Issue" as const,
    valid: true,
    issuedAt: "",
    history: [...c.history, { at, by: actor.name, action: `Replacement prepared for ${number}` }],
    emailStatus: "Not Sent" as const,
  };
  return [
    ...list.map((x) =>
      x.number === number
        ? {
            ...x,
            history: [
              ...x.history,
              { at, by: actor.name, action: `Replacement ${replacement.number} prepared` },
            ],
          }
        : x,
    ),
    replacement,
  ];
}
