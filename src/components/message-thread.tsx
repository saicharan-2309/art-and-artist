"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = { id:string; owner_id:string; body:string; created_at:string; attachment_path?:string|null; attachment_url?:string|null };
export function MessageThread({ conversationId, initialMessages, userId }: { conversationId:string; initialMessages:Message[]; userId:string }) {
  const [messages,setMessages]=useState(initialMessages);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const bottom=useRef<HTMLDivElement>(null);
  const router=useRouter();
  useEffect(()=>{
    const supabase=createClient(); if(!supabase)return;
    const channel=supabase.channel(`thread-${conversationId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`conversation_id=eq.${conversationId}`},async(event)=>{
      const item=event.new as Message;
      if(item.attachment_path){const {data}=await supabase.storage.from("message-attachments").createSignedUrl(item.attachment_path,3600);item.attachment_url=data?.signedUrl;}
      setMessages((previous)=>previous.some((message)=>message.id===item.id)?previous:[...previous,item]);
    }).subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[conversationId]);
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");
    const formElement=event.currentTarget;
    const form=new FormData(formElement);const body=String(form.get("message")||"").trim();const file=form.get("attachment");
    if(!body&&(!(file instanceof File)||!file.size))return;
    const supabase=createClient();if(!supabase){router.push("/login");return;}
    setBusy(true);
    let attachmentPath:string|undefined;
    if(file instanceof File&&file.size){
      if(file.size>20*1024*1024||!["image/jpeg","image/png","image/webp","application/pdf","video/mp4"].includes(file.type)){
        setError("Choose an image, PDF, or MP4 up to 20 MB.");setBusy(false);return;
      }
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");setBusy(false);return;}
      const extension=file.name.split(".").pop()?.toLowerCase()||"bin";
      attachmentPath=`${user.id}/${crypto.randomUUID()}.${extension}`;
      const {error:uploadError}=await supabase.storage.from("message-attachments").upload(attachmentPath,file,{contentType:file.type});
      if(uploadError){setError(uploadError.message);setBusy(false);return;}
    }
    const {error:sendError}=await supabase.from("messages").insert({conversation_id:conversationId,owner_id:userId,body,attachment_path:attachmentPath});
    if(sendError)setError(sendError.message);else formElement.reset();
    setBusy(false);
  }
  return <div className="message-thread">
    <div className="thread-messages" aria-live="polite">{messages.map((message)=><div className={message.owner_id===userId?"message-line mine":"message-line"} key={message.id}><p>{message.body}</p>{message.attachment_url&&<a className="message-attachment" href={message.attachment_url} target="_blank" rel="noreferrer">Open attachment</a>}<time>{new Date(message.created_at).toLocaleString()}</time></div>)}<div ref={bottom}/></div>
    <form className="message-form" onSubmit={submit}><label className="attach-button" title="Attach an image, PDF, or video"><Paperclip size={17}/><input name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4" aria-label="Attach a file"/></label><label className="sr-only" htmlFor="message-input">Write a message</label><input id="message-input" name="message" maxLength={10000} placeholder="Write a message…" /><button className="button button-dark" type="submit" disabled={busy} aria-label="Send message">{busy?"Sending…":<ArrowUpRight size={16}/>}</button></form>
    {error&&<p className="form-error" role="alert">{error}</p>}
  </div>;
}
