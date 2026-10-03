"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NotificationStream({ownerId}:{ownerId:string}){
  const router=useRouter();
  useEffect(()=>{
    const supabase=createClient();if(!supabase)return;
    const channel=supabase.channel(`notifications-${ownerId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`owner_id=eq.${ownerId}`},()=>router.refresh()).subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[ownerId,router]);
  return null;
}
