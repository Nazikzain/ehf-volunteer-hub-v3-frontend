import { createContext, useContext } from "react";
import type { Actor } from "./attendance";
import type { Volunteer } from "./volunteer-workflow";
import { getPortal } from "./portal-workflow";
import { tasks } from "./demo-data";
export const normaliseProject = (name: string) => name === "Community Wellbeing" ? "Community Wellbeing Programme" : name === "Health Awareness" ? "Health Awareness Sessions" : name;
export function volunteerProjects(v: Volunteer) { const s=getPortal(); return s.projects.filter(p=>p.status==='Active'&&s.assignments.some(a=>a.volunteerId===v.id&&a.projectId===p.id&&a.status==='Active')).map(p=>p.name); }
const PortalActorContext = createContext<Actor>({ role: "Volunteer", name: "", volunteerId: undefined, projects: [] });
export const PortalActorProvider = PortalActorContext.Provider;
export const usePortalActor = () => useContext(PortalActorContext);