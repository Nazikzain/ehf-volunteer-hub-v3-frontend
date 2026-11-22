import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoModeAllowed } from "@/lib/demo-mode";
import { PreviewOnly } from "@/components/ehf/PreviewOnly";
import {
  enterPortalDemo,
  leavePortalDemo,
  restorePortalDemo,
  REVIEW_VOLUNTEER_ID,
} from "@/lib/portal-demo";
import { getAccess } from "@/lib/portal-access";

// The gate is under test, not the public page chrome (which needs a router).
vi.mock("@/components/ehf/PublicLayout", () => ({
  PublicLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "test" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  leavePortalDemo();
  window.sessionStorage.clear();
});

describe("Demo Mode is limited to local development and automated tests", () => {
  it("is available in the test runner", () => {
    expect(demoModeAllowed()).toBe(true);
  });

  it("is unavailable when the build is not a development build", () => {
    vi.stubEnv("DEV", false);
    expect(demoModeAllowed()).toBe(false);
  });

  it("hides demo workspaces behind the locked screen outside development", async () => {
    vi.stubEnv("DEV", false);
    render(
      <PreviewOnly>
        <p>Synthetic demo workspace</p>
      </PreviewOnly>,
    );
    expect(await screen.findByText("Portal access is not connected yet")).toBeTruthy();
    expect(screen.queryByText("Synthetic demo workspace")).toBeNull();
  });

  it("refuses one-click portal demo entry outside development", () => {
    vi.stubEnv("DEV", false);
    expect(() => enterPortalDemo()).toThrow();
    expect(getAccess().sessionId).toBeNull();
  });

  it("ignores a stored demo marker outside development", () => {
    vi.stubEnv("DEV", false);
    window.sessionStorage.setItem("ehf-portal-review-demo", REVIEW_VOLUNTEER_ID);
    restorePortalDemo();
    expect(getAccess().sessionId).toBeNull();
  });

  it("has no hostname, environment-variable or query-string switch in source", () => {
    const offenders = sourceFiles("src").filter((file) =>
      /isPreviewHost|ADMIN_DEMO_MODE_FORCED|VITE_ADMIN_DEMO_MODE|lovable\.app|gpt-eng\.com|lovableproject/.test(
        readFileSync(file, "utf8"),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it("routes every demo gate through the single build-time check", () => {
    for (const file of [
      "src/routes/admin.tsx",
      "src/components/ehf/PreviewOnly.tsx",
      "src/lib/portal-demo.ts",
    ]) {
      expect(readFileSync(file, "utf8")).toContain("demoModeAllowed()");
    }
  });
});
