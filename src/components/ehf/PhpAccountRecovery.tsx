import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { phpRequest } from "@/lib/php-api";
import { PublicLayout } from "./PublicLayout";

export function PhpAccountRecovery({ mode, token = "" }: { mode: "activate" | "recover" | "reset"; token?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const title = mode === "activate" ? "Activate EHF Account" : mode === "recover" ? "Account Recovery" : "Reset Password";
  return <PublicLayout><section className="mx-auto max-w-lg px-4 py-12">
    <h1 className="text-2xl font-bold">{title}</h1>
    {done ? <p role="status" className="my-6">{mode === "recover" ? "If your account can be recovered, EHF will send the next steps to your registered email." : "Your password has been saved by EHF. You can now sign in."}</p> : <form className="mt-6 grid gap-4" onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      if (mode !== "recover" && !token) { setError("This link is missing its secure token. Request a new link from EHF."); return; }
      if (mode !== "recover" && password !== confirm) { setError("The passwords do not match."); return; }
      setBusy(true); setError("");
      try { await phpRequest(mode === "activate" ? "activate" : mode === "recover" ? "recover" : "reset-password", mode === "recover" ? { email } : { token, password, confirm }); setPassword(""); setConfirm(""); setDone(true); }
      catch (e) { setError(e instanceof Error ? e.message : "EHF could not complete this request."); }
      finally { setBusy(false); }
    }}>
      {mode === "recover" ? <label>Registered email<input required type="email" autoComplete="email" className="mt-1 w-full rounded-md border bg-card px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} /></label> : <>
        <label>New password<input required minLength={12} type="password" autoComplete="new-password" className="mt-1 w-full rounded-md border bg-card px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label>Confirm password<input required minLength={12} type="password" autoComplete="new-password" className="mt-1 w-full rounded-md border bg-card px-3 py-2" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      </>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <Button disabled={busy} type="submit">{busy ? "Submitting…" : mode === "recover" ? "Request recovery" : "Save password"}</Button>
    </form>}
    <Button asChild variant="link" className="mt-4"><Link to="/portal-login">Back to sign-in</Link></Button>
  </section></PublicLayout>;
}