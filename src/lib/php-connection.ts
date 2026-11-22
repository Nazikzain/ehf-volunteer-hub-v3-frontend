// Retired compatibility boundary; not a contract for the new V3 backend.
export function phpConnectionMessage(hostname: string, configured?: string): string {
  void hostname;
  void configured;
  return "Sign-in and account services are not connected yet. No records have been loaded or saved.";
}
export function explicitDemoMode(hostname: string, search: string): boolean {
  void hostname;
  void search;
  return false;
}
export function phpApiBase(hostname: string, configured?: string): string | null {
  void hostname;
  void configured;
  return null;
}
