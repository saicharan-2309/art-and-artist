import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConnectionResponse } from "@/components/connection-response";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Connections"};
export default async function ConnectionsPage(){
  const supabase=await createClient();if(!supabase)redirect("/login");
  const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const {data:rows}=await supabase.from("connections").select("id,owner_id,addressee_id,status,created_at").or(`owner_id.eq.${user.id},addressee_id.eq.${user.id}`).order("created_at",{ascending:false});
  const ids=[...new Set((rows??[]).map((r)=>r.owner_id===user.id?r.addressee_id:r.owner_id))];
  const {data:people}=ids.length?await supabase.from("profiles").select("user_id,username,full_name,profession,city,country").in("user_id",ids):{data:[]};
  const byId=new Map((people??[]).map((p)=>[p.user_id,p]));
  return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">YOUR CREATIVE NETWORK</span><h1>Connections</h1></div><p>Professional relationships that open up new ways to make work.</p></header>
  {rows?.length?<div>{rows.map((row)=>{const incoming=row.addressee_id===user.id;const person=byId.get(incoming?row.owner_id:row.addressee_id);return <div className="list-row" key={row.id}><div><h3><Link href={`/u/${person?.username}`}>{person?.full_name||person?.username||"Creative member"}</Link></h3><p>{person?.profession||"Creative professional"} · {row.status}{person?.city?` · ${person.city}`:""}</p></div>{incoming&&row.status==="pending"?<ConnectionResponse id={row.id}/>:<span className="card-meta">{row.status}</span>}</div>})}</div>:<div className="empty-state"><h2>Your network starts here.</h2><p>Connect with the people whose work you want to follow and whose practice you want to know.</p><Link className="button button-outline" href="/connect">Find creatives</Link></div>}
  </main>;
}
