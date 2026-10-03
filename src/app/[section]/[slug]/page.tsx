import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import { ListingActions } from "@/components/listing-actions";
import { ProfileEditForm, SettingsForm, SettingsNav } from "@/components/settings-forms";
import { MessageThread } from "@/components/message-thread";
import { OwnerControls } from "@/components/owner-controls";

const tables: Record<string,string> = { jobs:"jobs", collaborate:"collaborations", projects:"projects", journal:"blogs", organizations:"organizations" };
export async function generateMetadata({params}:{params:Promise<{section:string;slug:string}>}):Promise<Metadata>{
  const {section}=await params;return {title:section==="messages"?"Conversation":section==="profile"?"Edit profile":section==="settings"?"Privacy settings":section[0]?.toUpperCase()+section.slice(1)};
}
export default async function DetailRoute({params}:{params:Promise<{section:string;slug:string}>}) {
  const {section,slug}=await params;
  const supabase=await createClient();
  if(!supabase)return <main className="collection-wrap"><div className="empty-state"><h1>Connect your Supabase project</h1><p>Add the local environment variables to load private account pages and published records.</p></div></main>;
  const {data:{user}}=await supabase.auth.getUser();

  if(section==="profile"&&slug==="edit"){
    if(!user)redirect("/login?next=/profile/edit");
    const {data}=await supabase.from("profiles").select("user_id,username,full_name,profession,headline,biography,city,country,avatar_path").eq("user_id",user.id).maybeSingle();
    if(!data)return <main className="collection-wrap"><h1>Profile setup</h1><Link href="/onboarding">Continue onboarding</Link></main>;
    return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">YOUR PROFESSIONAL IDENTITY</span><h1>Edit profile</h1></div><p>Keep your craft, story, and location current for the people you work with.</p></header><div className="settings-layout"><SettingsNav selected="profile"/><ProfileEditForm row={data}/></div></main>;
  }
  if(section==="settings"&&slug==="profile"){
    if(!user)redirect("/login?next=/settings");
    const {data}=await supabase.from("user_settings").select("*").eq("owner_id",user.id).maybeSingle();
    return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Privacy settings</h1></div><p>Choose how your identity, work, and availability appear.</p></header><SettingsForm row={data??{}}/></main>;
  }
  if(section==="messages"){
    if(!user)redirect("/login?next=/messages");
    const {data:member}=await supabase.from("conversation_members").select("conversation_id").eq("conversation_id",slug).eq("owner_id",user.id).maybeSingle();
    if(!member)notFound();
    const [{data:messages},{error:readError}]=await Promise.all([
      supabase.from("messages").select("id,owner_id,body,attachment_path,created_at").eq("conversation_id",slug).order("created_at").limit(100),
      supabase.from("conversation_members").update({last_read_at:new Date().toISOString()}).eq("conversation_id",slug).eq("owner_id",user.id),
    ]);
    const messageRows=await Promise.all((messages??[]).map(async(message)=>({
      ...message,
      attachment_url:message.attachment_path?(await supabase.storage.from("message-attachments").createSignedUrl(message.attachment_path,3600)).data?.signedUrl:null,
    })));
    const {data:members}=await supabase.from("conversation_members").select("owner_id").eq("conversation_id",slug).neq("owner_id",user.id);
    const {data:other}=members?.[0]?await supabase.from("profiles").select("username,full_name,profession").eq("user_id",members[0].owner_id).maybeSingle():{data:null};
    return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">PRIVATE CONVERSATION</span><h1>{other?.full_name||other?.username||"Messages"}</h1></div><p>{other?.profession||"A creative conversation"}{readError&&" · Read state could not be updated"}</p></header><div className="message-layout"><aside className="message-list"><h2>Conversation</h2><div className="list-row"><div><h3>{other?.full_name||"Creative contact"}</h3><p>{other?.profession||"ART & ARTIST member"}</p></div></div></aside><MessageThread conversationId={slug} initialMessages={messageRows} userId={user.id}/></div></main>;
  }

  const table=tables[section];
  if(!table)notFound();
  let q=supabase.from(table).select("*");
  if(section==="organizations")q=q.eq("slug",slug);
  else if(section==="journal")q=q.eq("slug",slug);
  else q=q.eq("id",slug);
  const {data:row,error}=await q.maybeSingle();
  if(error||!row)notFound();
  const profileId=section==="organizations"?row.owner_id:row.owner_id;
  const {data:author}=await supabase.from("profiles").select("username,full_name,profession,avatar_path").eq("user_id",profileId).maybeSingle();
  const mediaBucket=section==="journal"?"blog-images":section==="projects"?"projects":null;
  const image=mediaBucket?await mediaUrl(supabase,mediaBucket,row.cover_path):null;
  const description=Array.isArray(row.body)?row.body.map((part:{text?:string})=>part.text||"").join("\n\n"):String(row.description||row.body||"");
  return <main className="collection-wrap">
    <div className="detail-back"><Link className="section-link" href={`/${section}`}>← Back to {section}</Link></div>
    {image&&<Image className="detail-cover" src={image} alt="" width={1200} height={640} unoptimized priority/>}
    <div className="detail-page-layout">
      <article className="detail-article">
        <div className="eyebrow">{String(row.project_type||row.category||row.employment_type||section)}</div>
        <h1>{String(row.title||row.name)}</h1>
        {row.subtitle&&<p className="detail-subtitle">{String(row.subtitle)}</p>}
        {user?.id===row.owner_id&&<OwnerControls table={table as "jobs"|"collaborations"|"blogs"|"projects"|"organizations"} id={String(row.id)} editHref={`/${section}/${section==="organizations"?row.slug:section==="journal"?row.slug:row.id}/edit`} returnHref={`/${section}/${section==="organizations"?row.slug:section==="journal"?row.slug:row.id}`}/>}
        <p className="detail-author">By <Link href={author?.username?`/u/${author.username}`:"#"}>{author?.full_name||author?.username||"Creative member"}</Link>{author?.profession?` · ${author.profession}`:""}</p>
        <div className="detail-meta">{[row.location,row.work_mode,row.compensation,row.deadline&&`Deadline ${row.deadline}`].filter(Boolean).map((value)=><span key={String(value)}>{String(value)}</span>)}</div>
        <div className="detail-copy">{description.split(/\n{2,}/).map((paragraph:string,index:number)=><p key={index}>{paragraph}</p>)}</div>
        {Array.isArray(row.roles_needed)&&<div className="card-tags">{row.roles_needed.map((role:string)=><span key={role}>{role}</span>)}</div>}
        {Array.isArray(row.skills)&&<div className="card-tags">{row.skills.map((skill:string)=><span key={skill}>{skill}</span>)}</div>}
      </article>
      {section==="jobs"||section==="collaborate"||section==="journal"?<aside className="detail-sidebar"><h2>{section==="jobs"?"Apply for this role":section==="collaborate"?"Join this project":"Stay connected"}</h2><p>{section==="jobs"?"Submit your interest through your ART & ARTIST profile.":section==="collaborate"?"Introduce your practice to the project creator.":"Discover the people and work behind this story."}</p><ListingActions kind={section==="jobs"?"job":section==="collaborate"?"collaboration":"blog"} id={String(row.id)} ownerId={String(row.owner_id)}/></aside>:null}
    </div>
  </main>;
}
