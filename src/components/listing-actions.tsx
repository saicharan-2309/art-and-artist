"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, BriefcaseBusiness, Handshake, MessageCircle, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ListingActions({ kind, id, ownerId }: { kind: "job" | "collaboration" | "blog"; id: string; ownerId: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved,setSaved]=useState(false);
  const [liked,setLiked]=useState(false);
  const router=useRouter();

  useEffect(()=>{
    if(kind!=="blog")return;
    const supabase=createClient();if(!supabase)return;
    let active=true;
    void (async()=>{
      const {data:{user}}=await supabase.auth.getUser();if(!user||!active)return;
      const [savedRow,likedRow]=await Promise.all([
        supabase.from("blog_saves").select("blog_id").eq("blog_id",id).eq("owner_id",user.id).maybeSingle(),
        supabase.from("blog_likes").select("blog_id").eq("blog_id",id).eq("owner_id",user.id).maybeSingle(),
      ]);
      if(active){setSaved(Boolean(savedRow.data));setLiked(Boolean(likedRow.data));}
    })();
    return()=>{active=false;};
  },[id,kind]);

  async function act(action: "apply" | "interest" | "message") {
    const supabase = createClient();
    if (!supabase) { router.push("/login"); return; }
    setBusy(true); setStatus("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); setBusy(false); return; }
    if (action === "message") {
      const { data, error } = await supabase.rpc("start_conversation", { target: ownerId });
      if (error) setStatus(error.message); else router.push(`/messages/${data}`);
    } else if (action === "apply") {
      const { error } = await supabase.from("job_applications").insert({ job_id: id, owner_id: user.id, status: "applied" });
      setStatus(error ? error.code === "23505" ? "You have already applied." : error.message : "Application submitted.");
    } else {
      const { error } = await supabase.from("collaboration_interests").insert({ collaboration_id: id, owner_id: user.id });
      setStatus(error ? error.code === "23505" ? "You have already expressed interest." : error.message : "Interest sent.");
    }
    setBusy(false);
  }

  async function toggleBlog(table:"blog_saves"|"blog_likes",present:boolean,update:(next:boolean)=>void){
    const supabase=createClient();if(!supabase){router.push("/login");return;}
    setBusy(true);setStatus("");
    const {data:{user}}=await supabase.auth.getUser();if(!user){router.push("/login");setBusy(false);return;}
    if(present){
      const {error}=await supabase.from(table).delete().eq("blog_id",id).eq("owner_id",user.id);
      if(error)setStatus(error.message);else update(false);
    }else{
      const {error}=await supabase.from(table).insert({blog_id:id,owner_id:user.id});
      if(error)setStatus(error.code==="23505"?"Already saved.":error.message);else update(true);
    }
    setBusy(false);
  }

  return (
    <div className="action-stack">
      {kind==="blog"?<>
        <button type="button" className={liked?"button button-accent":"button button-outline"} disabled={busy} onClick={()=>toggleBlog("blog_likes",liked,setLiked)}><Heart size={16} fill={liked?"currentColor":"none"}/>{liked?"Liked":"Like article"}</button>
        <button type="button" className="button button-outline" disabled={busy} onClick={()=>toggleBlog("blog_saves",saved,setSaved)}><BookmarkPlus size={16}/>{saved?"Remove saved article":"Save article"}</button>
        <button type="button" className="button button-outline" disabled={busy} onClick={()=>act("message")}><MessageCircle size={16}/> Message author</button>
      </>:<button type="button" className="button button-dark" disabled={busy} onClick={()=>act(kind==="job"?"apply":"interest")}>
        {kind==="job"?<><BriefcaseBusiness size={16}/> Apply</>:<><Handshake size={16}/> Express interest</>}
      </button>}
      {status && <p className="status-line" role="status">{status}</p>}
    </div>
  );
}
