"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotificationActions({ id }: { id: string }) {
  const [read, setRead] = useState(false);
  const [error, setError] = useState("");
  async function markRead() {
    const supabase = createClient();
    if (!supabase) return;
    const { error: updateError } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (updateError) setError(updateError.message); else setRead(true);
  }
  return <button className="filter-tab" type="button" onClick={markRead} disabled={read}>{error || (read ? "Read" : "Mark read")}</button>;
}
