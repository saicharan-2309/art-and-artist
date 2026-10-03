import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditEntryForm } from "@/components/edit-entry-form";
export const metadata:Metadata={title:"Edit listing"};
const tables={jobs:"jobs",collaborate:"collaborations",journal:"blogs",projects:"projects",organizations:"organizations"} as const;
export default async function EditRoute({params}:{params:Promise<{section:string;slug:string}>}){
  const {section,slug}=await params;
  if(!(section in tables))notFound();
  const kind=section as keyof typeof tables;
  const supabase=await createClient();if(!supabase)redirect("/login");
  const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  let query=supabase.from(tables[kind]).select("*");
  query=kind==="organizations"?query.eq("slug",slug):query.eq("id",slug);
  const {data:row}=await query.maybeSingle();if(!row||row.owner_id!==user.id)notFound();
  return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">YOUR CREATIVE RECORD</span><h1>Edit {kind}</h1></div><p>Changes are saved to the original record and reflected in its public detail page.</p></header><Link className="section-link" href={kind==="organizations"?`/organizations/${row.slug}`:`/${kind==="collaborate"?"collaborate":kind}/${kind==="journal"?row.slug:row.id}`}>Return to details</Link><EditEntryForm kind={kind} id={String(row.id)} row={row}/></main>;
}
