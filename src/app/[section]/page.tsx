import type { Metadata } from "next";
import { CollectionPage } from "@/components/collection-page";

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const title = section.charAt(0).toUpperCase() + section.slice(1);
  return { title };
}

export default async function SectionRoute({ params, searchParams }: Props) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  return <CollectionPage section={section} query={typeof query.q === "string" ? query.q : ""} />;
}
