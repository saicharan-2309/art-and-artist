"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const steps=["Identity","Craft","Experience","Portfolio","Credits","Collaboration","Privacy"];
export function OnboardingWizard({initialStep,username}:{initialStep:number;username:string}){
  const [step,setStep]=useState(Math.min(Math.max(initialStep,0),6));
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const router=useRouter();
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");
    const supabase=createClient();if(!supabase){setError("Add Supabase settings before saving your profile.");return;}
    const {data:{user}}=await supabase.auth.getUser();if(!user){router.push("/login");return;}
    const data=new FormData(event.currentTarget);setBusy(true);
    let problem:string|undefined;
    if(step===0){
      const {error:e}=await supabase.from("profiles").update({full_name:String(data.get("full_name")||"").trim(),profession:String(data.get("profession")||"").trim(),headline:String(data.get("headline")||"").trim(),city:String(data.get("city")||"").trim()||null,country:String(data.get("country")||"").trim()||null,onboarding_step:1}).eq("user_id",user.id);problem=e?.message;
    }else if(step===1){
      const names=String(data.get("skills")||"").split(",").map(s=>s.trim()).filter(Boolean);
      const {data:skills,error:e}=names.length?await supabase.from("skills").select("id,name").in("name",names):{data:[],error:null};problem=e?.message;
      if(skills?.length){const rows=skills.map(skill=>({owner_id:user.id,skill_id:skill.id}));const {error:saveError}=await supabase.from("profile_skills").upsert(rows);problem=saveError?.message;}
      if(!problem){const {error:e2}=await supabase.from("profiles").update({onboarding_step:2}).eq("user_id",user.id);problem=e2?.message;}
    }else if(step===2){
      const role=String(data.get("role")||"").trim(),organization=String(data.get("organization")||"").trim();
      if(role&&organization){const {error:e}=await supabase.from("experiences").insert({owner_id:user.id,organization,role,description:String(data.get("description")||"")});problem=e?.message;}
      if(!problem){const {error:e}=await supabase.from("profiles").update({onboarding_step:3}).eq("user_id",user.id);problem=e?.message;}
    }else if(step===3){
      const file=(data.get("media") as File|undefined);const title=String(data.get("work_title")||"").trim();
      if(file&&file.size>0){
        if(file.size>50*1024*1024){problem="Choose a file under 50 MB.";}
        else if(!["image/jpeg","image/png","image/webp","video/mp4","application/pdf","audio/mpeg"].includes(file.type)){problem="Choose an image, MP4, PDF, or MP3 file.";}
        else {
          const ext=file.name.split(".").pop()?.toLowerCase()||"bin";const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
          const {error:uploadError}=await supabase.storage.from("portfolio").upload(path,file,{contentType:file.type});
          if(uploadError)problem=uploadError.message;
          else {const type=file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":file.type.startsWith("audio/")?"audio":"document";const {error:rowError}=await supabase.from("portfolio_items").insert({owner_id:user.id,title:title||file.name,media_path:path,media_type:type,visibility:"public"});problem=rowError?.message;}
        }
      }
      if(!problem){const {error:e}=await supabase.from("profiles").update({onboarding_step:4}).eq("user_id",user.id);problem=e?.message;}
    }else if(step===4){
      const project=String(data.get("project_title")||"").trim(),role=String(data.get("credit_role")||"").trim();
      if(project&&role){const {error:e}=await supabase.from("credits").insert({owner_id:user.id,project_title:project,role,production:String(data.get("production")||"")||null,verification_status:"pending"});problem=e?.message;}
      if(!problem){const {error:e}=await supabase.from("profiles").update({onboarding_step:5}).eq("user_id",user.id);problem=e?.message;}
    }else if(step===5){
      const {error:e}=await supabase.from("availability").upsert({owner_id:user.id,status:String(data.get("availability")||"open"),interested_in:String(data.get("roles")||"").split(",").map(v=>v.trim()).filter(Boolean),note:String(data.get("note")||"")});problem=e?.message;
      if(!problem){const {error:e2}=await supabase.from("profiles").update({onboarding_step:6}).eq("user_id",user.id);problem=e2?.message;}
    }else{
      const {error:e}=await supabase.from("user_settings").upsert({owner_id:user.id,profile_visibility:String(data.get("visibility")),portfolio_visibility:String(data.get("visibility")),allow_messages:"everyone",allow_connections:true,show_availability:true});problem=e?.message;
      if(!problem){const {error:e2}=await supabase.from("profiles").update({visibility:String(data.get("visibility")),onboarding_step:7}).eq("user_id",user.id);problem=e2?.message;}
    }
    setBusy(false);
    if(problem){setError(problem);return;}
    if(step===6){router.push(`/u/${username}`);router.refresh();}else setStep(step+1);
  }
  function back(){setStep(Math.max(0,step-1));setError("");}
  return <section className="onboarding">
    <div className="step-progress" aria-label={`Step ${step+1} of ${steps.length}`}>{steps.map((label,index)=><div className={index===step?"step-point active":index<step?"step-point complete":"step-point"} key={label}><span>{index<step?<Check size={13}/>:String(index+1).padStart(2,"0")}</span><b>{label}</b></div>)}</div>
    <form className="route-form" onSubmit={submit}>
      {step===0&&<div className="form-grid"><label>Full name<input name="full_name" autoComplete="name" required/></label><label>Primary craft<input name="profession" placeholder="Cinematographer, actor…" required/></label><label className="field-wide">Professional headline<input name="headline" maxLength={160} placeholder="The work you make, in a sentence"/></label><label>City<input name="city"/></label><label>Country<input name="country"/></label></div>}
      {step===1&&<div className="form-grid"><label className="field-wide">Your skills, separated by commas<input name="skills" placeholder="Directing, Cinematography, Editing"/><span className="field-hint">Select names from the craft list in the database.</span></label></div>}
      {step===2&&<div className="form-grid"><label>Role<input name="role" placeholder="Director, editor, performer…"/></label><label>Company or production<input name="organization" placeholder="Studio, collective, or independent"/></label><label className="field-wide">A little context<textarea name="description" placeholder="What did you do there?"/></label></div>}
      {step===3&&<div className="form-grid"><label className="field-wide">First portfolio piece<input name="work_title" placeholder="Give the work a title"/></label><label className="field-wide">Choose a media file<input name="media" type="file" accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf,audio/mpeg"/><span className="field-hint">Images, MP4, PDF, and MP3 up to 50 MB. You can also skip this step.</span></label></div>}
      {step===4&&<div className="form-grid"><label>Project or production<input name="project_title" placeholder="Feature, campaign, stage production…"/></label><label>Your credit<input name="credit_role" placeholder="Your role on this work"/></label><label className="field-wide">Production / organization<input name="production"/></label><p className="field-hint field-wide">Credits are marked pending until verified by an organization.</p></div>}
      {step===5&&<div className="form-grid"><label>Availability<select name="availability"><option value="open">Open to opportunities</option><option value="selective">Selective</option><option value="unavailable">Not available</option></select></label><label>Interested roles<input name="roles" placeholder="Film, theatre, portraiture…"/></label><label className="field-wide">Collaboration note<textarea name="note" placeholder="The kind of projects you hope to find"/></label></div>}
      {step===6&&<div className="form-grid"><label>Profile and portfolio visibility<select name="visibility"><option value="public">Public</option><option value="connections">Connections only</option><option value="private">Private</option></select></label><p className="field-hint">You can update privacy and messaging preferences any time in Settings.</p></div>}
      {error&&<p className="form-error" role="alert">{error}</p>}
      <div className="wizard-actions"><button className="button button-outline" type="button" onClick={back} disabled={step===0||busy}><ArrowLeft size={15}/> Back</button><div className="wizard-next"><button className="text-action" type="button" disabled={busy} onClick={async()=>{const supabase=createClient();const {data:{user}}=await supabase?.auth.getUser()??{data:{user:null}};if(user&&step<6){await supabase?.from("profiles").update({onboarding_step:step+1}).eq("user_id",user.id);setStep(step+1)}else if(step===6)router.push(`/u/${username}`)}}>Skip for now</button><button className="button button-dark" type="submit" disabled={busy}>{busy?"Saving…":step===6?"Finish profile":"Save & continue"}{step===6?<Check size={16}/>:<ArrowRight size={16}/>}</button></div></div>
    </form>
  </section>;
}
