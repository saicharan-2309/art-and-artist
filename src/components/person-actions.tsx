"use client";

import { useState } from "react";
import { MessageCircle, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PersonActions({ target }: { target: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function act(kind: "connect" | "message") {
    const supabase = createClient();
    if (!supabase) { router.push("/login"); return; }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); setBusy(false); return; }
    if (kind === "connect") {
      const { error } = await supabase.rpc("request_connection", { target });
      setMessage(error ? error.message : "Request sent");
      setBusy(false);
    } else {
      const { data, error } = await supabase.rpc("start_conversation", { target });
      if (error) { setMessage(error.message); setBusy(false); }
      else router.push(`/messages/${data}`);
    }
  }
  return <span className="person-action-wrap">
    <button className="text-action" type="button" disabled={busy} onClick={() => act("connect")} aria-label="Send connection request"><UserRoundPlus size={14} /> Connect</button>
    <button className="text-action" type="button" disabled={busy} onClick={() => act("message")} aria-label="Message this person"><MessageCircle size={14} /> Message</button>
    {message && <span className="sr-only" role="status">{message}</span>}
  </span>;
}
