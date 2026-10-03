import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import { WorkActions } from "@/components/work-actions";
import { ListingActions } from "@/components/listing-actions";
import { NotificationActions } from "@/components/notification-actions";
import { NotificationStream } from "@/components/notification-stream";

type Row = Record<string, unknown>;
const content: Record<string, { title: string; description: string; table: string; create?: string }> = {
  discover: { title: "Discover", description: "A living collection of creative work, from the people who made it.", table: "work_posts", create: "work" },
  connect: { title: "Connect", description: "Find the people behind the work by craft, place, skill, and shared direction.", table: "profiles" },
  jobs: { title: "Opportunities", description: "Professional roles and paid opportunities, published by the people hiring.", table: "jobs", create: "jobs" },
  collaborate: { title: "Collaborate", description: "Independent projects looking for the right creative collaborators.", table: "collaborations", create: "collaborate" },
  journal: { title: "Journal", description: "Notes, conversations, and points of view from across the creative community.", table: "blogs", create: "journal" },
  projects: { title: "Projects", description: "The projects, productions, and creative partnerships taking shape.", table: "projects", create: "projects" },
  organizations: { title: "Organizations", description: "Production houses, studios, collectives, and independent organizations.", table: "organizations", create: "organizations" },
  messages: { title: "Messages", description: "Private conversations with people in your creative network.", table: "conversations" },
  notifications: { title: "Notifications", description: "Your requests, updates, and activity across ART & ARTIST.", table: "notifications" },
  about: { title: "Our point of view", description: "A professional home for independent creative practice.", table: "about" },
};

