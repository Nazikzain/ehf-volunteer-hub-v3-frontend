import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "./PublicLayout";
import { phpRequest } from "@/lib/php-api";
import type { PhpAccess } from "@/lib/php-api";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export function PhpPortalAccess() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    void phpRequest<{ access: PhpAccess }>("session").then(({ access }) => {
      if (active && access.authenticated && access.role) void navigate({ to: access.role === "volunteer" ? "/portal" : "/admin" });
    }).catch(() => { /* Keep sign-in available when PHP is unavailable. */ });
    return () => { active = false; };
  }, [navigate]);
  return <PublicLayout><section className="mx-auto max-w-lg px-4 py-12">
    <h1 className="text-2xl font-bold">Volunteer Portal Sign-in</h1>
    <form className="mt-6 grid gap-4" onSubmit={async e => {
      e.preventDefault(); if (busy) return; setBusy(true); setError("");
      try { const result = await phpRequest<{ access: PhpAccess }>("login", { email, password }); setPassword(""); await queryClient.cancelQueries(); queryClient.removeQueries({ queryKey: ["php-screen"] }); queryClient.setQueryData(["php-session"], result); await navigate({ to: result.access.role === "volunteer" ? "/portal" : "/admin" }); }
      catch (err) { setPassword(""); setError(err instanceof Error ? err.message : "Sign-in failed"); }
      finally { setBusy(false); }
    }}>
      <label>Registered email<input className="mt-1 w-full rounded-md border bg-card px-3 py-2" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input className="mt-1 w-full rounded-md border bg-card px-3 py-2" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <Button type="submit" disabled={busy}>Sign in</Button>
    </form>
    <Button asChild variant="link" className="mt-4"><Link to="/portal-recover">Forgot password?</Link></Button>
  </section></PublicLayout>;
}