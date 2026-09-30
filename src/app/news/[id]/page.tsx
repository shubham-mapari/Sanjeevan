import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/campus-content-section";
import { getPublishedContentItem } from "@/lib/campus-content";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPublishedContentItem("news", id);
  if (!item) notFound();
  return <ContentDetail kind="news" item={item} />;
}