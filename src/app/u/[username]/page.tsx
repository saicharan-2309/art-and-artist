import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import { PersonActions } from "@/components/person-actions";

export async function generateMetadata({params}:{params:Promise<{username:string}>}):Promise<Metadata>{const {username}=await params;return {title:`@${username}`};}
export default async function PublicProfile({params}:{params:Promise<{username:string}>}){
  const {username}=await params;const supabase=await createClient();
  if(!supabase)return <main className="collection-wrap"><div className="empty-state"><h1>Connect Supabase to view profiles</h1></div></main>;
  const [{data:profile},{data:{user}}]=await Promise.all([
    supabase.from("profiles").select("*").eq("username",username).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if(!profile)notFound();
  const [{data:portfolio},{data:experiences},{data:credits},{data:skillLinks},{data:projects},avatar,cover]=await Promise.all([
    supabase.from("portfolio_items").select("*").eq("owner_id",profile.user_id).eq("visibility","public").order("sort_order"),
    supabase.from("experiences").select("*").eq("owner_id",profile.user_id).order("started_on",{ascending:false}),
    supabase.from("credits").select("*").eq("owner_id",profile.user_id).order("year",{ascending:false}),
    supabase.from("profile_skills").select("skill_id,proficiency").eq("owner_id",profile.user_id),
    supabase.from("projects").select("id,title,project_type,description,year").eq("owner_id",profile.user_id).eq("visibility","public").order("created_at",{ascending:false}),
    mediaUrl(supabase,"avatars",profile.avatar_path),
    mediaUrl(supabase,"covers",profile.cover_path),
  ]);
  const skillIds=(skillLinks??[]).map((s)=>s.skill_id);
  const {data:skills}=skillIds.length?await supabase.from("skills").select("id,name,category").in("id",skillIds):{data:[]};
  const isSelf=user?.id===profile.user_id;
  const person=profile.full_name||profile.username;
  return <main>
    <section className="profile-hero">
      {cover?<Image className="profile-cover" src={cover} alt="" fill unoptimized sizes="100vw"/>:<div className="profile-cover profile-cover-fallback"/>}
      <div className="profile-cover-tint"/>
      <div className="profile-hero-inner">
        <div className="profile-avatar">{avatar?<Image src={avatar} alt={person} width={124} height={124} unoptimized/>:person.slice(0,1)}</div>
        <div className="profile-title"><span className="eyebrow">{profile.verified_at?"VERIFIED CREATIVE":"CREATIVE PROFILE"}</span><h1>{person}</h1><p>{profile.profession||"Creative professional"}{profile.headline?` · ${profile.headline}`:""}</p><p>{[profile.city,profile.country].filter(Boolean).join(", ")}</p></div>
        <div className="profile-actions">{isSelf?<Link className="button button-outline" href="/profile/edit">Edit profile</Link>:<PersonActions target={profile.user_id}/>}</div>
      </div>
    </section>
    <div className="profile-layout">
      <div className="profile-main">
        <section className="profile-section"><h2>About</h2><p>{profile.biography||"This creative is building their professional story."}</p></section>
        <section className="profile-section"><h2>Selected work <span className="section-number">{portfolio?.length??0}</span></h2>
          {portfolio?.length?<div className="profile-work-grid">{await Promise.all(portfolio.map(async(item)=>{
            const src=await mediaUrl(supabase,"portfolio",item.thumbnail_path||item.media_path);
            return <article className="work-card" key={item.id}><div className="work-card-media">{src?<Image src={src} alt={item.title} fill unoptimized sizes="(max-width:720px) 100vw, 55vw"/>:<span className="work-card-placeholder">{item.title}</span>}</div><div className="work-card-info"><h3>{item.title}</h3><div className="work-card-meta">{item.category}{item.year?` · ${item.year}`:""}</div><p className="card-description">{item.description}</p></div></article>;
          }))}</div>:<p>Portfolio pieces will appear here as they are added.</p>}
        </section>
        <section className="profile-section"><h2>Experience</h2>{experiences?.length?experiences.map((item)=><div className="profile-entry" key={item.id}><h3>{item.role}</h3><p>{item.organization}{item.location?` · ${item.location}`:""}</p><span>{item.started_on||"—"}{item.is_current?" · Present":item.ended_on?` · ${item.ended_on}`:""}</span>{item.description&&<p>{item.description}</p>}</div>):<p>Professional experience will be added here.</p>}</section>
        <section className="profile-section"><h2>Selected credits</h2>{credits?.length?credits.map((item)=><div className="profile-entry" key={item.id}><h3>{item.project_title}</h3><p>{item.role}{item.production?` · ${item.production}`:""}{item.year?` · ${item.year}`:""}</p><span className="credit-state">{item.verification_status==="verified"?"Verified credit":item.verification_status==="rejected"?"Verification declined":"Credit pending verification"}</span></div>):<p>Verified credits and production history will appear here.</p>}</section>
        {projects?.length?<section className="profile-section"><h2>Projects</h2>{projects.map((project)=><div className="profile-entry" key={project.id}><h3><Link href={`/projects/${project.id}`}>{project.title}</Link></h3><p>{project.project_type}{project.year?` · ${project.year}`:""}</p><p>{project.description}</p></div>)}</section>:null}
      </div>
      <aside className="profile-aside">
        <section className="profile-section"><h2>Practice</h2><p>{profile.profession||"Creative professional"}</p>{profile.languages?.length>0&&<p className="profile-language">{profile.languages.join(" · ")}</p>}</section>
        <section className="profile-section"><h2>Skills</h2>{skills?.length?<div className="skill-list">{skills.map((skill)=><span key={skill.id}>{skill.name}</span>)}</div>:<p>Skills have not been added yet.</p>}</section>
        <section className="profile-section"><h2>Availability</h2><p>For collaboration enquiries, start a conversation or send a connection request.</p></section>
      </aside>
    </div>
  </main>;
}
