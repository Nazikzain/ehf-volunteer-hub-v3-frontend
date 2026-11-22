import { beforeEach, describe, expect, it } from 'vitest';
import { buildPortalDemo, enterPortalDemo, restorePortalDemo, leavePortalDemo, REVIEW_VOLUNTEER_ID } from '../lib/portal-demo';
import { EMPTY_ACCESS, getAccess, setAccess } from '../lib/portal-access';
import { getWorkflow, setWorkflow } from '../lib/workflow-store';
import { applications, volunteers } from '../lib/demo-data';
import { getPortal, initialPortal, setPortal } from '../lib/portal-workflow';
import { getPhase2, initialPhase2, setPhase2 } from '../lib/phase2-store';

beforeEach(() => {
  window.sessionStorage.clear();
  setAccess(structuredClone(EMPTY_ACCESS));
  setWorkflow({ applications: structuredClone(applications), volunteers: structuredClone(volunteers) });
  setPortal(structuredClone(initialPortal));
  setPhase2(structuredClone(initialPhase2));
});
describe('password-free synthetic portal review', () => {
  it('restores password-free demo access and original records after a refresh reset', () => {
    enterPortalDemo();
    expect(window.sessionStorage.getItem('ehf-portal-review-demo')).toBe(REVIEW_VOLUNTEER_ID);
    setAccess(structuredClone(EMPTY_ACCESS));
    setWorkflow({ applications: structuredClone(applications), volunteers: structuredClone(volunteers) });
    setPortal(structuredClone(initialPortal));
    setPhase2(structuredClone(initialPhase2));
    restorePortalDemo();
    expect(getAccess().sessionId).toBe(REVIEW_VOLUNTEER_ID);
    expect(getPortal().tasks.filter(t => t.volunteerId === REVIEW_VOLUNTEER_ID)).toHaveLength(6);
    expect(getPhase2().certificates.filter(c => c.volunteerId === REVIEW_VOLUNTEER_ID)).toHaveLength(1);
  });
  it('does not restore after explicitly leaving the demo session', () => {
    enterPortalDemo();
    leavePortalDemo();
    restorePortalDemo();
    expect(getAccess().sessionId).toBeNull();
    expect(window.sessionStorage.getItem('ehf-portal-review-demo')).toBeNull();
  });
  it('enters an active Volunteer account without storing a password', () => {
    enterPortalDemo();
    expect(getAccess().sessionId).toBe(REVIEW_VOLUNTEER_ID);
    expect(getAccess().accounts).toEqual([expect.objectContaining({ role: 'Volunteer', status: 'Active', email: 'volunteer.demo@example.org' })]);
    expect(JSON.stringify(getAccess())).not.toMatch(/"password"/i);
  });
  it('contains multiple assignments, tasks, attendance, reports and reviews scoped to one identity', () => {
    const demo = buildPortalDemo();
    for (const rows of [demo.assignments, demo.tasks, demo.attendance, demo.reports, demo.performance]) {
      expect(rows.length).toBeGreaterThan(1);
      expect(rows.every(r => r.volunteerId === REVIEW_VOLUNTEER_ID)).toBe(true);
    }
    expect(demo.reports.every(r => demo.tasks.some(t => t.id === r.taskId && t.projectId === r.projectId))).toBe(true);
  });
  it('has exactly one issued final certificate derived from approved historical attendance', () => {
    enterPortalDemo();
    const certs = getPhase2().certificates.filter(c => c.volunteerId === REVIEW_VOLUNTEER_ID);
    expect(certs).toHaveLength(1);
    expect(certs[0]).toMatchObject({ final: true, status: 'Issued', valid: true, project: '', completionDate: '2026-10-31', hours: 28.5 });
    expect(certs[0]?.hours).toBe(getPhase2().attendance.filter(r => r.volunteerId === REVIEW_VOLUNTEER_ID && r.approval === 'Approved').reduce((n, r) => n + r.hours, 0));
  });
  it('re-entry preserves edits, does not duplicate fixtures and leaves existing volunteers untouched', () => {
    const original = structuredClone(getPortal().tasks);
    enterPortalDemo();
    setPortal({ ...getPortal(), tasks: getPortal().tasks.map(t => t.id === 'review-T-1' ? { ...t, progress: 65 } : t) });
    enterPortalDemo();
    expect(getPortal().tasks.find(t => t.id === 'review-T-1')?.progress).toBe(65);
    expect(getPortal().tasks.filter(t => t.volunteerId !== REVIEW_VOLUNTEER_ID)).toEqual(original);
    expect(getWorkflow().volunteers.filter(v => v.id === REVIEW_VOLUNTEER_ID)).toHaveLength(1);
    expect(getPhase2().certificates.filter(c => c.volunteerId === REVIEW_VOLUNTEER_ID)).toHaveLength(1);
  });
});