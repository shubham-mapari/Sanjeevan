import { ContentListing } from "@/components/campus-content-section";
import { getPublishedContent } from "@/lib/campus-content";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await getPublishedContent("news");
  return <ContentListing kind="news" items={items} />;
}