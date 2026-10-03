import { notFound } from "next/navigation";
import { CreateEntryForm } from "@/components/create-entry-form";
import type { Metadata } from "next";

const titles: Record<string,string> = { work:"Share work", jobs:"Post a role", collaborate:"Start a collaboration", journal:"Write for the journal", projects:"Add a project", organizations:"Create an organization" };
export async function generateMetadata({params}:{params:Promise<{section:string}>}):Promise<Metadata>{const {section}=await params;return {title:titles[section]||"Create"};}
export default async function NewEntry({params}:{params:Promise<{section:string}>}) {
  const {section}=await params;
  if(!(section in titles)) notFound();
  return <main className="collection-wrap">
    <header className="collection-head"><div><span className="eyebrow">CREATE · CONNECT · DISCOVER</span><h1>{titles[section]}</h1></div><p>Share clear, useful information with the creative community.</p></header>
    <CreateEntryForm kind={section as "work"|"jobs"|"collaborate"|"journal"|"projects"|"organizations"} />
  </main>;
}
