import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, PageHeader } from "@/components/ehf/ui";
import { StatusBadge } from "@/components/ehf/StatusBadge";
import { Facts, Section, Timeline } from "@/components/ehf/DetailBits";
import {
  addNote,
  allowedNext,
  APPLICATION_STATUSES,
  changeStatus,
  type AppStatus,
} from "@/lib/volunteer-workflow";
import { getWorkflow, nowStamp, setWorkflow, useWorkflow } from "@/lib/workflow-store";
import { meta } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/demo-roles";
import { useDemoActor } from "@/lib/demo-context";

export const Route = createFileRoute("/admin/applications")({
  head: () => meta("Volunteer Applications"),
  component: Page,
});

const actionLabel: Record<AppStatus, string> = {
  Pending: "Pending",
  "Under Review": "Start Review",
  Accepted: "Accept Application",
  Rejected: "Reject Application",
};

function Page() {
  const wf = useWorkflow();
  const actor = useDemoActor();
  const [confirm, setConfirm] = useState<AppStatus | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState("");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const busy = useRef(false);
  const decisionSection = useRef<HTMLDivElement>(null);
  const shown = useMemo(
    () =>
      wf.applications.filter(
        (a) =>
          (!status || a.status === status) &&
          [a.ref, a.name, a.email, a.interest].join(" ").toLowerCase().includes(q.toLowerCase()),
      ),
    [wf, q, status],
  );
  const app = wf.applications.find((a) => a.ref === openRef);

  const move = async (to: AppStatus) => {
    if (!app || busy.current) return;
    busy.current = true;
    setProcessing(true);
    // Paint the pending state; read the latest tab state rather than a captured render.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const r = changeStatus(getWorkflow(), app.ref, to, actor.name, nowStamp(), { reason, actor });
    busy.current = false;
    setProcessing(false);
    if (!r.ok) {
      if (to === "Rejected") setReasonErr(r.error);
      toast.error(r.error);
      return;
    }
    setWorkflow(r.state);
    setReason("");
    setReasonErr("");
    setConfirm(null);
    if (to === "Under Review") requestAnimationFrame(() => decisionSection.current?.scrollIntoView({ block: "nearest" }));
    toast.success(
      `Application ${to.toLowerCase()} (demo only)${r.createdVolunteerId ? ` — volunteer profile ${r.createdVolunteerId} created` : to === "Accepted" ? " — existing volunteer profile linked" : ""}`,
    );
  };
  const saveNote = () => {
    if (!app || !hasPermission(actor, "applications.review")) return;
    const r = addNote(getWorkflow(), app.ref, actor.name, nowStamp(), note, actor);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setWorkflow(r.state);
    setNote("");
  };

  return (
    <>
      <PageHeader
        title="Volunteer Applications"
        subtitle="Review applications: Pending → Under Review → Accepted or Rejected"
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            aria-label="Search"
            className="w-full rounded-md border bg-card py-2 pl-9 pr-3 text-sm"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-md border bg-card px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        {shown.length} of {wf.applications.length} applications · synthetic data
      </p>
      <DataTable
        columns={["Ref. No.", "Name", "Area of Interest", "Application Date", "Status", "Actions"]}
        rows={shown.map((a) => [
          a.ref,
          <b>{a.name}</b>,
          a.interest,
          a.date,
          <StatusBadge status={a.status} />,
          <Button variant="ghost" size="sm"
            aria-label={`View ${a.name}`}
            onClick={() => {
              setOpenRef(a.ref);
              setReason("");
              setReasonErr("");
              setNote("");
              setConfirm(null);
            }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <Eye className="h-4 w-4" /> Review
          </Button>,
        ])}
      />
      {shown.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No applications match your search.
        </p>
      )}

      <Dialog open={!!app} onOpenChange={(o) => { if (!o && !busy.current) { setOpenRef(null); setConfirm(null); } }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {app && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-3">
                  {app.name} <StatusBadge status={app.status} />
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {app.ref} · submitted {app.date}
                </p>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <Section title="Applicant">
                  <Facts
                    items={[
                      ["Email", app.email],
                      ["Phone", app.phone],
                      ["Address", app.address],
                      ["Postcode", app.postcode],
                      ["Nationality", app.nationality],
                      ["Preferred language", app.language],
                    ]}
                  />
                </Section>
                <Section title="Application">
                  <Facts
                    items={[
                      ["Area of interest", app.interest],
                      ["Skills", app.skills],
                      [
                        "Availability",
                        app.availabilityType === "Flexible"
                          ? "Flexible"
                          : app.availabilityDays.join(", "),
                      ],
                      ["Reviewer", app.reviewer ?? app.decidedBy],
                      ["Review started", app.reviewStartedAt],
                      ["Decision date", app.decisionDate],
                      ["Decided by", app.decidedBy],
                      ["Rejection reason", app.rejectionReason],
                      [
                        "Volunteer profile",
                        app.volunteerId ? (
                          <Link
                            to="/admin/volunteers"
                            search={{ id: app.volunteerId }}
                            className="font-semibold text-primary underline"
                          >
                            {app.volunteerId} · View Profile
                          </Link>
                        ) : undefined,
                      ],
                    ]}
                  />
                </Section>
              </div>
              <div ref={decisionSection}>
              <Section title="Decision">
                {allowedNext(app.status).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This application has a final decision ({app.status}). It cannot be processed
                    again.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t bg-card py-3">
                      {allowedNext(app.status).map((s) => (
                        <Button
                          key={s}
                          disabled={processing || !hasPermission(actor, s === "Under Review" ? "applications.review" : "applications.decide")}
                          variant={s === "Rejected" ? "destructive" : "default"}
                          onClick={() => {
                            if (s === "Under Review") {
                              move(s);
                              return;
                            }
                            setReasonErr("");
                            setConfirm(s);
                          }}
                        >
                          {processing ? "Processing…" : actionLabel[s]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
              </div>
              <Section title="Internal review notes">
                <Timeline entries={app.notes} empty="No internal notes yet." />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    disabled={processing || !hasPermission(actor, "applications.review")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add an internal note…"
                    aria-label="Internal note"
                    className="flex-1 rounded-md border bg-card px-3 py-2 text-sm"
                  />
                  <Button disabled={processing || !hasPermission(actor, "applications.review")} onClick={saveNote}>Add note</Button>
                </div>
              </Section>
              <Section title="Application history">
                <Timeline entries={app.history} />
              </Section>
              <p className="text-xs text-muted-foreground">
                Demo only — changes last for this browser tab and are not saved.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!confirm} onOpenChange={(o) => !o && !busy.current && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "Accepted" ? "Accept this application?" : "Reject this application?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            {app?.name} · {app?.ref}. This decision is final in this demo session.
          </p>
          {confirm === "Rejected" && (
            <label className="grid gap-1 text-sm font-semibold">
              Rejection reason (required)
              <textarea value={reason} disabled={processing} onChange={(e) => { setReason(e.target.value); setReasonErr(""); }} rows={3} className="rounded-md border bg-card px-3 py-2 font-normal" aria-invalid={!!reasonErr} aria-describedby={reasonErr ? "rejection-error" : undefined} />
              {reasonErr && <span id="rejection-error" role="alert" className="text-xs font-normal text-destructive">{reasonErr}</span>}
            </label>
          )}
          <div className="flex gap-2">
            <Button disabled={processing} variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              disabled={processing || !hasPermission(actor, "applications.decide")}
              onClick={() => {
                if (confirm) move(confirm);
              }}
            >
              {processing ? "Processing…" : "Confirm decision"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
