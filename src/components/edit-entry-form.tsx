"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Kind="work"|"jobs"|"collaborate"|"journal"|"projects"|"organizations";
type Row=Record<string,unknown>;
const table:Record<Kind,string>={work:"work_posts",jobs:"jobs",collaborate:"collaborations",journal:"blogs",projects:"projects",organizations:"organizations"};
export function EditEntryForm({kind,id,row}:{kind:Kind;id:string;row:Row}){
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");const form=new FormData(event.currentTarget);const value=(name:string)=>String(form.get(name)||"").trim();
    const supabase=createClient();if(!supabase){setError("Supabase is not configured.");return;}
    const {data:{user}}=await supabase.auth.getUser();if(!user){router.push("/login");return;}
    let patch:Record<string,unknown>;
    if(kind==="work")patch={title:value("title"),body:value("body"),medium:value("medium"),location:value("location")||null};
    else if(kind==="jobs")patch={title:value("title"),role:value("role"),description:value("description"),location:value("location")||null,work_mode:value("work_mode"),employment_type:value("employment_type")};
    else if(kind==="collaborate")patch={title:value("title"),project_type:value("project_type"),description:value("description"),roles_needed:value("roles_needed").split(",").map(s=>s.trim()).filter(Boolean),location:value("location")||null,compensation:value("compensation")};
    else if(kind==="journal")patch={title:value("title"),subtitle:value("subtitle"),category:value("category"),body:[{type:"paragraph",text:value("body")}],status:value("status")};
    else if(kind==="organizations")patch={name:value("name"),slug:value("slug"),about:value("about"),city:value("location")||null,website:value("website")||null};
    else patch={title:value("title"),project_type:value("project_type"),description:value("description"),location:value("location")||null,year:value("year")?Number(value("year")):null};
    setBusy(true);const {error:saveError}=await supabase.from(table[kind]).update(patch).eq("id",id).eq("owner_id",user.id);
    if(saveError)setError(saveError.message);else{router.push(kind==="work"?`/work/${id}`:kind==="organizations"?`/organizations/${value("slug")}`:kind==="journal"?`/journal/${row.slug}`:`/${kind==="collaborate"?"collaborate":kind}/${id}`);router.refresh();}
    setBusy(false);
  }
  return <form className="route-form" onSubmit={submit}><div className="form-grid">
    <label>{kind==="organizations"?"Organization name":"Title"}<input name={kind==="organizations"?"name":"title"} defaultValue={String(row.title||row.name||"")} required/></label>
    {kind==="work"&&<><label>Medium<input name="medium" defaultValue={String(row.medium||"")}/></label><label>Location<input name="location" defaultValue={String(row.location||"")}/></label><label className="field-wide">Description<textarea name="body" defaultValue={String(row.body||"")}/></label></>}
    {kind==="jobs"&&<><label>Role<input name="role" defaultValue={String(row.role||"")} required/></label><label>Employment type<select name="employment_type" defaultValue={String(row.employment_type||"contract")}><option value="contract">Contract</option><option value="freelance">Freelance</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="internship">Internship</option></select></label><label>Work mode<select name="work_mode" defaultValue={String(row.work_mode||"on_site")}><option value="on_site">On site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label><label>Location<input name="location" defaultValue={String(row.location||"")}/></label><label className="field-wide">Description<textarea name="description" defaultValue={String(row.description||"")} required/></label></>}
    {kind==="collaborate"&&<><label>Project type<input name="project_type" defaultValue={String(row.project_type||"")}/></label><label>Roles needed<input name="roles_needed" defaultValue={Array.isArray(row.roles_needed)?row.roles_needed.join(", "):""}/></label><label>Compensation<select name="compensation" defaultValue={String(row.compensation||"negotiable")}><option value="negotiable">Negotiable</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></label><label>Location<input name="location" defaultValue={String(row.location||"")}/></label><label className="field-wide">Brief<textarea name="description" defaultValue={String(row.description||"")} required/></label></>}
    {kind==="journal"&&<><label>Subtitle<input name="subtitle" defaultValue={String(row.subtitle||"")}/></label><label>Category<input name="category" defaultValue={String(row.category||"Journal")}/></label><label>Publishing state<select name="status" defaultValue={String(row.status||"draft")}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="field-wide">Article text<textarea name="body" defaultValue={Array.isArray(row.body)?String((row.body[0] as {text?:string})?.text||""):String(row.body||"")}/></label></>}
    {kind==="projects"&&<><label>Project type<input name="project_type" defaultValue={String(row.project_type||"")}/></label><label>Year<input name="year" type="number" defaultValue={String(row.year||"")}/></label><label>Location<input name="location" defaultValue={String(row.location||"")}/></label><label className="field-wide">Description<textarea name="description" defaultValue={String(row.description||"")}/></label></>}
    {kind==="organizations"&&<><label>Profile address<input name="slug" defaultValue={String(row.slug||"")} required/></label><label>Website<input name="website" type="url" defaultValue={String(row.website||"")}/></label><label>Location<input name="location" defaultValue={String(row.city||"")}/></label><label className="field-wide">About<textarea name="about" defaultValue={String(row.about||"")}/></label></>}
  </div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-dark" type="submit" disabled={busy}>{busy?"Saving…":"Save changes"} <ArrowRight size={16}/></button></form>;
}
