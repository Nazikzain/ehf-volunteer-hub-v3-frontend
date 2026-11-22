import { readdirSync, readFileSync } from "node:fs";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

async function landingPath(path: string): Promise<string> {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: new QueryClient() },
  });
  await router.load();
  return router.state.location.pathname;
}

describe("public volunteer registration is disabled", () => {
  it("redirects the retired /register entry to the homepage", async () => {
    expect(await landingPath("/register")).toBe("/");
  });

  it("redirects the retired /application-received receipt to the homepage", async () => {
    expect(await landingPath("/application-received")).toBe("/");
  });

  it("does not render a receipt or read an application reference", () => {
    const source = readFileSync("src/routes/application-received.tsx", "utf8");
    expect(source).not.toMatch(/component\s*:/);
    expect(source).not.toContain("php-application-receipt");
  });

  it("has no public route that submits an application", () => {
    const routes = readdirSync("src/routes").filter(
      (f) => f.endsWith(".tsx") && !/^(admin|portal)[.]/.test(f),
    );
    for (const file of routes) {
      const source = readFileSync(`src/routes/${file}`, "utf8");
      expect(source, file).not.toMatch(
        /phpRequest[^(]*\(\s*["'`](apply|application|applications|register)\b/,
      );
    }
  });
});
