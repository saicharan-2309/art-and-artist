import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import { WorkActions } from "@/components/work-actions";
import { OwnerControls } from "@/components/owner-controls";
import type { Metadata } from "next";

export async function generateMetadata():Promise<Metadata>{return {title:"Creative work"};}
export default async function WorkDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const supabase=await createClient();
  if(!supabase)return <main className="collection-wrap"><h1>Connect Supabase to open this work.</h1></main>;
  const {data:work}=await supabase.from("work_posts").select("*").eq("id",id).maybeSingle();
  if(!work)notFound();
  const [{data:creator},url,likes,user]=await Promise.all([
    supabase.from("profiles").select("user_id,username,full_name,profession,headline,city,country").eq("user_id",work.owner_id).maybeSingle(),
    mediaUrl(supabase,"portfolio",work.thumbnail_path||work.media_path),
    supabase.from("work_likes").select("owner_id",{count:"exact",head:true}).eq("work_id",id),
    supabase.auth.getUser(),
  ]);
  let liked=false,saved=false;
  if(user.data.user){const [l,s]=await Promise.all([supabase.from("work_likes").select("owner_id").eq("work_id",id).eq("owner_id",user.data.user.id).maybeSingle(),supabase.from("work_saves").select("owner_id").eq("work_id",id).eq("owner_id",user.data.user.id).maybeSingle()]);liked=Boolean(l.data);saved=Boolean(s.data);}
  return <main className="work-detail">
    <div>{url?<Image className="work-detail-media" src={url} alt={work.title} width={1200} height={900} unoptimized priority/>:<div className="work-detail-media work-card-placeholder">ART & ARTIST</div>}</div>
    <article className="work-detail-content"><span className="eyebrow">{work.medium||work.project_type||"Creative work"}</span><h1>{work.title}</h1>
      {creator&&<div className="work-detail-byline">By <Link href={`/u/${creator.username}`}>{creator.full_name||creator.username}</Link>{creator.profession?` · ${creator.profession}`:""}</div>}
      <div className="detail-meta">{[work.year,work.location,work.project_type].filter(Boolean).map((value)=><span key={String(value)}><strong>{String(value)}</strong></span>)}</div>
      <p>{work.body||"The creator has not added a description."}</p>
      {user.data.user?.id===work.owner_id&&<OwnerControls table="work_posts" id={id} editHref={`/work/${id}/edit`} returnHref={`/work/${id}`}/>}
      <WorkActions workId={id} initialLikes={likes.count??0} liked={liked} saved={saved} creatorId={creator?.user_id}/>
      {creator&&<Link className="card-cta" href={`/u/${creator.username}`}>Visit creator profile <LinkIcon/></Link>}
      {work.project_id&&<p><Link className="section-link" href={`/projects/${work.project_id}`}>View project details</Link></p>}
      {Array.isArray(work.tags)&&<div className="card-tags">{work.tags.map((tag:string)=><span key={tag}>{tag}</span>)}</div>}
    </article>
  </main>;
}
function LinkIcon(){return <span aria-hidden="true">↗</span>}
