"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function OwnerControls({table,id,editHref,returnHref}:{table:"work_posts"|"jobs"|"collaborations"|"blogs"|"projects"|"organizations";id:string;editHref:string;returnHref:string}){
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  async function remove(){
    if(!window.confirm("Delete this item? This cannot be undone."))return;
    const supabase=createClient();if(!supabase)return;
    const {data:{user}}=await supabase.auth.getUser();if(!user){router.push("/login");return;}
    setBusy(true);
    const {error:result}=await supabase.from(table).delete().eq("id",id).eq("owner_id",user.id);
    if(result)setError(result.message);else{router.push(returnHref);router.refresh();}
    setBusy(false);
  }
  return <div className="owner-controls"><Link href={editHref} className="icon-button" aria-label="Edit"><Pencil size={16}/></Link><button className="icon-button delete-button" type="button" aria-label="Delete" title="Delete" disabled={busy} onClick={remove}><Trash2 size={16}/></button>{error&&<span className="form-error" role="alert">{error}</span>}</div>;
}
