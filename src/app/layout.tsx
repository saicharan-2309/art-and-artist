import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "ART & ARTIST — Where Creative People Meet", template: "%s — ART & ARTIST" },
  description: "Build your professional identity, share your work, and meet the people shaping the creative industry.",
  openGraph: { title: "ART & ARTIST", description: "Create · Connect · Discover", type: "website" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { count } = supabase && data.user ? await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("owner_id", data.user.id).is("read_at", null) : { count: 0 };
  return (
    <html lang="en">
      <body>
        <SiteHeader signedIn={Boolean(data.user)} notificationCount={count ?? 0} />
        {children}
        <footer className="site-footer">
          <Link className="footer-brand" href="/">ART <i>&</i> ARTIST</Link>
          <span>CREATE · CONNECT · DISCOVER</span>
          <span>© {new Date().getFullYear()} ART & ARTIST</span>
        </footer>
      </body>
    </html>
  );
}
