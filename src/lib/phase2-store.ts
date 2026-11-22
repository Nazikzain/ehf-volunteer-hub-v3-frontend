import { useSyncExternalStore } from "react";
import { volunteers, timeLogs } from "./demo-data";
import type { Attendance } from "./attendance";
import type {
  Achievement,
  Certificate,
  CertificateRule,
  CertificateTemplate,
} from "./certificate-workflow";
const projectName = (p: string) =>
  p === "Community Wellbeing"
    ? "Community Wellbeing Programme"
    : p === "Health Awareness"
      ? "Health Awareness Sessions"
      : p;
const iso = (s: string) => {
  const [d, m, y, t] = s.split(" ");
  return `${y}-${m === "Oct" ? "10" : "09"}-${d}T${t}:00`;
};
// All seed figures are synthetic. No attendance is created by page visits.
export const initialAttendance: Attendance[] = timeLogs.map((r, i) => ({
  key: `demo-session-${i}`,
  volunteerId: volunteers.find((v) => v.name === r.volunteer)?.id ?? "",
  project: projectName(r.project),
  date: iso(r.start).slice(0, 10),
  start: iso(r.start),
  end: iso(r.end),
  hours: r.hours,
  activity: "Community support",
  location: "",
  type: i === 0 ? "Manual" : "Automatic",
  attendance: i === 0 ? "Present" : "Checked Out",
  approval: r.volunteer === "Omar Abdi" ? "Rejected" : r.status === "Pending" ? "Pending Approval" : (r.status as "Approved" | "Rejected"),
  reason: i === 0 ? "Could not check in at the venue" : "",
  comments: "",
  submittedBy: r.volunteer,
  createdAt: iso(r.end),
  updatedAt: iso(r.end),
  reviewer: r.status === "Pending" ? undefined : "Demo Primary Administrator",
  reviewedAt: r.status === "Pending" ? undefined : iso(r.end),
  rejectionReason: r.status === "Rejected" ? "Session was cancelled" : "",
  corrections: [],
}));
// Historical approved sessions replace the old standalone hour counters.
for (const v of volunteers) {
  const approved = initialAttendance
    .filter((r) => r.volunteerId === v.id && r.approval === "Approved")
    .reduce((n, r) => n + r.hours, 0);
  const remaining = v.hours - approved;
  const project =
    v.id === "V-1042"
      ? "Community Wellbeing Programme"
      : v.id === "V-1031"
        ? "Digital Skills Support"
        : "Health Awareness Sessions";
  for (let n = 0; n < Math.ceil(remaining / 8); n++) {
    const hours = Math.min(8, remaining - n * 8);
    const day = String(n + 1).padStart(2, "0");
    initialAttendance.push({
      key: `demo-history-${v.id}-${n}`,
      volunteerId: v.id,
      project,
      date: `2026-09-${day}`,
      start: `2026-09-${day}T09:00:00`,
      end: `2026-09-${day}T${String(9 + Math.floor(hours)).padStart(2, "0")}:${hours % 1 ? "30" : "00"}:00`,
      hours,
      type: "Automatic",
      attendance: "Checked Out",
      approval: "Approved",
      activity: "Volunteer contribution",
      location: "",
      reason: "",
      comments: "Synthetic historical record",
      submittedBy: v.name,
      createdAt: `2026-09-${day}T17:00:00`,
      updatedAt: `2026-09-${day}T17:00:00`,
      reviewer: "Demo Primary Administrator",
      reviewedAt: `2026-09-${day}T17:00:00`,
      corrections: [],
    });
  }
}
export type Phase2State = {
  attendance: Attendance[];
  rules: CertificateRule[];
  templates: CertificateTemplate[];
  certificates: Certificate[];
  achievements: Achievement[];
};
export const initialPhase2: Phase2State = {
  attendance: initialAttendance,
  rules: [{key:'final',final:true,title:'Certificate of Volunteering',project:'',minimumHours:0,requireCompletion:true,requiredTasks:[],additional:'',automation:'Manual Generation',approveEmail:true}],
  templates: [
    {
      key: "default",
      name: "EHF demonstration design",
      active: true,
      signatory: "",
      signatoryTitle: "",
      logo: true,
      nameY: 56,
      detailY: 38,
    },
  ],
  certificates: [],
  achievements: [
    {
      volunteerId: "V-1031",
      project: "Digital Skills Support",
      completed: true,
      tasks: [],
      additionalMet: false,
      completionDate: "2026-10-31",
    },
  ],
};
let state: Phase2State = structuredClone(initialPhase2);
const subs = new Set<() => void>();
export const getPhase2 = () => state;
export const setPhase2 = (next: Phase2State) => {
  state = next;
  subs.forEach((f) => f());
};
export const usePhase2 = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
    () => state,
  );
export const demoNow = () => new Date().toISOString();
