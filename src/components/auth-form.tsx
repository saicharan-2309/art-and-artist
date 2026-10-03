"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    const supabase = createClient();
    if (!supabase) { setError("Authentication is not configured yet. Add the Supabase URL and publishable key to .env.local."); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    if (mode === "signup") {
      const result = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: String(form.get("name") ?? "").trim() } },
      });
      if (result.error) setError(result.error.message);
      else if (!result.data.session) setNotice("Check your inbox to verify your email and continue.");
      else router.push("/onboarding");
    } else {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) setError(result.error.message);
      else router.push(searchParams.get("next") || "/discover");
    }
    setBusy(false);
    router.refresh();
  }

  async function googleSignIn() {
    const supabase = createClient();
    if (!supabase) { setError("Authentication is not configured yet. Add your Supabase environment variables first."); return; }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (authError) { setError(authError.message); setBusy(false); }
  }

  return (
    <div className="auth-panel">
      <button className="google-button" type="button" onClick={googleSignIn} disabled={busy}><span className="google-g">G</span> Continue with Google</button>
      <div className="form-divider"><span>or with email</span></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && <label>Full name<input name="name" autoComplete="name" required minLength={2} placeholder="Your professional name" /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
        <label>Password<span className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="At least 8 characters" /><button className="icon-button" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        {mode === "login" && <Link className="forgot-link" href="/forgot-password">Forgot password?</Link>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-success" role="status">{notice}</p>}
        <button className="button button-dark form-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">{mode === "login" ? "New to the community?" : "Already have an account?"} <Link href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create a profile" : "Sign in"}</Link></p>
    </div>
  );
}
