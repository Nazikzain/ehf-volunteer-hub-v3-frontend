import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

const ROUTES_DIR = "src/routes";
// Retired public-application URLs. Each must redirect to the homepage and render nothing.
const RETIRED_PUBLIC_PATHS = ["/register", "/application-received"];
const APPLICATION_WORDS = /regist|appl(y|ication)|sign-?up|enrol|join/i;

const toPosix = (path: string) => path.split("\\").join("/");

// Every route module, including files inside nested folders (src/routes/a/b.tsx).
function routeFiles(dir = ROUTES_DIR): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return /\.tsx?$/.test(name) && !/\.(test|spec)\./.test(name) ? [toPosix(path)] : [];
  });
}

// TanStack file route id: folders and dots both separate segments (admin/index.tsx = admin.index).
function routeSegments(file: string): string[] {
  return toPosix(relative(ROUTES_DIR, file))
    .replace(/\.tsx?$/, "")
    .split(/[/.]/);
}

// Authenticated workspaces: /admin and /portal with their children. Everything else is public,
// including the root layout and the public account pages (/portal-login, /portal-activate, ...).
function isProtected(file: string): boolean {
  const [first] = routeSegments(file);
  return first === "admin" || first === "portal";
}

function resolveImport(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join("src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = join(dirname(from), specifier);
  else return null; // package import
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (/\.tsx?$/.test(candidate) && existsSync(candidate)) return toPosix(candidate);
  }
  return null; // asset or JSON import
}

// All source modules reachable from the given entry files through static or dynamic imports.
function reachableModules(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    const specifiers = source.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g);
    for (const [, specifier] of specifiers) {
      const target = specifier ? resolveImport(file, specifier) : null;
      if (target && !seen.has(target)) queue.push(target);
    }
  }
  return seen;
}

// Ways a module could send, record or confirm a public application.
const SUBMISSION_PATTERNS: [string, RegExp][] = [
  [
    "network call to an application endpoint",
    /\b(phpRequest|phpUpload|fetch|axios(\.\w+)?|sendBeacon|apiRequest|request)\s*(<[^>]*>)?\s*\(\s*[`"'][^`"']*(regist|appl(y|ication)|sign-?up|enrol|join)/i,
  ],
  ["XMLHttpRequest", /\bnew\s+XMLHttpRequest\b/],
  ["HTML form posting to a server URL", /<form\b[^>]*\baction\s*=/i],
  [
    "application workflow operation",
    /\boperation\s*:\s*[`"'](apply|application|register|registration|signup|enrol)/i,
  ],
  ["application receipt cache", /["'`][a-z-]*application-receipt["'`]/i],
  [
    "navigation to a retired public application page",
    /\bto\s*[:=]\s*\{?\s*["'`]\/(register|application-received|apply)\b/,
  ],
];

async function landingPath(path: string): Promise<string> {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: new QueryClient() },
  });
  await router.load();
  return router.state.location.pathname;
}

const files = routeFiles();
const publicFiles = files.filter((f) => !isProtected(f));

describe("public volunteer registration is disabled", () => {
  it("discovers every route module, including nested folders", () => {
    const generated = readFileSync("src/routeTree.gen.ts", "utf8");
    const registered = [...generated.matchAll(/from\s+'\.\/routes\/([^']+)'/g)].map(
      ([, path]) => `${ROUTES_DIR}/${path}`,
    );
    const discovered = files.map((f) => f.replace(/\.tsx?$/, ""));
    expect(registered.length).toBeGreaterThan(0);
    expect(new Set(discovered)).toEqual(new Set(registered));
  });

  it("treats only /admin and /portal workspaces as protected", () => {
    expect(isProtected("src/routes/admin.users.tsx")).toBe(true);
    expect(isProtected("src/routes/admin/users.tsx")).toBe(true);
    expect(isProtected("src/routes/portal/index.tsx")).toBe(true);
    expect(isProtected("src/routes/portal-login.tsx")).toBe(false);
    expect(isProtected("src/routes/register.tsx")).toBe(false);
    expect(isProtected("src/routes/__root.tsx")).toBe(false);
    expect(publicFiles).toContain("src/routes/index.tsx");
  });

  it.each(RETIRED_PUBLIC_PATHS)("redirects the retired %s entry to the homepage", async (path) => {
    expect(await landingPath(path)).toBe("/");
  });

  it("has no public application route other than the retired redirects", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const publicPaths = Object.keys(router.routesByPath).filter(
      (path) => !/^\/(admin|portal)(\/|$)/.test(path),
    );
    expect(publicPaths.filter((path) => APPLICATION_WORDS.test(path)).sort()).toEqual(
      [...RETIRED_PUBLIC_PATHS].sort(),
    );
  });

  it("keeps the retired routes redirect-only, with no page component", () => {
    for (const file of publicFiles.filter((f) =>
      APPLICATION_WORDS.test(routeSegments(f).join("/")),
    )) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toMatch(/throw\s+redirect\(/);
      expect(source, file).not.toMatch(/\bcomponent\s*:/);
    }
  });

  it("has no application submission path in any module reachable from a public route", () => {
    const modules = reachableModules(publicFiles);
    expect(modules.size).toBeGreaterThan(publicFiles.length);
    const findings: string[] = [];
    for (const file of modules) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          for (const [label, pattern] of SUBMISSION_PATTERNS) {
            if (pattern.test(line)) findings.push(`${file}:${index + 1} ${label}`);
          }
        });
    }
    expect(findings).toEqual([]);
  });
});
