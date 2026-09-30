import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/campus-content-section";
import { getPublishedContentItem } from "@/lib/campus-content";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPublishedContentItem("events", id);
  if (!item) notFound();
  return <ContentDetail kind="events" item={item} />;
}