import { useEffect, useState } from "react";
import { phpConnectionMessage } from "./php-connection";

// Retained UI compatibility facade, not the new backend contract.
// No transport, credentials, CSRF exchange or endpoint configuration survives.
function unavailable(): never {
  throw new Error(phpConnectionMessage(""));
}
export function phpIntegrationEnabled() {
  // Presentation selector only: keep service-backed screens, never demo fallback.
  return typeof window !== "undefined";
}
export function usePhpIntegration() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => setEnabled(phpIntegrationEnabled()), []);
  return enabled;
}
export async function phpRequest<T>(path: string, data?: Record<string, unknown>): Promise<T> {
  void path;
  void data;
  return unavailable();
}

export type PhpAccess = {
  authenticated: boolean;
  role: "technical_system_administrator" | "admin" | "volunteer" | null;
  email: string | null;
  volunteer_id: number | null;
  capabilities: Record<string, { organisation: boolean; project_ids: number[] }>;
};
export function phpCan(access: PhpAccess, action: string, project?: number) {
  const scope = access.capabilities[action];
  return Boolean(
    scope && (scope.organisation || (project !== undefined && scope.project_ids.includes(project))),
  );
}
export async function phpDownload(path: string, filename: string) {
  void path;
  void filename;
  return unavailable();
}
export async function phpUpload(report: number, file: File): Promise<{ id: number }> {
  void report;
  void file;
  return unavailable();
}
