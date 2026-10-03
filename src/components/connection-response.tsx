"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ConnectionResponse({id}:{id:string}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const router=useRouter();
  async function respond(decision:"accepted"|"declined"){
    const supabase=createClient();if(!supabase)return;setBusy(true);setError("");
    const {error:result}=await supabase.rpc("respond_connection",{request_id:id,decision});
    if(result)setError(result.message);else router.refresh();setBusy(false);
  }
  return <div className="connection-response"><button className="icon-button accept-button" type="button" disabled={busy} onClick={()=>respond("accepted")} aria-label="Accept request"><Check size={17}/></button><button className="icon-button decline-button" type="button" disabled={busy} onClick={()=>respond("declined")} aria-label="Decline request"><X size={17}/></button>{error&&<span role="alert">{error}</span>}</div>;
}
