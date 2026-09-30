import { ContentListing } from "@/components/campus-content-section";
import { getPublishedContent } from "@/lib/campus-content";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const items = await getPublishedContent("events");
  return <ContentListing kind="events" items={items} />;
}