// V3 retires inherited external login destinations, including old environment settings.
export const ADMIN_LOGIN_URL: string | null = null;

// Preview-only Admin Demo Mode: opens the admin pages with synthetic data on the dev server,
// on Lovable preview hosts (incl. shared preview links), or when VITE_ADMIN_DEMO_MODE="true".
// The published site (ethnic-health-hub.lovable.app, custom domains) stays locked.
// Disable before Backend Integration; it never replaces the PHP login.
export const ADMIN_DEMO_MODE_FORCED: boolean =
  import.meta.env.DEV || import.meta.env["VITE_ADMIN_DEMO_MODE"] === "true";

const SUFFIX = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/;
export function isPreviewHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1") return true;
  if (/^[^.]+\.(lovableproject\.com|lovableproject-dev\.com)$/.test(h)) return true;
  if (!SUFFIX.test(h)) return false;
  const labels = h.replace(SUFFIX, "").split(".");
  const first = labels[0] ?? "";
  if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(first)) return labels.length <= 2;
  if (/^live--[0-9a-f-]{36}(?:-thr_[a-z0-9]+)?$/.test(first)) return labels.length === 2;
  if (/^project--[0-9a-f-]{36}-dev$/.test(first)) return labels.length === 1;
  return false;
}
