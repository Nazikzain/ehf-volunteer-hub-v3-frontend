import { ADMIN_DEMO_MODE_FORCED, isPreviewHost } from './admin-login';
import { volunteers } from './demo-data';
import { getWorkflow, setWorkflow } from './workflow-store';
import { getPortal, initialPortal, setPortal } from './portal-workflow';
import { getPhase2, initialPhase2, setPhase2 } from './phase2-store';
import { demoSignIn, getAccess, setAccess, type PortalAccount } from './portal-access';
import type { Certificate } from './certificate-workflow';

export const REVIEW_VOLUNTEER_ID = 'V-DEMO-1001';
export const REVIEW_EMAIL = 'volunteer.demo@example.org';
const sourceId = 'V-1042';
const at = '2026-11-01T10:00:00.000Z';
const REVIEW_MARKER = 'ehf-portal-review-demo';
function previewAvailable() {
  return typeof window !== 'undefined' && (ADMIN_DEMO_MODE_FORCED || isPreviewHost(window.location.hostname));
}
export function restorePortalDemo() {
  if (!previewAvailable() || getAccess().sessionId) return;
  try {
    if (window.sessionStorage.getItem(REVIEW_MARKER) === REVIEW_VOLUNTEER_ID) enterPortalDemo();
  } catch { /* Storage can be disabled; explicit Demo Access remains available. */ }
}
export function leavePortalDemo() {
  try { window.sessionStorage.removeItem(REVIEW_MARKER); } catch { /* No stored marker. */ }
  setAccess({ ...getAccess(), sessionId: null });
}

// A literal, previously issued synthetic certificate represents the closed Sep–Oct period.
// Current November work does not retroactively change that historical certificate.
export function buildPortalDemo() {
  const source = volunteers.find(v => v.id === sourceId);
  const template = initialPhase2.templates.find(t => t.active);
  if (!source || !template) throw new Error('Demo review fixtures are unavailable');
  const volunteer = { ...structuredClone(source), id: REVIEW_VOLUNTEER_ID, name: 'Samira Demo', email: REVIEW_EMAIL, hours: 28.5, pendingHours: 0, applicationRef: 'DEMO-REVIEW-1001' };
  const mapId = (id: string) => `review-${id}`;
  const assignments = initialPortal.assignments.filter(a => a.volunteerId === sourceId).map(a => ({ ...structuredClone(a), id: mapId(a.id), volunteerId: volunteer.id }));
  const tasks = initialPortal.tasks.filter(t => t.volunteerId === sourceId).map(t => ({ ...structuredClone(t), id: mapId(t.id), volunteerId: volunteer.id, ...(!['Completed', 'Cancelled'].includes(t.status) ? { assignedAt: '2026-11-01', start: '2026-11-02' } : {}) }));
  const reports = initialPortal.reports.filter(r => r.volunteerId === sourceId).map(r => ({ ...structuredClone(r), id: mapId(r.id), volunteerId: volunteer.id, taskId: mapId(r.taskId), versions: r.versions.map(v => ({ ...structuredClone(v), values: { ...structuredClone(v.values), taskId: mapId(v.values.taskId) } })) }));
  const performance = initialPortal.performance.filter(p => p.volunteerId === sourceId).map(p => ({ ...structuredClone(p), id: mapId(p.id), volunteerId: volunteer.id }));
  performance.push({ id: 'review-PR-2', volunteerId: volunteer.id, projectId: 'P-2', date: '2026-10-30', reviewer: 'Demo Mark Taylor', ratings: [4, 5, 4, 4, 5], strengths: 'Patient digital skills support.', improvements: 'Allow more time for questions.', comments: 'Clear and welcoming session delivery.', recommendations: 'Continue building facilitation skills.', acknowledgedAt: '' });
  const notifications = initialPortal.notifications.filter(n => n.volunteerId === sourceId).map(n => ({ ...structuredClone(n), id: mapId(n.id), volunteerId: volunteer.id }));
  const attendance = initialPhase2.attendance.filter(r => r.volunteerId === sourceId).map(r => ({ ...structuredClone(r), key: mapId(r.key), volunteerId: volunteer.id, submittedBy: volunteer.name, approval: 'Approved' as const, reviewer: 'Demo Primary Administrator', reviewedAt: at, corrections: [], comments: 'Synthetic review account · approved Sep–Oct contribution' }));
  const hours = attendance.reduce((n, r) => n + r.hours, 0);
  const certificate: Certificate = { number: 'DEMO-EHF-2026-REVIEW-1001', final: true, volunteerId: volunteer.id, name: volunteer.name, project: '', title: 'Certificate of Volunteering', hours, startDate: '2026-09-01', completionDate: '2026-10-31', issuedAt: at, status: 'Issued', emailStatus: 'Not Sent', ruleKey: 'final', template: structuredClone(template), valid: true, attendanceKeys: attendance.map(r => r.key), history: [{ at, by: 'Demo Primary Administrator', action: 'Synthetic completed-period certificate confirmed and issued for preview review' }] };
  const completion = { volunteerId: volunteer.id, start: '2026-09-01', end: '2026-10-31', completed: true, approvedBy: 'Demo Primary Administrator', at };
  const account: PortalAccount = { volunteerId: volunteer.id, email: volunteer.email, role: 'Volunteer', status: 'Active', history: [{ at, by: 'Demo fixture', action: 'Synthetic review access · no authentication or password' }] };
  return { volunteer, assignments, tasks, reports, performance, notifications, attendance, certificate, completion, account };
}

export function enterPortalDemo() {
  if (!previewAvailable()) throw new Error('Demo Access is available in the preview only');
  const wf = getWorkflow();
  if (!wf.volunteers.some(v => v.id === REVIEW_VOLUNTEER_ID)) {
    const demo = buildPortalDemo();
    setWorkflow({ ...wf, volunteers: [...wf.volunteers, demo.volunteer] });
    const portal = getPortal();
    setPortal({ ...portal, assignments: [...portal.assignments, ...demo.assignments], tasks: [...portal.tasks, ...demo.tasks], reports: [...portal.reports, ...demo.reports], performance: [...portal.performance, ...demo.performance], notifications: [...portal.notifications, ...demo.notifications], completions: [...portal.completions, demo.completion] });
    const phase2 = getPhase2();
    setPhase2({ ...phase2, attendance: [...phase2.attendance, ...demo.attendance], certificates: [...phase2.certificates, demo.certificate] });
    const access = getAccess();
    setAccess({ ...access, accounts: [...access.accounts, demo.account] });
  }
  setAccess(demoSignIn(getAccess(), REVIEW_EMAIL, new Date().toISOString()));
  // Store only a non-secret demo selection, never accounts, credentials or volunteer records.
  try { window.sessionStorage.setItem(REVIEW_MARKER, REVIEW_VOLUNTEER_ID); } catch { /* Entry still works without storage. */ }
}