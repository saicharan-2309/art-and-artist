import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
export const metadata:Metadata={title:"Search"};
type SearchRow={id?:string;slug?:string;username?:string;full_name?:string;profession?:string;headline?:string;city?:string;medium?:string;project_type?:string;title?:string;role?:string;location?:string;category?:string};
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const {q=""}=await searchParams;const supabase=await createClient();
  if(!supabase)return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">GLOBAL SEARCH</span><h1>Search</h1></div><p>Search people, work, opportunities, and writing.</p></header><p>Connect Supabase to search live content.</p></main>;
  const term=q.trim().replaceAll(","," ");
  const [people,work,jobs,blogs]=await Promise.all([
    term?supabase.from("profiles").select("username,full_name,profession,headline,city").eq("visibility","public").or(`full_name.ilike.%${term}%,profession.ilike.%${term}%,headline.ilike.%${term}%`).limit(8):{data:[]},
    term?supabase.from("work_posts").select("id,title,medium,project_type").eq("status","published").eq("visibility","public").ilike("title",`%${term}%`).limit(8):{data:[]},
    term?supabase.from("jobs").select("id,title,role,location").eq("status","active").or(`title.ilike.%${term}%,role.ilike.%${term}%`).limit(8):{data:[]},
    term?supabase.from("blogs").select("id,title,slug,category").eq("status","published").ilike("title",`%${term}%`).limit(8):{data:[]},
  ]);
  return <main className="collection-wrap"><header className="collection-head"><div><span className="eyebrow">GLOBAL SEARCH</span><h1>Search</h1></div><form action="/search" className="collection-search"><input name="q" defaultValue={q} placeholder="Names, craft, work, stories" aria-label="Search"/><button className="button button-dark">Search</button></form></header>
    {!term?<div className="empty-state"><h2>Search across the creative network.</h2><p>Look for names, crafts, work, published roles, and writing.</p></div>:<div className="search-results">
      {section("People",(people.data??[]) as SearchRow[],(row)=><Link href={`/u/${row.username}`}>{row.full_name||row.username} <span>{row.profession} · {row.city}</span></Link>)}
      {section("Work",(work.data??[]) as SearchRow[],(row)=><Link href={`/work/${row.id}`}>{row.title} <span>{row.medium||row.project_type}</span></Link>)}
      {section("Jobs",(jobs.data??[]) as SearchRow[],(row)=><Link href={`/jobs/${row.id}`}>{row.title} <span>{row.role} · {row.location}</span></Link>)}
      {section("Journal",(blogs.data??[]) as SearchRow[],(row)=><Link href={`/journal/${row.slug}`}>{row.title} <span>{row.category}</span></Link>)}
    </div>}
  </main>;
}
function section(title:string,items:SearchRow[],render:(row:SearchRow)=>React.ReactNode){return <section className="search-group"><h2>{title} <span>{items.length}</span></h2>{items.length?items.map((item,index)=><div className="search-result" key={index}>{render(item)}</div>):<p>No matching {title.toLowerCase()}.</p>}</section>}
