import { createClient } from "@supabase/supabase-js";

export type PlacementSettings = {
  id?: string;
  eyebrow_text: string;
  heading_line1: string;
  heading_line2: string;
  body_text: string;
  cta_text: string;
  cta_link: string;
  banner_label: string;
  industry_label: string;
  companies: string[];
  photo_url: string | null;
  photo_alt: string;
  stat_number: string;
  stat_suffix: string;
  stat_label1: string;
  stat_label2: string;
  stat_link: string;
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
  disclaimer: string;
  is_active?: boolean;
  updated_at?: string;
};

export const DEFAULT_PLACEMENT_SETTINGS: PlacementSettings = {
  eyebrow_text: "From classroom to career",
  heading_line1: "Your next chapter",
  heading_line2: "starts here.",
  body_text:
    "We build the skills, confidence and connections that help our graduates take their place in a changing world.",
  cta_text: "Explore career outcomes",
  cta_link: "/training-placement",
  banner_label: "BUILDING CAREERS, ONE POSSIBILITY AT A TIME",
  industry_label: "Industry connections",
  companies: ["Infosys", "TCS", "Capgemini", "KPIT"],
  photo_url: null,
  photo_alt: "Engineering students collaborating on a project",
  stat_number: "95",
  stat_suffix: "%",
  stat_label1: "placement support",
  stat_label2: "for our graduates",
  stat_link: "/training-placement",
  stat1_value: "₹12 LPA",
  stat1_label: "Highest package*",
  stat2_value: "₹4.2 LPA",
  stat2_label: "Average package*",
  stat3_value: "120+",
  stat3_label: "Recruiting partners*",
  disclaimer: "*Based on recent placement data from verified campus drives.",
};

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Fetches active placement settings (singleton row).
 * Falls back to DEFAULT_PLACEMENT_SETTINGS if table not yet created.
 */
export async function getPlacementSettings(): Promise<PlacementSettings> {
  try {
    const supabase = getPublicClient();
    if (!supabase) return DEFAULT_PLACEMENT_SETTINGS;

    const { data, error } = await supabase
      .from("placement_settings")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) return DEFAULT_PLACEMENT_SETTINGS;

    return {
      ...DEFAULT_PLACEMENT_SETTINGS,
      ...data,
      companies: Array.isArray(data.companies)
        ? data.companies
        : typeof data.companies === "string"
        ? JSON.parse(data.companies)
        : DEFAULT_PLACEMENT_SETTINGS.companies,
    } as PlacementSettings;
  } catch {
    return DEFAULT_PLACEMENT_SETTINGS;
  }
}
