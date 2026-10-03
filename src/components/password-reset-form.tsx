"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordResetForm({ mode }: { mode:"request"|"update" }) {
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage("");
    const supabase=createClient();if(!supabase){setMessage("Add your Supabase settings to .env.local.");return;}
    const form=new FormData(event.currentTarget);setBusy(true);
    const result=mode==="request"
      ? await supabase.auth.resetPasswordForEmail(String(form.get("email")), {redirectTo:`${window.location.origin}/auth/callback?next=/reset-password`})
      : await supabase.auth.updateUser({password:String(form.get("password"))});
    setMessage(result.error?result.error.message:mode==="request"?"If that address has an account, a reset link is on its way.":"Password updated. You can sign in with the new password.");
    setBusy(false);
  }
  return <form className="auth-form" onSubmit={submit}>
    {mode==="request"?<label>Email address<input type="email" name="email" required autoComplete="email"/></label>:<label>New password<input type="password" name="password" minLength={8} required autoComplete="new-password"/></label>}
    {message&&<p className="status-line" role="status">{message}</p>}
    <button className="button button-dark form-submit" type="submit" disabled={busy}>{busy?"Please wait…":mode==="request"?"Send reset link":"Update password"}</button>
  </form>;
}
