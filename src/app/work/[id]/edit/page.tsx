import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditEntryForm } from "@/components/edit-entry-form";
export default async function EditWork({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const supabase=await createClient();if(!supabase)redirect("/login");
  const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
  const {data:row}=await supabase.from("work_posts").select("*").eq("id",id).maybeSingle();
  if(!row||row.owner_id!==user.id)notFound();
  return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">YOUR CREATIVE RECORD</span><h1>Edit work</h1></div><p>Update the title and context for this piece.</p></header><EditEntryForm kind="work" id={id} row={row}/></main>;
}
