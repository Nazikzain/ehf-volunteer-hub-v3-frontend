// Demo Mode shows synthetic, in-memory records for local development and automated tests only.
// Vite replaces import.meta.env.DEV at build time: `vite dev` and Vitest set it to true, while
// every `vite build` (including `--mode development` and hosted previews) sets it to false.
// Production builds therefore compile this check to `false`; there is no hostname, query string,
// environment variable or storage marker that can enable Demo Mode in a built site.
export function demoModeAllowed(): boolean {
  return import.meta.env.DEV === true;
}
