import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInstitutionDate } from "@/lib/popup-banner-date";

export { getInstitutionDate } from "@/lib/popup-banner-date";

export type PopupBanner = {
  id: string;
  title: string;
  image_url: string;
  redirect_url: string | null;
  open_new_tab: boolean;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  published: boolean;
  created_at: string;
};

export async function getPublishedPopupBanner(): Promise<PopupBanner | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const today = getInstitutionDate();
  const { data, error } = await supabase
    .from("popup_banners")
    .select("*")
    .eq("published", true)
    .eq("is_active", true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as PopupBanner;
}