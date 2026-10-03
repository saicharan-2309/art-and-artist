"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Search, UserRound, LogOut, Menu, X, Network, Bell } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  ["Discover", "/discover"],
  ["Connect", "/connect"],
  ["Opportunities", "/jobs"],
  ["Journal", "/journal"],
] as const;

export function SiteHeader({ signedIn = false, notificationCount = 0 }: { signedIn?: boolean; notificationCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function signOut() {
    const supabase = createClient(); if (!supabase) return;
    setBusy(true); await supabase.auth.signOut(); setBusy(false);
    router.push("/"); router.refresh();
  }
  return <>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="ART & ARTIST home"><span className="brand-mark">A<span>&</span>A</span><span className="brand-name">ART <i>&</i> ARTIST</span></Link>
      <form className="header-search" action="/search" role="search"><Search size={16} aria-hidden="true"/><input name="q" placeholder="Find people, work, ideas" aria-label="Search ART & ARTIST"/><kbd>/</kbd></form>
      <nav className={open?"primary-nav is-open":"primary-nav"} aria-label="Main navigation">
        {links.map(([label,href])=><Link key={href} href={href} aria-current={pathname===href?"page":undefined} onClick={()=>setOpen(false)}>{label}</Link>)}
        {signedIn?<><Link className="header-icon" href="/notifications" aria-label={notificationCount?`Notifications, ${notificationCount} unread`:"Notifications"}><Bell size={17}/>{notificationCount>0&&<span className="notification-count">{notificationCount>99?"99+":notificationCount}</span>}</Link><Link className="profile-link" href="/connections"><Network size={15}/> Network</Link><Link className="profile-link" href="/settings"><UserRound size={16}/> Account</Link><button className="icon-button signout-button" type="button" onClick={signOut} disabled={busy} aria-label="Sign out" title="Sign out"><LogOut size={17}/></button></>:<Link className="nav-signin" href="/login">Sign in <ArrowUpRight size={14}/></Link>}
      </nav>
      <button className="icon-button mobile-menu" type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label={open?"Close menu":"Open menu"}>{open?<X size={20}/>:<Menu size={20}/>}</button>
    </header>
    <nav className="mobile-tabs" aria-label="Mobile navigation">{links.slice(0,3).map(([label,href])=><Link key={href} href={href} aria-current={pathname===href?"page":undefined}>{label}</Link>)}<Link href={signedIn?"/messages":"/login"}>Messages</Link></nav>
  </>;
}
