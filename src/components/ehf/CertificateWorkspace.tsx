import { hasPermission, requirePermission } from "@/lib/demo-roles";
import { useRef, useState } from "react";
import { Award, Users, Clock, Mail, MailCheck, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Kpi } from "./ui";
import { StatusBadge } from "./StatusBadge";
import { useWorkflow } from "@/lib/workflow-store";
import { usePhase2, getPhase2, setPhase2, demoNow } from "@/lib/phase2-store";
import { usePortalActor } from "@/lib/portal-actor";
import { useDemoActor } from "@/lib/demo-context";
import { PORTAL_ACTOR } from "@/lib/attendance";
import {
  eligibility,
  editCertificate,
  issuedCertificates,
  prepareCertificate,
  issueCertificate,
  certificateAction,
  verification,
  revokeCertificate,
  replaceCertificate,
  type CertificateRule,
  type CertificateTemplate,
  type Certificate,
} from "@/lib/certificate-workflow";
import { certificatePdf, downloadBlob } from "@/lib/demo-documents";
import { projects } from "@/lib/demo-data";
import { CompletionControls } from "./CompletionControls";
import { getPortal, setPortal, event } from "@/lib/portal-workflow";
import { PdfPreview } from "./PdfPreview";
const cls = "w-full min-w-0 rounded-md border bg-card px-3 py-2 text-sm";
const input = (label: string, child: React.ReactNode) => (
  <label className="grid gap-1 text-sm font-semibold">
    {label}
    {child}
  </label>
);
export function CertificateWorkspace({ portal = false }: { portal?: boolean }) {
  const admin = useDemoActor();
  const portalActor = usePortalActor();
  const actor = portal ? portalActor : admin;
  const state = usePhase2();
  const wf = useWorkflow();
  const primary = hasPermission(actor, "certificates.manage");
  const [tab, setTab] = useState("Certificates");
  const [number, setNumber] = useState("");
  const [pdf, setPdf] = useState("");
  const [templatePdf, setTemplatePdf] = useState("");
  const [email, setEmail] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [rule, setRule] = useState<CertificateRule | null>(null);
  const [verify, setVerify] = useState("");
  const [result, setResult] = useState<ReturnType<typeof verification> | undefined>();
  const [query, setQuery] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [volunteerQuery, setVolunteerQuery] = useState("");
  const [ruleKey, setRuleKey] = useState("");
  const [issueConfirm, setIssueConfirm] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [historyFilters, setHistoryFilters] = useState({
    project: "",
    title: "",
    date: "",
    status: "",
    email: "",
  });
  const issuing = useRef(false);
  const [issuingState, setIssuingState] = useState(false);
  const backgroundInput = useRef<HTMLInputElement>(null);
  const selected = wf.volunteers.find((v) => v.id === selectedId);
  const selectedTemplate = state.templates.find((t) => t.key === templateKey && t.active);
  const associatedProjects = selected
    ? Array.from(
        new Set([
          ...state.attendance.filter((r) => r.volunteerId === selected.id).map((r) => r.project),
          ...state.achievements.filter((a) => a.volunteerId === selected.id).map((a) => a.project),
        ]),
      )
    : [];
  const selectedRule = state.rules.find(
    (r) => r.key === ruleKey && (!r.project || associatedProjects.includes(r.project)),
  );
  const selectedEligibility =
    selected && selectedRule
      ? eligibility(selected.id, selectedRule, state.attendance, state.achievements)
      : null;
  const existingDraft = state.certificates.find(
    (c) => c.volunteerId === selectedId && c.ruleKey === ruleKey && c.status === "Pending Issue",
  );
  const list = portal
    ? issuedCertificates(state.certificates, actor.volunteerId).filter((c) => c.final)
    : state.certificates;
  const current = list.find((c) => c.number === number);
  const active = selectedTemplate;
  const matches = wf.volunteers.flatMap((v) =>
    state.rules
      .filter((r) => !portal || v.id === actor.volunteerId)
      .map((r) => ({
        v,
        r,
        e: eligibility(v.id, r, state.attendance, state.achievements),
        c: state.certificates.find((c) => c.volunteerId === v.id && c.ruleKey === r.key),
      })),
  );
  const transact = (fn: () => void, message: string) => {
    try {
      fn();
      toast.success(`${message} (demo only)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };
  const preview = async (c: Certificate) => {
    try {
      const bytes = new Uint8Array(await certificatePdf(c));
      if (pdf) URL.revokeObjectURL(pdf);
      setPdf(URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })));
      setNumber(c.number);
    } catch (e) {
      toast.error(String(e));
    }
  };
  const download = async (c: Certificate) => {
    try {
      downloadBlob(new Uint8Array(await certificatePdf(c)), "application/pdf", `${c.number}.pdf`);
    } catch (e) {
      toast.error(String(e));
    }
  };
  const generate = (vid: string, r: CertificateRule) => {
    if (!active) {
      toast.error("Select an active template");
      return;
    }
    const v = wf.volunteers.find((v) => v.id === vid);
    if (!v) return;
    transact(() => {
      const s = getPhase2();
      const certificates = prepareCertificate(
        s.certificates,
        actor,
        v,
        r,
        s.attendance,
        s.achievements,
        active,
        demoNow(),
      );
      setPhase2({ ...s, certificates });
      const c = certificates.at(-1);
      if (c) {
        setNumber(c.number);
        void preview(c);
      }
    }, "Certificate prepared for preview");
  };
  const upload = async (file: File | undefined, signature = false) => {
    if (!file || !template) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Use a file smaller than 10 MB");
      if (
        !["application/pdf", "image/png", "image/jpeg"].includes(file.type) ||
        (signature && file.type === "application/pdf")
      )
        throw new Error("Use a PDF, PNG or JPEG background; signatures must be PNG or JPEG");
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (file.type !== "application/pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.create();
        if (file.type === "image/png") await doc.embedPng(bytes);
        else await doc.embedJpg(bytes);
      }
      if (signature) setTemplate({ ...template, signatureBytes: bytes, signatureMime: file.type });
      else {
        if (file.type === "application/pdf") {
          const { PDFDocument } = await import("pdf-lib");
          await PDFDocument.load(bytes);
        }
        setTemplate({
          ...template,
          bytes,
          mime: file.type,
          filename: file.name,
          previewUrl: URL.createObjectURL(file),
          name: template.name || file.name,
        });
      }
    } catch (e) {
      toast.error(String(e));
    }
  };
  return (
    <>
      <PageHeader
        title={portal ? "My Certificates" : "Certificate Management"}
        subtitle="Demonstration certificates · email delivery is simulated"
      />
      {!portal && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            [Award, issuedCertificates(list).length, "Total Certificates Issued"],
            [Users, matches.filter((m) => m.e.eligible && !m.c).length, "Eligible Volunteers"],
            [
              Clock,
              list.filter((c) => c.status === "Pending Issue").length,
              "Pending Certificates",
            ],
            [
              MailCheck,
              list.filter((c) => c.emailStatus === "Email Sent").length,
              "Certificates Sent (simulated)",
            ],
            [
              Mail,
              list.filter(
                (c) => c.status === "Issued" && ["Not Sent", "Pending"].includes(c.emailStatus),
              ).length,
              "Certificates Awaiting Email",
            ],
            [
              AlertTriangle,
              list.filter((c) => c.emailStatus === "Email Failed").length,
              "Failed Email Deliveries (simulated)",
            ],
          ].map(([Icon, value, label]) => (
            <Kpi
              key={String(label)}
              icon={Icon as typeof Award}
              value={value as number}
              label={String(label)}
            />
          ))}
        </div>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        {(portal
          ? ["Certificates"]
          : ["Certificates", "Certificate Templates", "Verify Certificate"]
        ).map((t) => (
          <Button variant={t === tab ? "default" : "outline"} key={t} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>
      {tab === "Certificates" && (
        <>
          {!portal && <CompletionControls />}
          {primary && (
            <section className="mb-8 border-b pb-6">
              <h2 className="mb-4 text-lg font-bold">Issue a Certificate</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {input(
                  "Certificate type",
                  <select
                    className={cls}
                    value={templateKey}
                    onChange={(e) => setTemplateKey(e.target.value)}
                  >
                    <option value="">Select active certificate template</option>
                    {state.templates
                      .filter((t) => t.active)
                      .map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.title || t.name}
                        </option>
                      ))}
                  </select>,
                )}
                {input(
                  "Search volunteer name or ID",
                  <input
                    className={cls}
                    value={volunteerQuery}
                    onChange={(e) => setVolunteerQuery(e.target.value)}
                    placeholder="Volunteer name or Volunteer ID"
                  />,
                )}
                {input(
                  "Select volunteer",
                  <select
                    className={cls}
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      setRuleKey("");
                      setVolunteerQuery("");
                    }}
                  >
                    <option value="">Select volunteer</option>
                    {wf.volunteers
                      .filter((v) =>
                        `${v.name} ${v.id}`.toLowerCase().includes(volunteerQuery.toLowerCase()),
                      )
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} · {v.id}
                        </option>
                      ))}
                  </select>,
                )}
                {input(
                  "Final volunteering certificate",
                  <select
                    className={cls}
                    value={ruleKey}
                    disabled={!selected}
                    onChange={(e) => setRuleKey(e.target.value)}
                  >
                    <option value="">Select project or achievement</option>
                    {state.rules
                      .filter((r) => r.final)
                      .map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.project || "Organisation-wide"} · {r.title}
                        </option>
                      ))}
                  </select>,
                )}
              </div>
              {selected && (
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <b>{selected.name}</b> · {selected.id} ·{" "}
                    <StatusBadge status={selected.status} />
                  </p>
                  <p>Registered Email: {selected.email}</p>
                  <p>Certificate Title: {selectedTemplate?.title || selectedRule?.title || "—"}</p>
                  <p>Organisation: Ethnic Health Forum</p>
                  <p>
                    Signatory: {selectedTemplate?.signatory || "Not provided"}{" "}
                    {selectedTemplate?.signatoryTitle}
                  </p>
                  <p>Issue Date: {new Date().toISOString().slice(0, 10)}</p>
                </div>
              )}
              {selectedEligibility && (
                <div className="mt-4 text-sm">
                  <p>
                    <StatusBadge
                      status={selectedEligibility.eligible ? "Eligible" : "Not Eligible"}
                    />{" "}
                    · {selectedEligibility.hours} Approved Hours · Completion:{" "}
                    {selectedEligibility.completionDate || "Not required"}
                  </p>
                  {selectedEligibility.reasons.map((r) => (
                    <p key={r} className="mt-1 text-destructive">
                      {r}
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  disabled={
                    !selected ||
                    !selectedRule ||
                    !selectedTemplate ||
                    !selectedEligibility?.eligible
                  }
                  onClick={() => {
                    if (existingDraft) {
                      void preview(existingDraft);
                    } else if (selected && selectedRule) generate(selected.id, selectedRule);
                  }}
                >
                  Preview Certificate
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    !selected ||
                    !selectedRule ||
                    !selectedTemplate ||
                    !selectedEligibility?.eligible
                  }
                  onClick={() => {
                    if (existingDraft) {
                      setPdf("");
                      setNumber(existingDraft.number);
                    } else if (selected && selectedRule) generate(selected.id, selectedRule);
                  }}
                >
                  Generate Certificate
                </Button>
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-4 text-lg font-bold">
              {portal ? "My Final Certificate" : "Issued Certificates History"}
            </h2>
            {input(
              "Search certificates",
              <input
                className={cls}
                placeholder="Volunteer name, ID or certificate number"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />,
            )}
            <div className="my-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {(
                [
                  ["project", "Project", Array.from(new Set(list.map((c) => c.project)))],
                  ["title", "Certificate type", Array.from(new Set(list.map((c) => c.title)))],
                  ["status", "Certificate status", ["Issued"]],
                  [
                    "email",
                    "Email delivery status",
                    ["Not Sent", "Pending", "Email Sent", "Email Failed"],
                  ],
                ] as const
              ).map(([key, label, options]) => (
                <label key={key} className="grid gap-1 text-sm font-semibold">
                  {label}
                  <select
                    className={cls}
                    value={historyFilters[key]}
                    onChange={(e) => setHistoryFilters((f) => ({ ...f, [key]: e.target.value }))}
                  >
                    <option value="">All</option>
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
              {input(
                "Issue date",
                <input
                  type="date"
                  className={cls}
                  value={historyFilters.date}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, date: e.target.value }))}
                />,
              )}
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    {[
                      "Certificate Number",
                      "Volunteer ID",
                      "Volunteer Name",
                      "Certificate Title",
                      "Volunteering Period",
                      "Approved Hours",
                      "Issue Date",
                      "Certificate Status",
                      "Email Delivery Status",
                      "Actions",
                    ].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list
                    .filter(
                      (c) =>
                        (portal
                          ? c.status === "Issued" && !!c.final && c.valid
                          : c.status === "Issued") &&
                        `${c.number} ${c.volunteerId} ${c.name} ${c.project}`
                          .toLowerCase()
                          .includes(query.toLowerCase()) &&
                        (!historyFilters.project || c.project === historyFilters.project) &&
                        (!historyFilters.title || c.title === historyFilters.title) &&
                        (!historyFilters.date || c.issuedAt.slice(0, 10) === historyFilters.date) &&
                        (!historyFilters.status || c.status === historyFilters.status) &&
                        (!historyFilters.email || c.emailStatus === historyFilters.email),
                    )
                    .map((c) => (
                      <tr key={c.number} className="border-t">
                        {[
                          c.number,
                          c.volunteerId,
                          c.name,
                          c.title,
                          c.final
                            ? `${c.startDate} – ${c.completionDate}`
                            : c.project || "Organisation-wide",
                          c.hours.toFixed(2),
                          c.issuedAt.slice(0, 10),
                          <StatusBadge status={c.valid ? c.status : "Revoked"} />,
                          <StatusBadge status={c.emailStatus} />,
                        ].map((v, i) => (
                          <td key={i} className="whitespace-nowrap px-3 py-3">
                            {v}
                          </td>
                        ))}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPdf("");
                                setEmail(false);
                                setNumber(c.number);
                              }}
                            >
                              View Certificate & History
                            </Button>
                            <Button variant="outline" onClick={() => void preview(c)}>
                              Preview PDF
                            </Button>
                            <Button variant="outline" onClick={() => void download(c)}>
                              <Download />
                              Download PDF
                            </Button>
                            {primary && (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    transact(
                                      () => {
                                        const s = getPhase2();
                                        setPhase2({
                                          ...s,
                                          certificates: c.valid
                                            ? revokeCertificate(
                                                s.certificates,
                                                c.number,
                                                actor,
                                                "Administrative correction",
                                                demoNow(),
                                              )
                                            : replaceCertificate(
                                                s.certificates,
                                                c.number,
                                                actor,
                                                demoNow(),
                                              ),
                                        });
                                      },
                                      c.valid
                                        ? "Revoked with audit history"
                                        : "Replacement prepared",
                                    )
                                  }
                                >
                                  {c.valid ? "Revoke certificate" : "Prepare replacement"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditing(structuredClone(c))}
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => {
                                    setNumber(c.number);
                                    setEmail(true);
                                  }}
                                >
                                  Send by Email (simulated)
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    transact(() => {
                                      const s = getPhase2();
                                      setPhase2({
                                        ...s,
                                        certificates: certificateAction(
                                          s.certificates,
                                          c.number,
                                          actor,
                                          demoNow(),
                                          "Reissue",
                                        ),
                                      });
                                      void download(c);
                                    }, "Reissue recorded; original preserved")
                                  }
                                >
                                  Reissue
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!list.some((c) => c.status === "Issued") && (
              <p className="py-8 text-center text-muted-foreground">No certificates issued yet.</p>
            )}
          </section>
        </>
      )}
      {tab === "Certificate Templates" && (
        <section>
          <div className="mb-4 flex justify-between gap-3">
            <h2 className="text-lg font-bold">Certificate Templates</h2>
            {primary && (
              <Button
                onClick={() =>
                  setTemplate({
                    key: crypto.randomUUID(),
                    name: "",
                    active: false,
                    signatory: "",
                    signatoryTitle: "",
                    logo: true,
                    nameY: 56,
                    detailY: 38,
                  })
                }
              >
                Add template
              </Button>
            )}
          </div>
          <div className="grid gap-3">
            {state.templates.map((t) => (
              <article
                key={t.key}
                className="flex flex-wrap justify-between gap-3 rounded-md border bg-card p-4"
              >
                <div>
                  <b>{t.name}</b>
                  <p className="text-sm">
                    {t.active ? "Active design" : "Inactive"} ·{" "}
                    {t.mime ?? "Built-in demonstration design"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setTemplate({ ...t })}>
                    Preview / Edit
                  </Button>
                  {primary && !t.active && (
                    <Button
                      onClick={() => {
                        requirePermission(actor, "certificates.manage");
                        const s = getPhase2();
                        setPhase2({
                          ...s,
                          templates: s.templates.map((x) =>
                            x.key === t.key ? { ...x, active: true } : x,
                          ),
                        });
                      }}
                    >
                      Set active
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "Criteria & Automation" && (
        <section>
          <div className="mb-4 flex flex-wrap justify-between gap-3">
            <h2 className="text-lg font-bold">Certificate Criteria & Automation</h2>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  setRule({
                    key: crypto.randomUUID(),
                    title: "Certificate of Volunteering",
                    project: projects[0]?.name ?? "",
                    minimumHours: 0,
                    requireCompletion: false,
                    requiredTasks: [],
                    additional: "",
                    automation: "Manual Generation",
                    approveEmail: true,
                  })
                }
              >
                Add certificate type
              </Button>
            </div>
          </div>
          {state.rules.map((r) => (
            <article key={r.key} className="mb-3 rounded-md border bg-card p-4">
              <b>
                {r.title} · {r.project}
              </b>
              <p className="my-2 text-sm">
                Minimum {r.minimumHours} approved hours ·{" "}
                {r.requireCompletion ? "Project completion required" : "Completion not required"} ·{" "}
                {r.automation} ·{" "}
                {r.approveEmail
                  ? "Email approval required"
                  : "Email can be simulated after issue approval"}
              </p>
              <Button variant="outline" onClick={() => setRule({ ...r })}>
                Edit criteria
              </Button>
            </article>
          ))}
        </section>
      )}
      {tab === "Verify Certificate" && (
        <section className="max-w-xl">
          <h2 className="mb-3 text-lg font-bold">Verify Certificate</h2>
          {input(
            "Certificate number",
            <input className={cls} value={verify} onChange={(e) => setVerify(e.target.value)} />,
          )}
          <Button className="mt-3" onClick={() => setResult(verification(list, verify.trim()))}>
            Verify
          </Button>
          {result !== undefined &&
            (result ? (
              <dl className="mt-4 grid gap-2 text-sm">
                {Object.entries(result).map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-semibold">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4">No issued demo certificate matches this number.</p>
            ))}
        </section>
      )}
      <Dialog
        open={!!current}
        onOpenChange={(o) => {
          if (!o) {
            setNumber("");
            setEmail(false);
            if (pdf) URL.revokeObjectURL(pdf);
            setPdf("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {current && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {email ? "Preview Certificate Email (simulated)" : current.title}
                </DialogTitle>
              </DialogHeader>
              {email ? (
                <>
                  <p className="text-sm">
                    To: {wf.volunteers.find((v) => v.id === current.volunteerId)?.email}
                  </p>
                  <b>Subject: Your EHF Volunteer Certificate</b>
                  <p className="whitespace-pre-line text-sm">{`Dear ${current.name},\n\nCongratulations!\n\nThank you for your valuable contribution to EHF.\n\nPlease find attached your volunteer certificate recognising your contribution of ${current.hours} approved hours to ${current.project}.\n\nWe sincerely appreciate your time, dedication and support.\n\nKind regards,\nEthnic Health Forum`}</p>
                  <p className="text-sm">Attachment: {current.number}.pdf</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                    />
                    Simulate failed delivery
                  </label>
                  <Button
                    onClick={async () => {
                      try {
                        await certificatePdf(current);
                        const s = getPhase2();
                        setPhase2({
                          ...s,
                          certificates: certificateAction(
                            s.certificates,
                            current.number,
                            actor,
                            demoNow(),
                            simulateFailure ? "Email Failed" : "Email Sent",
                            wf.volunteers.find((v) => v.id === current.volunteerId)?.email,
                          ),
                        });
                        toast("Simulated email result recorded — no email was sent");
                        setEmail(false);
                      } catch (e) {
                        toast.error(String(e));
                      }
                    }}
                  >
                    Confirm simulated email
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    {current.number} · {current.name} · {current.volunteerId} · {current.hours}{" "}
                    approved hours
                  </p>
                  {pdf ? (
                    <PdfPreview title="Certificate PDF preview" url={pdf} />
                  ) : (
                    <Button variant="outline" onClick={() => void preview(current)}>
                      Preview PDF
                    </Button>
                  )}
                  {primary && current.status === "Pending Issue" && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setIssueConfirm(true)}>Issue Certificate</Button>
                      <Button variant="outline" onClick={() => void download(current)}>
                        Download PDF
                      </Button>
                    </div>
                  )}
                  <h3 className="font-bold">Approved hours used</h3>
                  {current.attendanceKeys.map((k) => {
                    const r = state.attendance.find((r) => r.key === k);
                    return r ? (
                      <p className="text-sm" key={k}>
                        {r.date} · {r.project} · {r.hours}h · {r.approval}
                      </p>
                    ) : null;
                  })}
                  <h3 className="font-bold">Certificate history</h3>
                  {current.history.map((h, i) => (
                    <p key={i} className="text-sm">
                      {h.at} · {h.action} · {h.by}
                      {h.recipient ? ` · ${h.recipient}` : ""}
                    </p>
                  ))}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={issueConfirm} onOpenChange={setIssueConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue this certificate?</DialogTitle>
          </DialogHeader>
          <p>
            {current?.name} · {current?.number}
          </p>
          <p>Confirm final issuance in Demo Mode.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIssueConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!current || issuing.current) return;
                issuing.current = true;
                setIssuingState(true);
                try {
                  const s = getPhase2();
                  const certificates = issueCertificate(
                    s.certificates,
                    current.number,
                    actor,
                    demoNow(),
                    s.attendance,
                    s.rules,
                    s.achievements,
                  );
                  const issued = certificates.find((c) => c.number === current.number);
                  if (!issued) return;
                  const bytes = await certificatePdf(issued);
                  const fresh = getPhase2();
                  setPhase2({
                    ...fresh,
                    certificates: issueCertificate(
                      fresh.certificates,
                      current.number,
                      actor,
                      demoNow(),
                      fresh.attendance,
                      fresh.rules,
                      fresh.achievements,
                    ),
                  });
                  setPortal(
                    event(
                      getPortal(),
                      issued.volunteerId,
                      actor.name,
                      "Final certificate issued",
                      "/portal/certificates",
                      demoNow(),
                    ),
                  );
                  setIssueConfirm(false);
                  setNumber("");
                  setPdf("");
                  downloadBlob(new Uint8Array(bytes), "application/pdf", `${issued.number}.pdf`);
                  toast.success("Certificate issued (demo only)");
                } catch (e) {
                  toast.error(String(e));
                } finally {
                  issuing.current = false;
                  setIssuingState(false);
                }
              }}
              disabled={issuingState}
            >
              {issuingState ? "Processing…" : "Confirm issuance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Edit issued certificate</DialogTitle>
              </DialogHeader>
              <p>
                {editing.name} · {editing.volunteerId} · {editing.number}
              </p>
              {input(
                "Certificate title",
                <input
                  className={cls}
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />,
              )}
              {input(
                "Project name",
                <select
                  className={cls}
                  value={editing.project}
                  onChange={(e) => setEditing({ ...editing, project: e.target.value })}
                >
                  <option value="">Organisation-wide</option>
                  {Array.from(
                    new Set([
                      ...state.attendance
                        .filter((r) => r.volunteerId === editing.volunteerId)
                        .map((r) => r.project),
                      ...state.achievements
                        .filter((a) => a.volunteerId === editing.volunteerId)
                        .map((a) => a.project),
                    ]),
                  ).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>,
              )}
              {input(
                "Certificate template",
                <select
                  className={cls}
                  value={editing.template.key}
                  onChange={(e) => {
                    const t = state.templates.find((t) => t.key === e.target.value);
                    if (t) setEditing({ ...editing, template: structuredClone(t) });
                  }}
                >
                  {state.templates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </select>,
              )}
              {input(
                "Signatory name",
                <input
                  className={cls}
                  value={editing.template.signatory}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      template: { ...editing.template, signatory: e.target.value },
                    })
                  }
                />,
              )}
              {input(
                "Signatory title",
                <input
                  className={cls}
                  value={editing.template.signatoryTitle}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      template: { ...editing.template, signatoryTitle: e.target.value },
                    })
                  }
                />,
              )}
              <Button
                onClick={() => {
                  try {
                    const s = getPhase2();
                    setPhase2({
                      ...s,
                      certificates: editCertificate(
                        s.certificates,
                        editing.number,
                        actor,
                        {
                          title: editing.title,
                          project: editing.project,
                          template: editing.template,
                        },
                        s.attendance,
                        s.rules,
                        s.achievements,
                        demoNow(),
                      ),
                    });
                    setEditing(null);
                    toast.success("Certificate corrected; history preserved (demo only)");
                  } catch (e) {
                    toast.error(String(e));
                  }
                }}
              >
                Save corrections
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!template} onOpenChange={(o) => !o && setTemplate(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {template && (
            <>
              <DialogHeader>
                <DialogTitle>Certificate Template</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {input(
                  "Template name",
                  <input
                    className={cls}
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  />,
                )}
                {input(
                  "Certificate title",
                  <input
                    className={cls}
                    value={template.title ?? ""}
                    onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                  />,
                )}
                <div className="grid gap-2 text-sm">
                  <input
                    ref={backgroundInput}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      void upload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <Button variant="outline" onClick={() => backgroundInput.current?.click()}>
                    Upload Certificate Background
                  </Button>
                  <p>
                    {template.filename ||
                      (template.bytes ? "Saved certificate background" : "No background uploaded")}
                  </p>
                  {template.bytes && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => backgroundInput.current?.click()}>
                        Replace background
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTemplate({
                            ...template,
                            bytes: undefined,
                            mime: undefined,
                            filename: undefined,
                            previewUrl: undefined,
                          });
                          setTemplatePdf("");
                        }}
                      >
                        Remove background
                      </Button>
                    </div>
                  )}
                </div>
                {input(
                  "Authorised signatory name",
                  <input
                    className={cls}
                    value={template.signatory}
                    onChange={(e) => setTemplate({ ...template, signatory: e.target.value })}
                  />,
                )}
                {input(
                  "Signatory title",
                  <input
                    className={cls}
                    value={template.signatoryTitle}
                    onChange={(e) => setTemplate({ ...template, signatoryTitle: e.target.value })}
                  />,
                )}
                {input(
                  "Authorised signature (optional)",
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => void upload(e.target.files?.[0], true)}
                  />,
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={template.logo}
                    onChange={(e) => setTemplate({ ...template, logo: e.target.checked })}
                  />
                  Use existing organisation logo
                </label>
                {input(
                  "Name placement (% from bottom)",
                  <input
                    type="range"
                    min="20"
                    max="65"
                    value={template.nameY}
                    onChange={(e) => setTemplate({ ...template, nameY: Number(e.target.value) })}
                  />,
                )}
                {input(
                  "Details placement (% from bottom)",
                  <input
                    type="range"
                    min="25"
                    max="45"
                    value={template.detailY}
                    onChange={(e) => setTemplate({ ...template, detailY: Number(e.target.value) })}
                  />,
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={template.active}
                    onChange={(e) => setTemplate({ ...template, active: e.target.checked })}
                  />
                  Set as active design
                </label>
              </div>
              {template.previewUrl &&
                (template.mime === "application/pdf" ? (
                  <PdfPreview title="Uploaded template preview" url={template.previewUrl} />
                ) : (
                  <img
                    alt="Uploaded certificate template"
                    src={template.previewUrl}
                    className="max-h-64 w-full object-contain"
                  />
                ))}
              {templatePdf && <PdfPreview title="Populated template preview" url={templatePdf} />}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const sample: Certificate = {
                      number: "DEMO-TEMPLATE-PREVIEW",
                      name: "Sample Volunteer",
                      volunteerId: "V-DEMO",
                      project: "Sample Project",
                      title: template.title || "Certificate of Volunteering",
                      hours: 20,
                      completionDate: "2026-11-10",
                      issuedAt: "2026-11-10",
                      status: "Pending Issue",
                      emailStatus: "Not Sent",
                      ruleKey: "",
                      template,
                      history: [],
                      valid: true,
                      attendanceKeys: [],
                    };
                    try {
                      const bytes = await certificatePdf(sample);
                      setTemplatePdf(
                        URL.createObjectURL(
                          new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
                        ),
                      );
                    } catch (e) {
                      toast.error(String(e));
                    }
                  }}
                >
                  Preview Template
                </Button>
                {primary && (
                  <Button
                    onClick={() => {
                      if (!template.name.trim()) {
                        toast.error("Template name is required");
                        return;
                      }
                      if (template.detailY + 6 >= template.nameY - 6) {
                        toast.error("Move the name above the details to avoid overlapping fields");
                        return;
                      }
                      requirePermission(actor, "certificates.manage");
                      const s = getPhase2();
                      const exists = s.templates.some((t) => t.key === template.key);
                      let templates = exists
                        ? s.templates.map((t) => (t.key === template.key ? template : t))
                        : [...s.templates, template];

                      if (!templates.some((t) => t.active)) {
                        toast.error("Keep at least one active template");
                        return;
                      }
                      setPhase2({ ...s, templates });
                      setTemplate(null);
                    }}
                  >
                    Save template (demo)
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!rule} onOpenChange={(o) => !o && setRule(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {rule && (
            <>
              <DialogHeader>
                <DialogTitle>Eligibility Criteria</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                {input(
                  "Certificate title",
                  <input
                    className={cls}
                    value={rule.title}
                    onChange={(e) => setRule({ ...rule, title: e.target.value })}
                  />,
                )}
                {input(
                  "Project",
                  <select
                    className={cls}
                    value={rule.project}
                    onChange={(e) => setRule({ ...rule, project: e.target.value })}
                  >
                    <option value="">Organisation-wide</option>
                    {projects.map((p) => (
                      <option key={p.name}>{p.name}</option>
                    ))}
                  </select>,
                )}
                {input(
                  "Required approved hours",
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={cls}
                    value={rule.minimumHours}
                    onChange={(e) => setRule({ ...rule, minimumHours: Number(e.target.value) })}
                  />,
                )}
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rule.requireCompletion}
                    onChange={(e) => setRule({ ...rule, requireCompletion: e.target.checked })}
                  />
                  Require project completion
                </label>
                {input(
                  "Required task names (comma separated)",
                  <input
                    className={cls}
                    value={rule.requiredTasks.join(", ")}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        requiredTasks: e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      })
                    }
                  />,
                )}
                {input(
                  "Additional requirement",
                  <input
                    className={cls}
                    value={rule.additional}
                    onChange={(e) => setRule({ ...rule, additional: e.target.value })}
                  />,
                )}
                {input(
                  "Automation mode",
                  <select
                    className={cls}
                    value={rule.automation}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        automation: e.target.value as CertificateRule["automation"],
                      })
                    }
                  >
                    <option>Manual Generation</option>
                    <option>Automatic Generation</option>
                    <option>Automatic Generation and Email</option>
                  </select>,
                )}
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rule.approveEmail}
                    onChange={(e) => setRule({ ...rule, approveEmail: e.target.checked })}
                  />
                  Require administrator approval before simulated email
                </label>
                <Button
                  onClick={() => {
                    if (!primary) return;
                    if (
                      !rule.title.trim() ||
                      !Number.isFinite(rule.minimumHours) ||
                      rule.minimumHours < 0
                    ) {
                      toast.error("Enter a title and non-negative approved hour requirement");
                      return;
                    }
                    const s = getPhase2();
                    setPhase2({
                      ...s,
                      rules: s.rules.some((r) => r.key === rule.key)
                        ? s.rules.map((r) => (r.key === rule.key ? rule : r))
                        : [...s.rules, rule],
                    });
                    setRule(null);
                  }}
                >
                  Save criteria (demo)
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
