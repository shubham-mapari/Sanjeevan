import { ContentListing } from "@/components/campus-content-section";
import { getPublishedContent } from "@/lib/campus-content";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const items = await getPublishedContent("downloads");
  return <ContentListing kind="downloads" items={items} />;
}