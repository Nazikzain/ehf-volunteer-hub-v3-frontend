import { afterEach, describe, expect, it, vi } from "vitest";
import { phpRequest, phpDownload, phpUpload, phpIntegrationEnabled } from "@/lib/php-api";
import { explicitDemoMode, phpApiBase } from "@/lib/php-connection";
import { ADMIN_LOGIN_URL } from "@/lib/admin-login";

afterEach(() => vi.unstubAllGlobals());
describe("V3 frontend-only separation", () => {
  it("does not reuse inherited API settings or local fallback", () => {
    expect(phpApiBase("localhost")).toBeNull();
    expect(phpApiBase("example.org", "https://retired.example.org/api")).toBeNull();
  });
  it("does not reuse an inherited admin login destination", () =>
    expect(ADMIN_LOGIN_URL).toBeNull());
  it("cannot fall back to demo through a preview query", () => {
    vi.stubGlobal("window", { location: { hostname: "localhost", search: "?demo=1" } });
    expect(explicitDemoMode("localhost", "?demo=1")).toBe(false);
    expect(phpIntegrationEnabled()).toBe(true);
  });
  it.each(["session", "login", "logout", "workflow", "screen/admin/dashboard"])(
    "rejects %s without a network request",
    async (path) => {
      const fetcher = vi.fn();
      vi.stubGlobal("fetch", fetcher);
      await expect(
        phpRequest(path, { email: "test@example.invalid", password: "Synthetic test input" }),
      ).rejects.toThrow();
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("blocks old uploads and downloads without network or successful output", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(phpDownload("reports/export", "report.csv")).rejects.toThrow();
    await expect(phpUpload(1, new File(["test"], "test.txt"))).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