async function loadRows(section: string, query: string) {
  const supabase = await createClient();
  if (!supabase) return { configured: false, userId: null, rows: [] as Row[], media: new Map<string, string>(), auxiliary: new Map<string, Row>(), reactionCounts: new Map<string,number>(), likedWorks: new Set<string>(), savedWorks: new Set<string>() };
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  let result: { data: unknown; error: { message: string } | null } = { data: [], error: null };
  const escaped = query.replaceAll(",", " ").trim();
  if (section === "discover") {
    let q = supabase.from("work_posts").select("id,owner_id,title,body,medium,project_type,location,year,tags,media_path,thumbnail_path,created_at").eq("status", "published").eq("visibility", "public").order("created_at", { ascending: false }).limit(30);
    if (escaped) q = q.or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%,medium.ilike.%${escaped}%`);
    result = await q;
  } else if (section === "connect") {
    let q = supabase.from("profiles").select("user_id,username,full_name,profession,headline,biography,avatar_path,city,country,verified_at").eq("visibility", "public").order("full_name").limit(36);
    if (escaped) q = q.or(`full_name.ilike.%${escaped}%,profession.ilike.%${escaped}%,city.ilike.%${escaped}%,headline.ilike.%${escaped}%`);
    result = await q;
  } else if (section === "jobs") {
    let q = supabase.from("jobs").select("id,owner_id,title,role,description,location,work_mode,employment_type,compensation,deadline,skills,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(30);
    if (escaped) q = q.or(`title.ilike.%${escaped}%,role.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    result = await q;
  } else if (section === "collaborate") {
    let q = supabase.from("collaborations").select("id,owner_id,title,project_type,description,location,work_mode,roles_needed,compensation,timeline,deadline,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(30);
    if (escaped) q = q.or(`title.ilike.%${escaped}%,project_type.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    result = await q;
  } else if (section === "journal") {
    let q = supabase.from("blogs").select("id,owner_id,slug,title,subtitle,category,cover_path,published_at").eq("status", "published").order("published_at", { ascending: false }).limit(30);
    if (escaped) q = q.or(`title.ilike.%${escaped}%,subtitle.ilike.%${escaped}%,category.ilike.%${escaped}%`);
    result = await q;
  } else if (section === "projects") {
    let q = supabase.from("projects").select("id,owner_id,title,project_type,description,cover_path,location,year,status").eq("visibility", "public").order("created_at", { ascending: false }).limit(30);
    if (escaped) q = q.or(`title.ilike.%${escaped}%,project_type.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    result = await q;
  } else if (section === "organizations") {
    let q = supabase.from("organizations").select("id,owner_id,slug,name,about,logo_path,city,country,verified_at").order("name").limit(30);
    if (escaped) q = q.or(`name.ilike.%${escaped}%,about.ilike.%${escaped}%,city.ilike.%${escaped}%`);
    result = await q;
  } else if (section === "notifications" && userId) {
    result = await supabase.from("notifications").select("id,kind,entity_type,entity_id,payload,read_at,created_at,actor_id").eq("owner_id", userId).order("created_at", { ascending: false }).limit(50);
  } else if (section === "messages" && userId) {
    const memberships = await supabase.from("conversation_members").select("conversation_id,last_read_at").eq("owner_id", userId);
    const ids = (memberships.data ?? []).map((item) => item.conversation_id);
    if (ids.length) result = await supabase.from("conversations").select("id,context_type,context_id,updated_at,conversation_members(owner_id)").in("id", ids).order("updated_at", { ascending: false });
  } else if (section === "profile" && userId) {
    result = await supabase.from("profiles").select("user_id,username,full_name,profession,headline,biography,city,country,visibility").eq("user_id", userId).maybeSingle();
  } else if (section === "settings" && userId) {
    result = await supabase.from("user_settings").select("profile_visibility,portfolio_visibility,allow_messages,allow_connections,show_availability,show_contact,email_notifications").eq("owner_id", userId).maybeSingle();
  } else if (section === "admin" && userId) {
    const { data: allowed } = await supabase.rpc("is_admin");
    if (allowed) result = await supabase.from("reports").select("id,target_type,target_id,reason,details,status,created_at").order("created_at", { ascending: false }).limit(50);
  } else if (section === "search" && escaped) {
    result = await supabase.from("profiles").select("user_id,username,full_name,profession,headline,city,country").eq("visibility", "public").or(`full_name.ilike.%${escaped}%,profession.ilike.%${escaped}%,headline.ilike.%${escaped}%`).limit(15);
  }
  const rows = Array.isArray(result.data) ? result.data as Row[] : result.data ? [result.data as Row] : [];
  if (section === "admin" && rows.length === 0 && !result.error) {
    const { data: allowed } = userId ? await supabase.rpc("is_admin") : { data: false };
    if (!allowed) return { configured: true, userId, rows: [], media: new Map<string, string>(), auxiliary: new Map<string, Row>(), reactionCounts: new Map<string,number>(), likedWorks: new Set<string>(), savedWorks: new Set<string>(), denied: true as const };
  }

  const media = new Map<string, string>();
  if (["discover", "connect", "journal", "projects", "organizations"].includes(section)) {
    await Promise.all(rows.map(async (row) => {
      const path = section === "discover" ? row.thumbnail_path ?? row.media_path
        : section === "connect" ? row.avatar_path
        : section === "journal" ? row.cover_path
        : section === "projects" ? row.cover_path
        : row.logo_path;
      const bucket = section === "connect" ? "avatars" : section === "journal" ? "blog-images" : section === "organizations" ? "organization-assets" : section === "projects" ? "projects" : "portfolio";
      const url = await mediaUrl(supabase, bucket, path);
      if (url && typeof row.id === "string") media.set(row.id, url);
      if (url && typeof row.user_id === "string") media.set(row.user_id, url);
    }));
  }

  const auxiliary = new Map<string, Row>();
  if (section === "discover" || section === "connect" || section === "jobs" || section === "collaborate" || section === "journal" || section === "projects") {
    const ids = [...new Set(rows.map((row) => String(section === "connect" ? row.user_id : row.owner_id)).filter(Boolean))];
    if (ids.length) {
      const { data: people } = await supabase.from("profiles").select("user_id,username,full_name,profession,avatar_path").in("user_id", ids);
      for (const person of people ?? []) auxiliary.set(person.user_id, person as Row);
    }
  }
  const reactionCounts = new Map<string,number>();
  const likedWorks = new Set<string>();
  const savedWorks = new Set<string>();
  if(section==="discover"&&rows.length){
    const ids=rows.map((row)=>String(row.id));
    const {data:likes}=await supabase.from("work_likes").select("work_id,owner_id").in("work_id",ids);
    for(const like of likes??[]){const id=String(like.work_id);reactionCounts.set(id,(reactionCounts.get(id)??0)+1);if(like.owner_id===userId)likedWorks.add(id);}
    if(userId){const {data:saves}=await supabase.from("work_saves").select("work_id").eq("owner_id",userId).in("work_id",ids);for(const saved of saves??[])savedWorks.add(String(saved.work_id));}
  }
  return { configured: true, userId, rows, media, auxiliary, reactionCounts, likedWorks, savedWorks };
}

export async function CollectionPage({ section, query = "" }: { section: string; query?: string }) {
  const config = content[section];
  if (!config) return <main className="collection-wrap"><div className="empty-state"><h1>Page not found</h1><Link href="/">Return home</Link></div></main>;
  const result = await loadRows(section, query);
  if (section === "about") return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">CREATE · CONNECT · DISCOVER</span><h1>{config.title}</h1></div><p>{config.description}</p></header><section className="profile-section"><h2>Who it is for</h2><p>ART & ARTIST brings together the people who make film, performance, photography, sound, design, writing, and the many practices around them. It is built for real creative identities, visible work, and the relationships that make new work possible.</p></section><section className="profile-section"><h2>How it works</h2><p>Create a professional profile and portfolio, discover work and collaborators, and connect through persistent profiles, credits, opportunities, and messages. Your media and professional record stay attached to your account.</p></section></main>;

  return (
    <main className="collection-wrap">
      {section === "notifications" && result.userId && <NotificationStream ownerId={result.userId} />}
      <header className="collection-head">
        <div><span className="eyebrow">{section === "discover" ? "WHAT THEY MAKE" : section === "connect" ? "WHO MAKES IT" : "THE CREATIVE NETWORK"}</span><h1>{config.title}</h1></div>
        <p>{config.description}</p>
      </header>
      {["discover", "connect", "jobs", "collaborate", "journal", "projects", "organizations", "search"].includes(section) && (
        <div className="collection-tools">
          <form className="collection-search" action={section === "search" ? "/search" : `/${section}`}>
            <input name={section === "search" ? "q" : "q"} defaultValue={query} placeholder={section === "connect" ? "Search craft, name, or place" : "Search this collection"} aria-label={`Search ${config.title.toLowerCase()}`} />
            <button type="submit" className="button button-outline">Search</button>
          </form>
          {config.create && <Link className="button button-dark" href={`/${config.create}/new`}><Plus size={15} /> {section === "journal" ? "Write" : section === "jobs" ? "Post a role" : section === "collaborate" ? "Start a project" : section === "discover" ? "Share work" : "Add project"}</Link>}
        </div>
      )}

      {!result.configured ? <Empty title="Connect your Supabase project" body="Add the project URL and publishable key to .env.local, then apply the database migrations. The collection will load real records from your project." />
        : section === "messages" && !result.userId ? <Empty title="Sign in to see your conversations" body="Private conversations are available to their participants only." action="/login" actionText="Sign in" />
        : section === "notifications" && !result.userId ? <Empty title="Sign in to see your activity" body="Your requests and updates are private to your account." action="/login" actionText="Sign in" />
        : section === "profile" && !result.userId ? <Empty title="Sign in to edit your profile" body="Your professional identity and portfolio are yours to manage." action="/login" actionText="Sign in" />
        : section === "settings" && !result.userId ? <Empty title="Account settings" body="Sign in to manage your privacy, messaging, and email preferences." action="/login" actionText="Sign in" />
        : section === "admin" && result.denied ? <Empty title="Restricted area" body="This account does not have an administrator role." action="/" actionText="Return home" />
        : renderRows(section, result.rows, result.media, result.auxiliary, result.userId, result.reactionCounts, result.likedWorks, result.savedWorks)}
    </main>
  );
}

function Empty({ title, body, action, actionText }: { title: string; body: string; action?: string; actionText?: string }) {
  return <div className="empty-state"><h2>{title}</h2><p>{body}</p>{action && actionText && <Link className="button button-outline" href={action}>{actionText}<ArrowRight size={15} /></Link>}</div>;
}

function renderRows(section: string, rows: Row[], media: Map<string,string>, people: Map<string,Row>, userId: string | null, reactionCounts:Map<string,number>, likedWorks:Set<string>, savedWorks:Set<string>) {
  if (section === "discover") return rows.length ? <div className="work-grid">{rows.map((row) => {
    const author = people.get(String(row.owner_id));
    const image = media.get(String(row.id));
    return <article className="work-card" key={String(row.id)}>
      <Link className="work-card-media" href={`/work/${row.id}`} aria-label={`Open ${row.title}`}>{image ? <Image src={image} alt={String(row.title)} fill unoptimized sizes="(max-width: 720px) 100vw, 33vw" /> : <span className="work-card-placeholder">ART & ARTIST</span>}</Link>
      <div className="work-card-info"><div className="work-card-top"><div><h2><Link href={`/work/${row.id}`}>{String(row.title)}</Link></h2><div className="work-card-meta">{[row.medium, row.project_type, row.year].filter(Boolean).join(" · ") || "Creative work"}</div></div></div>
      <div className="work-card-context">{String(row.body || "")}</div>
      {author && <div className="work-card-meta">By <Link href={`/u/${author.username}`}>{String(author.full_name || author.username)}</Link>{author.profession ? ` · ${author.profession}` : ""}</div>}
      <WorkActions workId={String(row.id)} creatorId={String(row.owner_id)} initialLikes={reactionCounts.get(String(row.id))??0} liked={likedWorks.has(String(row.id))} saved={savedWorks.has(String(row.id))} />
      </div></article>;
  })}</div> : <Empty title="The next piece starts here." body="No public work has been shared yet. Sign in to publish the first piece from your practice." action="/work/new" actionText="Share work" />;

  if (section === "connect") return rows.length ? <div className="person-grid">{rows.map((row) => <PersonCard key={String(row.user_id)} person={row} image={media.get(String(row.user_id))} self={row.user_id === userId} />)}</div> : <Empty title="Meet the creative community" body="No matching public profiles yet. Widen your search or create your own professional profile." action="/signup" actionText="Create a profile" />;

  if (section === "jobs" || section === "collaborate" || section === "projects" || section === "organizations") return rows.length ? <div className="opportunity-grid">{rows.map((row) => {
    const kind = section === "jobs" ? "job" : section === "collaborate" ? "collaboration" : null;
    const href = section === "organizations" ? `/organizations/${row.slug}` : `/${section}/${row.id}`;
    const author = people.get(String(row.owner_id));
    const tags = Array.isArray(row.skills) ? row.skills : Array.isArray(row.roles_needed) ? row.roles_needed : [];
    return <article className="opportunity-card" key={String(row.id)}>
      <div className="card-topline"><span>{String(row.project_type || row.employment_type || (section === "organizations" ? "Organization" : "Project"))}</span><span>{String(row.location || row.city || "")}</span></div>
      <h2><Link href={href}>{String(row.title || row.name)}</Link></h2>
      {section === "jobs" && <div className="card-meta">{String(row.role)} · {String(row.work_mode || "").replace("_"," ")}{row.compensation ? ` · ${row.compensation}` : ""}</div>}
      {author && <div className="card-meta">Posted by <Link href={`/u/${author.username}`}>{String(author.full_name || author.username)}</Link></div>}
      <p className="card-description">{String(row.description || row.about || "").slice(0, 210)}{String(row.description || row.about || "").length > 210 ? "…" : ""}</p>
      {tags.length > 0 && <div className="card-tags">{tags.slice(0,4).map((tag) => <span key={String(tag)}>{String(tag)}</span>)}</div>}
      {kind && <ListingActions kind={kind} id={String(row.id)} ownerId={String(row.owner_id)} />}
      {!kind && <Link className="card-cta" href={href}>View details <ArrowUpRight size={14} /></Link>}
    </article>;
  })}</div> : <Empty title={section === "jobs" ? "No open roles just yet" : section === "collaborate" ? "No open collaborations yet" : section === "projects" ? "No public projects yet" : "No organizations yet"} body={section === "jobs" ? "New roles will appear here when creative teams publish them." : section === "collaborate" ? "Share a project brief to find the people you need." : "Public projects and organizations appear here as members create them."} action={section === "jobs" ? "/jobs/new" : section === "collaborate" ? "/collaborate/new" : section === "projects" ? "/projects/new" : "/organizations/new"} actionText={section === "jobs" ? "Post a role" : section === "collaborate" ? "Start a collaboration" : "Create new"} />;

  if (section === "journal") return rows.length ? <div className="journal-grid">{rows.map((row) => <article className="journal-card" key={String(row.id)}>
    {media.get(String(row.id)) && <Link href={`/journal/${row.id}`} className="journal-media"><Image src={media.get(String(row.id))!} alt="" width={500} height={300} unoptimized /></Link>}
    <div className="card-meta">{String(row.category)}{row.published_at ? ` · ${new Date(String(row.published_at)).toLocaleDateString()}` : ""}</div>
    <h2><Link href={`/journal/${row.slug}`}>{String(row.title)}</Link></h2><p className="card-description">{String(row.subtitle)}</p>
    <Link className="card-cta" href={`/journal/${row.slug}`}>Read article <ArrowUpRight size={14} /></Link>
  </article>)}</div> : <Empty title="Stories are taking shape" body="Published writing from artists, crews, and creative organizations will be gathered here." action="/journal/new" actionText="Write an article" />;

  if (section === "notifications") return rows.length ? <div>{rows.map((row) => <div className="list-row" key={String(row.id)}><div><h3>{notificationText(row)}</h3><p>{new Date(String(row.created_at)).toLocaleString()}</p></div>{row.read_at ? <span className="card-meta">Read</span> : <NotificationActions id={String(row.id)} />}</div>)}</div> : <Empty title="Nothing new for now" body="Connection requests, messages, and project updates will show up here." />;

  if (section === "messages") return rows.length ? <div className="opportunity-grid">{rows.map((row) => <Link className="opportunity-card" href={`/messages/${row.id}`} key={String(row.id)}><div className="card-meta">Conversation</div><h2>{String(row.context_type || "Creative conversation")}</h2><p className="card-description">{String(row.context_id || "A private space for your conversation.")}</p><span className="card-cta">Open conversation <ArrowRight size={15} /></span></Link>)}</div> : <Empty title="A conversation can start anywhere" body="Open a creator profile and start a private conversation with the people you want to work with." action="/connect" actionText="Find someone" />;

  if (section === "settings") return <SettingsForm row={rows[0] ?? {}} />;
  if (section === "profile") return rows[0] ? <div className="settings-layout"><SettingsNav selected="profile" /><ProfileEditForm row={rows[0]} /></div> : <Empty title="Your profile is not ready" body="Create an account to set up your professional identity." action="/signup" actionText="Create account" />;
  if (section === "admin") return rows.length ? <div>{rows.map((row) => <div className="list-row" key={String(row.id)}><div><h3>{String(row.reason)}</h3><p>{String(row.target_type)} · {String(row.target_id)} · {String(row.status)}</p></div></div>)}</div> : <Empty title="No reports need review" body="Reports submitted by members will be listed here." />;
  if (section === "search") return <div><h2 className="result-count">{rows.length} people match “{section}”</h2>{rows.length ? <div className="person-grid">{rows.map((row) => <PersonCard key={String(row.user_id)} person={row} self={row.user_id === userId} />)}</div> : <Empty title="No matches yet" body="Search names, craft, places, or headlines." />}</div>;
  return <Empty title="Nothing published here yet" body="Sign in to add something to this collection." action="/login" actionText="Sign in" />;
}

function PersonCard({ person, image, self }: { person: Row; image?: string; self: boolean }) {
  return <article className="person-card">
    <Link className="person-photo" href={`/u/${person.username}`} aria-label={`View ${person.full_name}'s profile`}>{image ? <Image src={image} alt="" width={64} height={64} unoptimized /> : String(person.full_name || person.username || "A").slice(0,1)}</Link>
    <h2><Link href={`/u/${person.username}`}>{String(person.full_name || person.username)}</Link>{person.verified_at ? <span className="verified-mark" title="Verified"> ✓</span> : null}</h2>
    <div className="person-role">{String(person.profession || "Creative professional")}</div>
    <div className="person-location">{[person.city,person.country].filter(Boolean).join(", ")}</div>
    <p className="person-bio">{String(person.headline || person.biography || "A creative professional building their practice.")}</p>
    <div className="person-links"><Link href={`/u/${person.username}`}>View profile <ArrowUpRight size={13} /></Link>{!self && <PersonActions target={String(person.user_id)} />}</div>
  </article>;
}

import { PersonActions } from "@/components/person-actions";
import { SettingsForm, ProfileEditForm, SettingsNav } from "@/components/settings-forms";

function notificationText(row: Row) {
  const labels: Record<string,string> = { connection_request: "Someone sent you a connection request", connection_accepted: "Your connection request was accepted", message: "You have a new message", collaboration_interest: "Someone is interested in your collaboration", application: "There is an update to a job application" };
  return labels[String(row.kind)] || "There is an update to your creative network";
}
