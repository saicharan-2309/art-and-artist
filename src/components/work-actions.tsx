"use client";

import { useState } from "react";
import { Bookmark, Heart, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function WorkActions({ workId, initialLikes = 0, liked = false, saved = false, creatorId }: {
  workId: string; initialLikes?: number; liked?: boolean; saved?: boolean; creatorId?: string;
}) {
  const [isLiked, setLiked] = useState(liked);
  const [isSaved, setSaved] = useState(saved);
  const [likes, setLikes] = useState(initialLikes);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle(table: "work_likes" | "work_saves", change: (v: boolean) => void) {
    const supabase = createClient();
    if (!supabase) { router.push("/login"); return; }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); setBusy(false); return; }
    const query = supabase.from(table).select("owner_id").eq("work_id", workId).eq("owner_id", user.id).maybeSingle();
    const { data } = await query;
    if (data) {
      const { error } = await supabase.from(table).delete().eq("work_id", workId).eq("owner_id", user.id);
      if (!error) { change(false); if (table === "work_likes") setLikes(Math.max(0, likes - 1)); }
      else setMessage(error.message);
    } else {
      const { error } = await supabase.from(table).insert({ work_id: workId, owner_id: user.id });
      if (!error) { change(true); if (table === "work_likes") setLikes(likes + 1); }
      else setMessage(error.message);
    }
    setBusy(false);
  }

  async function connect() {
    if (!creatorId) return;
    const supabase = createClient();
    if (!supabase) { router.push("/login"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("request_connection", { target: creatorId });
    setMessage(error ? error.message : "Connection request sent");
    setBusy(false);
  }

  return (
    <div className="work-actions" aria-label="Work actions">
      <button className={isLiked ? "action-button is-active" : "action-button"} type="button" onClick={() => toggle("work_likes", setLiked)} disabled={busy} aria-label={isLiked ? "Unlike work" : "Like work"} aria-pressed={isLiked}>
        <Heart size={17} fill={isLiked ? "currentColor" : "none"} /><span>{likes}</span>
      </button>
      <button className={isSaved ? "action-button is-active" : "action-button"} type="button" onClick={() => toggle("work_saves", setSaved)} disabled={busy} aria-label={isSaved ? "Remove saved work" : "Save work"} aria-pressed={isSaved}>
        <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
      </button>
      {creatorId && <button className="action-button connect-action" type="button" onClick={connect} disabled={busy} aria-label="Connect with creator"><UserRoundPlus size={16} /> <span>Connect</span></button>}
      <span className="sr-only" aria-live="polite">{message}</span>
    </div>
  );
}
