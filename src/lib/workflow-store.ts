// In-memory Demo Mode store: lasts only for this browser tab and never leaves the page.
import { useSyncExternalStore } from "react";
import { applications, volunteers } from "@/lib/demo-data";
import type { WorkflowState } from "@/lib/volunteer-workflow";

let state: WorkflowState = { applications: structuredClone(applications), volunteers: structuredClone(volunteers) };
const subs = new Set<() => void>();
export const getWorkflow = () => state;
export const setWorkflow = (s: WorkflowState) => { state = s; subs.forEach((f) => f()); };
export const useWorkflow = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state, () => state);
export const demoActor = () => "Demo Admin";
export const nowStamp = () => new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
