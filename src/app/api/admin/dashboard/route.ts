import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const dashboardTables = [
  ["departments", "departments"],
  ["leaders", "leaders"],
  ["news", "news"],
  ["quickLinks", "quick_links"],
  ["events", "events"],
  ["downloads", "downloads"],
  ["navigation", "menu_items"],
  ["heroSlides", "hero_slides"],
  ["popupBanners", "popup_banners"],
] as const;

export async function GET() {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const results = await Promise.all(
    dashboardTables.map(async ([key, table]) => {
      const { count, error } = await access.supabase
        .from(table)
        .select("id", { count: "exact", head: true });
      return [key, error ? null : count] as const;
    }),
  );

  return Response.json({ counts: Object.fromEntries(results) });
}
