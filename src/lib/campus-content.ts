import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContentKind = "news" | "events" | "downloads";

export type CampusContentItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  category: string | null;
  publish_date: string | null;
  event_date: string | null;
  venue: string | null;
  registration_link: string | null;
  is_new: boolean;
  pdf_url: string | null;
  file_size: string | null;
  display_order: number;
  is_pinned: boolean;
  published: boolean;
  created_at: string;
};

export async function getPublishedContent(
  kind: ContentKind,
  limit?: number,
): Promise<CampusContentItem[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  let result;
  if (kind === "news") {
    let query = supabase
      .from("news")
      .select("*")
      .eq("published", true)
      .order("is_pinned", { ascending: false })
      .order("publish_date", { ascending: false })
      .order("display_order", { ascending: true });
    if (limit !== undefined) query = query.limit(limit);
    result = await query;
  } else if (kind === "events") {
    let query = supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .order("is_pinned", { ascending: false })
      .order("event_date", { ascending: false })
      .order("display_order", { ascending: true });
    if (limit !== undefined) query = query.limit(limit);
    result = await query;
  } else {
    let query = supabase
      .from("downloads")
      .select("*")
      .eq("published", true)
      .order("is_pinned", { ascending: false })
      .order("display_order", { ascending: true });
    if (limit !== undefined) query = query.limit(limit);
    result = await query;
  }

  if (result.error) return [];
  return (result.data ?? []) as CampusContentItem[];
}

export async function getPublishedContentItem(
  kind: ContentKind,
  id: string,
): Promise<CampusContentItem | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const result = await supabase
    .from(kind)
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (result.error || !result.data) return null;
  return result.data as CampusContentItem;
}