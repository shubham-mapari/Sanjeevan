import { createClient } from "@supabase/supabase-js";

export type HeroSlide = {
  id: string;
  image_url: string;
  label: string | null;
  heading: string;
  highlight: string | null;
  description: string | null;
  quote: string | null;
  quote_author: string | null;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  is_active: boolean;
  published: boolean;
  image_ratio?: string | null;
  created_at?: string;
  updated_at?: string;
};

// All default/dummy slides removed as requested. Only real admin slides are shown.
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [];

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Fetches published hero slides from Supabase.
 * Returns empty array [] if no slides have been created or published.
 */
export async function getPublishedHeroSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("published", true)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as HeroSlide[];
  } catch {
    return [];
  }
}
