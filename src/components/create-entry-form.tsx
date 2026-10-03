"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schemas = {
  work: z.object({ title: z.string().min(2).max(140), body: z.string().max(5000), medium: z.string().max(80), location: z.string().max(100) }),
  jobs: z.object({ title: z.string().min(3).max(140), role: z.string().min(2), description: z.string().min(20).max(10000), responsibilities: z.string().max(5000), qualifications: z.string().max(5000), location: z.string().max(100), employment_type: z.string(), work_mode: z.string(), compensation: z.string().max(100), deadline: z.string(), skills: z.string(), application_instructions: z.string().max(3000) }),
  collaborate: z.object({ title: z.string().min(3).max(140), project_type: z.string().min(2), description: z.string().min(20).max(10000), roles_needed: z.string(), location: z.string().max(100), compensation: z.string(), timeline: z.string(), budget: z.string(), stage: z.string(), deadline: z.string() }),
  journal: z.object({ title: z.string().min(3).max(140), subtitle: z.string().max(240), category: z.string().max(80), body: z.string().min(30).max(20000) }),
  projects: z.object({ title: z.string().min(2).max(140), project_type: z.string().min(2), description: z.string().max(10000), location: z.string().max(100), year: z.string() }),
  organizations: z.object({ name: z.string().min(2).max(140), slug: z.string().max(60), about: z.string().max(5000), location: z.string().max(100), website: z.string().max(240) }),
};

type Kind = keyof typeof schemas;

