import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type SearchResult = {
  id: string;
  title: string;
  slug: string;
  url: string;
  type: "page" | "menu" | "dropdown" | "quick";
  subtitle?: string;
};

const QUICK_LINKS: SearchResult[] = [
  {
    id: "quick-admissions",
    title: "Admissions Open 2026-27",
    slug: "admission",
    url: "/admission",
    type: "quick",
    subtitle: "DTE Institute Code: EN6315",
  },
  {
    id: "quick-departments",
    title: "Engineering Departments & Programs",
    slug: "departments",
    url: "/pages/departments",
    type: "quick",
    subtitle: "Autonomous B.Tech & Diploma programs",
  },
  {
    id: "quick-placements",
    title: "Training & Placement Cell",
    slug: "placements",
    url: "/pages/placements",
    type: "quick",
    subtitle: "Top recruiters, salary packages & alumni",
  },
  {
    id: "quick-contact",
    title: "Contact Campus Office & Directions",
    slug: "contact",
    url: "/contact",
    type: "quick",
    subtitle: "Panhala, Kolhapur · +91 9146999500",
  },
  {
    id: "quick-portal",
    title: "Student Portal & Academic ERP",
    slug: "student-section",
    url: "/student-section",
    type: "quick",
    subtitle: "Syllabus, results & exam updates",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!q) {
    return Response.json({ results: QUICK_LINKS.slice(0, 4) });
  }

  const supabase = await createSupabaseServerClient();
  const results: SearchResult[] = [];

  // Match quick links
  for (const item of QUICK_LINKS) {
    if (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.slug.toLowerCase().includes(q)
    ) {
      results.push(item);
    }
  }

  if (supabase) {
    // Search menu_items
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("id, title, slug, is_published, is_visible")
      .eq("is_published", true)
      .eq("is_visible", true)
      .ilike("title", `%${q}%`)
      .limit(6);

    if (menuItems?.length) {
      for (const item of menuItems) {
        if (!results.some((r) => r.slug === item.slug)) {
          results.push({
            id: item.id,
            title: item.title,
            slug: item.slug,
            url: `/pages/${item.slug}`,
            type: "dropdown",
            subtitle: "Academic section",
          });
        }
      }
    }

    // Search menus
    const { data: menus } = await supabase
      .from("menus")
      .select("id, title, slug, is_published, is_visible")
      .eq("is_published", true)
      .eq("is_visible", true)
      .ilike("title", `%${q}%`)
      .limit(4);

    if (menus?.length) {
      for (const menu of menus) {
        if (!results.some((r) => r.slug === menu.slug)) {
          results.push({
            id: menu.id,
            title: menu.title,
            slug: menu.slug,
            url: menu.slug === "home" ? "/" : `/pages/${menu.slug}`,
            type: "menu",
            subtitle: "Main section",
          });
        }
      }
    }

    // Search pages
    const { data: pages } = await supabase
      .from("pages")
      .select("id, title, slug, seo_title, seo_description, published")
      .eq("published", true)
      .or(`title.ilike.%${q}%,seo_title.ilike.%${q}%,seo_description.ilike.%${q}%`)
      .limit(5);

    if (pages?.length) {
      for (const page of pages) {
        if (!results.some((r) => r.slug === page.slug)) {
          results.push({
            id: page.id,
            title: page.title,
            slug: page.slug,
            url: `/pages/${page.slug}`,
            type: "page",
            subtitle: page.seo_description || "Information page",
          });
        }
      }
    }
  }

  // Deduplicate and cap at 8
  const uniqueResults = results.slice(0, 8);
  return Response.json({ results: uniqueResults });
}
