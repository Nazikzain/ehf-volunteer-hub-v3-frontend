import { describe, expect, it } from "vitest";
import { phpCan, type PhpAccess } from "@/lib/php-api";

const base: PhpAccess = { authenticated: true, role: "admin", email: null, volunteer_id: null, capabilities: {} };
describe("PHP-confirmed capabilities", () => {
  it("gives an Admin with no grants no operational access", () => {
    expect(phpCan(base, "projects.create")).toBe(false);
  });
  it("limits project-specific access to the granted project", () => {
    const scoped = { ...base, capabilities: { "projects.edit": { organisation: false, project_ids: [10] } } };
    expect(phpCan(scoped, "projects.edit", 10)).toBe(true);
    expect(phpCan(scoped, "projects.edit", 11)).toBe(false);
    expect(phpCan(scoped, "projects.edit")).toBe(false);
  });
  it("does not grant operational authority to the technical role", () => {
    expect(phpCan({ ...base, role: "technical_system_administrator" }, "projects.create")).toBe(false);
  });
  it("does not turn a read permission into an export permission", () => {
    const read = { ...base, capabilities: { "reports.view": { organisation: true, project_ids: [] } } };
    expect(phpCan(read, "reports.view", 10)).toBe(true);
    expect(phpCan(read, "reports.export", 10)).toBe(false);
  });
});