export function CreateEntryForm({ kind }: { kind: Kind }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const parsed = schemas[kind].safeParse(data);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the form fields."); return; }
    const values = parsed.data as Record<string, string>;
    const supabase = createClient();
    if (!supabase) { setError("Add Supabase project settings to .env.local before publishing."); return; }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    let row: Record<string, unknown>;
    if (kind === "work") {
      const file = formData.get("media");
      let mediaPath: string | null = null;
      if (file instanceof File && file.size) {
        if (file.size > 50 * 1024 * 1024 || !["image/jpeg","image/png","image/webp","video/mp4","application/pdf"].includes(file.type)) { setError("Choose a JPEG, PNG, WebP, MP4, or PDF under 50 MB."); setBusy(false); return; }
        const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
        mediaPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("portfolio").upload(mediaPath,file,{contentType:file.type});
        if (uploadError) { setError(uploadError.message); setBusy(false); return; }
      }
      row = { owner_id: user.id, title: values.title, body: values.body, medium: values.medium || null, location: values.location || null, media_path: mediaPath, status: "published", visibility: "public" };
    }
    else if (kind === "jobs") row = { owner_id: user.id, title: values.title, role: values.role, description: values.description, responsibilities: values.responsibilities, qualifications: values.qualifications, location: values.location || null, employment_type: values.employment_type, work_mode: values.work_mode, compensation: values.compensation || null, deadline: values.deadline || null, skills: values.skills.split(",").map((value) => value.trim()).filter(Boolean), application_instructions: values.application_instructions, status: "active" };
    else if (kind === "collaborate") row = { owner_id: user.id, title: values.title, project_type: values.project_type, description: values.description, roles_needed: values.roles_needed.split(",").map((value) => value.trim()).filter(Boolean), location: values.location || null, compensation: values.compensation, timeline: values.timeline || null, budget: values.budget || null, stage: values.stage || null, deadline: values.deadline || null, status: "open" };
    else if (kind === "journal") row = { owner_id: user.id, slug: `${values.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`, title: values.title, subtitle: values.subtitle, category: values.category, body: [{ type: "paragraph", text: values.body }], status: "published", published_at: new Date().toISOString() };
    else if (kind === "organizations") row = { owner_id: user.id, slug: (values.slug || values.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), name: values.name, about: values.about, city: values.location || null, website: values.website || null };
    else row = { owner_id: user.id, title: values.title, project_type: values.project_type, description: values.description, location: values.location || null, year: values.year ? Number(values.year) : null, visibility: "public" };
    const table = kind === "work" ? "work_posts" : kind === "collaborate" ? "collaborations" : kind === "journal" ? "blogs" : kind;
    const { data: created, error: dbError } = await supabase.from(table).insert(row).select("id,slug").single();
    if (dbError) { setError(dbError.message); setBusy(false); return; }
    router.push(kind === "work" ? `/work/${created.id}` : kind === "journal" ? `/journal/${created.slug}` : kind === "organizations" ? `/organizations/${created.slug}` : `/${kind === "collaborate" ? "collaborate" : kind}/${created.id}`);
    router.refresh();
  }

  const common = <><label>{kind === "organizations" ? "Organization name" : "Title"}<input name={kind === "organizations" ? "name" : "title"} required maxLength={140} /></label>{kind !== "jobs" && <label>{kind === "work" ? "Medium" : kind === "journal" ? "Category" : kind === "organizations" ? "Location" : "Location"}<input name={kind === "work" ? "medium" : kind === "journal" ? "category" : "location"} /></label>}</>;
  return (
    <form className="route-form" onSubmit={submit}>
      <div className="form-grid">
        {common}
        {kind === "work" && <><label className="field-wide">Description<textarea name="body" maxLength={5000} placeholder="What is this work, and what shaped it?" /></label><label className="field-wide">Media<input type="file" name="media" accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"/><span className="field-hint">JPEG, PNG, WebP, MP4, or PDF up to 50 MB. Files are stored in your private portfolio bucket.</span></label></>}
        {kind === "jobs" && <>
          <label>Role<input name="role" required /></label><label>Location<input name="location" /></label>
          <label>Employment type<select name="employment_type"><option value="contract">Contract</option><option value="freelance">Freelance</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="internship">Internship</option></select></label>
          <label>Work mode<select name="work_mode"><option value="on_site">On site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
          <label>Compensation<input name="compensation" placeholder="Rate or range"/></label><label>Deadline<input name="deadline" type="date"/></label>
          <label className="field-wide">Description<textarea name="description" required minLength={20} /></label>
          <label className="field-wide">Responsibilities<textarea name="responsibilities"/></label><label className="field-wide">Qualifications<textarea name="qualifications"/></label>
          <label>Skills, separated by commas<input name="skills" placeholder="Editing, sound design"/></label><label>Application instructions<input name="application_instructions"/></label>
        </>}
        {kind === "collaborate" && <>
          <label>Project type<input name="project_type" required placeholder="Film, theatre, photography…" /></label>
          <label>Roles needed<input name="roles_needed" placeholder="Editor, composer, production designer" /></label>
          <label>Compensation<select name="compensation"><option value="negotiable">Negotiable</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></label>
          <label>Project stage<input name="stage" placeholder="Development, production…"/></label><label>Timeline<input name="timeline" placeholder="Three weeks, autumn 2026…"/></label>
          <label>Budget<input name="budget" placeholder="Optional range"/></label><label>Deadline<input name="deadline" type="date"/></label>
          <label className="field-wide">Project brief<textarea name="description" required minLength={20} /></label>
        </>}
        {kind === "journal" && <>
          <label>Subtitle<input name="subtitle" maxLength={240} /></label><label className="field-wide">Article<textarea name="body" required minLength={30} /></label>
        </>}
        {kind === "projects" && <>
          <label>Project type<input name="project_type" required placeholder="Feature film, exhibition…" /></label><label>Year<input name="year" type="number" min="1800" max="2200" /></label>
          <label className="field-wide">About this project<textarea name="description" /></label>
        </>}
        {kind === "organizations" && <>
          <label>Profile address<input name="slug" placeholder="studio-name" /></label><label>Website<input name="website" type="url" placeholder="https://" /></label>
          <label className="field-wide">About the organization<textarea name="about" /></label>
        </>}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-dark" type="submit" disabled={busy}>{busy ? "Publishing…" : kind === "journal" ? "Publish article" : "Publish"} <ArrowRight size={16} /></button>
    </form>
  );
}
