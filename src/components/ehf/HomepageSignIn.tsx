import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { phpRequest, type PhpAccess } from "@/lib/php-api";

export function HomepageSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const inFlight = useRef(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    setReady(true);
    let active = true;
    void phpRequest<{ access: PhpAccess }>("session").then(({ access }) => {
      if (active && access.authenticated && access.role) void navigate({ to: access.role === "volunteer" ? "/portal" : "/admin" });
    }).catch(() => { /* Availability errors are reported on submission, not over the welcome screen. */ });
    return () => { active = false; };
  }, [navigate]);
  return <section className="homepage-login" aria-labelledby="volunteer-sign-in">
    <div className="homepage-login-heading">
      <span className="homepage-login-icon"><UsersRound size={40} strokeWidth={1.8} /></span>
      <div className="min-w-0"><h2 id="volunteer-sign-in">Volunteer Sign In</h2><p>Access your volunteer account</p></div>
    </div>
    <form className="grid gap-5" onSubmit={async event => {
      event.preventDefault();
      if (inFlight.current) return;
      inFlight.current = true; setBusy(true); setError("");
      try {
        const result = await phpRequest<{ access: PhpAccess }>("login", { email: email.trim(), password });
        if (!result.access.authenticated || !result.access.role) throw new Error("Sign-in was not confirmed. Please try again.");
        setPassword(""); await queryClient.cancelQueries();
        queryClient.removeQueries({ queryKey: ["php-screen"] });
        queryClient.setQueryData(["php-session"], result);
        await navigate({ to: result.access.role === "volunteer" ? "/portal" : "/admin" });
      } catch (err) { setPassword(""); setError(err instanceof Error ? err.message : "Sign-in failed. Please try again."); }
      finally { inFlight.current = false; setBusy(false); }
    }}>
      <label className="homepage-field"><span><UserRound size={20} />Volunteer Username</span><input name="email" autoComplete="username" placeholder="Enter your username" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></label>
      <label className="homepage-field"><span><LockKeyhole size={20} />Password</span><div className="relative"><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} className="pr-12" /><Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} title={visible ? "Hide password" : "Show password"} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff /> : <Eye />}</Button></div></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="homepage-enter" disabled={busy || !ready}>{busy ? <><Loader2 className="animate-spin" />Signing in…</> : <>Login <ArrowRight /></>}</Button>
    </form>
    <Button asChild variant="link" className="homepage-recovery"><Link to="/portal-recover">Forgot password?</Link></Button>
  </section>;
}