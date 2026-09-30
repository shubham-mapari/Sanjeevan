import { createClient } from "@supabase/supabase-js";
import type { RichDocument } from "@/lib/navigation-types";

export type QuickLinkGalleryImage = {
  id: string;
  quick_link_id: string;
  image_url: string;
  display_order: number;
};

export type QuickLink = {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string;
  slug: string;
  short_description: string;
  full_description: RichDocument;
  pdf_url: string | null;
  display_order: number;
  is_active: boolean;
  published: boolean;
  created_at: string;
  quick_link_gallery: QuickLinkGalleryImage[];
};

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getPublishedQuickLinks(): Promise<QuickLink[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("quick_links")
      .select("*, quick_link_gallery(*)")
      .eq("is_active", true)
      .eq("published", true)
      .order("display_order", { ascending: true });

    if (error || !data) return [];
    return (data as unknown as QuickLink[]).map((item) => ({
      ...item,
      quick_link_gallery: [...(item.quick_link_gallery ?? [])].sort(
        (left, right) => left.display_order - right.display_order,
      ),
    }));
  } catch {
    return [];
  }
}

export async function getPublishedQuickLink(slug: string): Promise<QuickLink | null> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("quick_links")
      .select("*, quick_link_gallery(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) return null;
    const item = data as unknown as QuickLink;
    return {
      ...item,
      quick_link_gallery: [...(item.quick_link_gallery ?? [])].sort(
        (left, right) => left.display_order - right.display_order,
      ),
    };
  } catch {
    return null;
  }
}
