"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = Record<string, unknown>;

export function SettingsNav({ selected }: { selected: string }) {
  const links = [["Profile","/profile/edit","profile"],["Privacy","/settings","privacy"],["Portfolio","/projects","portfolio"],["Availability","/collaborate","availability"],["Account","/settings/account","account"]];
  return <nav className="settings-nav" aria-label="Settings">{links.map(([label,href,key]) => <a key={key} href={href} aria-current={selected===key?"page":undefined}>{label}</a>)}</nav>;
}

export function ProfileEditForm({ row }: { row: Row }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("");
    const supabase = createClient(); if (!supabase) { setStatus("Configure Supabase before saving."); return; }
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { setStatus("Sign in again to continue."); return; }
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) { setStatus("Use 3–30 lowercase letters, numbers, or underscores for your username."); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      username, full_name: String(form.get("full_name") || "").trim(),
      profession: String(form.get("profession") || "").trim(), headline: String(form.get("headline") || "").trim(),
      biography: String(form.get("biography") || "").trim(), city: String(form.get("city") || "").trim() || null,
      country: String(form.get("country") || "").trim() || null,
    }).eq("user_id", user.id);
    setStatus(error ? error.message : "Profile saved."); setBusy(false);
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setStatus("Choose a JPEG, PNG, or WebP image under 5 MB."); return; }
    const supabase = createClient(); if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    setBusy(true);
    const path = `${user.id}/avatar-${Date.now()}.${file.type.split("/")[1]}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path,file,{contentType:file.type,upsert:false});
    if (uploadError) setStatus(uploadError.message);
    else {
      const { error } = await supabase.from("profiles").update({avatar_path:path}).eq("user_id",user.id);
      if (error) setStatus(error.message);
      else { setAvatar(URL.createObjectURL(file)); setStatus("Profile image updated."); }
    }
    setBusy(false);
  }
  return <form className="route-form" onSubmit={submit}>
    <h2 className="form-title">Professional identity</h2>
    <div className="avatar-upload">
      <span className="person-photo">{avatar ? <Image src={avatar} alt="" width={64} height={64} unoptimized /> : String(row.full_name || "A").slice(0,1)}</span>
      <label>Profile image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={busy} /></label>
    </div>
    <div className="form-grid">
      <label>Full name<input name="full_name" defaultValue={String(row.full_name||"")} required /></label>
      <label>Username<input name="username" defaultValue={String(row.username||"")} required /></label>
      <label>Primary craft<input name="profession" defaultValue={String(row.profession||"")} placeholder="Director, editor, actor…" /></label>
      <label>Headline<input name="headline" defaultValue={String(row.headline||"")} maxLength={160} /></label>
      <label>City<input name="city" defaultValue={String(row.city||"")} /></label>
      <label>Country<input name="country" defaultValue={String(row.country||"")} /></label>
      <label className="field-wide">About your practice<textarea name="biography" defaultValue={String(row.biography||"")} maxLength={3000} /></label>
    </div>
    {status && <p className="status-line" role="status">{status}</p>}
    <button className="button button-dark" type="submit" disabled={busy}>{busy?"Saving…":"Save profile"}</button>
  </form>;
}

export function SettingsForm({ row }: { row: Row }) {
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase=createClient(); if(!supabase){setStatus("Configure Supabase before saving.");return;}
    const {data:{user}}=await supabase.auth.getUser(); if(!user){setStatus("Sign in again to continue.");return;}
    const form=new FormData(event.currentTarget); setBusy(true);
    const settings={
      owner_id:user.id, profile_visibility:String(form.get("profile_visibility")),
      portfolio_visibility:String(form.get("portfolio_visibility")), allow_messages:String(form.get("allow_messages")),
      allow_connections:form.has("allow_connections"), show_availability:form.has("show_availability"),
      show_contact:form.has("show_contact"), email_notifications:form.has("email_notifications"),
    };
    const {error}=await supabase.from("user_settings").upsert(settings);
    const {error:profileError}=error?{error:null}:await supabase.from("profiles").update({visibility:settings.profile_visibility}).eq("user_id",user.id);
    setStatus(error?.message||profileError?.message||"Privacy settings saved.");setBusy(false);
  }
  return <div className="settings-layout"><SettingsNav selected="privacy" /><form className="route-form" onSubmit={submit}>
    <h2 className="form-title">Privacy & contact</h2>
    <div className="form-grid">
      <label>Profile visibility<select name="profile_visibility" defaultValue={String(row.profile_visibility||"public")}><option value="public">Public</option><option value="connections">Connections only</option><option value="private">Private</option></select></label>
      <label>Portfolio visibility<select name="portfolio_visibility" defaultValue={String(row.portfolio_visibility||"public")}><option value="public">Public</option><option value="connections">Connections only</option><option value="private">Private</option></select></label>
      <label>Who can message you<select name="allow_messages" defaultValue={String(row.allow_messages||"everyone")}><option value="everyone">Everyone</option><option value="connections">Connections only</option><option value="nobody">Nobody</option></select></label>
      <label className="inline-check"><input name="allow_connections" type="checkbox" defaultChecked={row.allow_connections!==false} /> Accept connection requests</label>
      <label className="inline-check"><input name="show_availability" type="checkbox" defaultChecked={row.show_availability!==false} /> Show collaboration availability</label>
      <label className="inline-check"><input name="show_contact" type="checkbox" defaultChecked={row.show_contact===true} /> Show contact information</label>
      <label className="inline-check"><input name="email_notifications" type="checkbox" defaultChecked={row.email_notifications!==false} /> Email notifications</label>
    </div>
    {status&&<p className="status-line" role="status">{status}</p>}
    <button className="button button-dark" type="submit" disabled={busy}>{busy?"Saving…":"Save preferences"}</button>
  </form></div>;
}
