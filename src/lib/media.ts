import type { SupabaseClient } from "@supabase/supabase-js";

export async function mediaUrl(supabase: SupabaseClient, bucket: string, path: unknown) {
  if (typeof path !== "string" || !path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
