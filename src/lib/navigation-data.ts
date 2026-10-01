import type {
  NavigationItem,
  NavigationMenu,
  NavigationPage,
} from "@/lib/navigation-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublishedNavigation(): Promise<NavigationMenu[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data: menus, error: menuError } = await supabase
    .from("menus")
    .select(
      "id,title,slug,icon,sort_order,is_visible,is_published,created_at,updated_at",
    )
    .eq("is_visible", true)
    .eq("is_published", true)
    .order("sort_order");
  if (menuError || !menus?.length) return [];

  const { data: items, error: itemError } = await supabase
    .from("menu_items")
    .select(
      "id,menu_id,title,slug,sort_order,is_visible,is_published,created_at,updated_at",
    )
    .in(
      "menu_id",
      menus.map((menu) => menu.id),
    )
    .eq("is_visible", true)
    .eq("is_published", true)
    .order("sort_order");
  if (itemError) return menus.map((menu) => ({ ...menu, items: [] }));

  const flatItems = (items ?? []).map((item) => ({
    ...item,
    parent_id: null,
    level: 1,
    icon: null,
    children: [],
  })) as NavigationItem[];

  return menus.map((menu) => ({
    ...menu,
    items: flatItems.filter((item) => item.menu_id === menu.id),
  }));
}

export async function getPublishedPage(
  slug: string,
  preview = false,
): Promise<NavigationPage | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  let query = supabase.from("pages").select("*").eq("slug", slug);
  if (!preview) {
    query = query.eq("published", true);
  }

  const { data: page } = await query.maybeSingle();
  if (!page) {
    // If no custom page in pages table yet, check if this slug belongs to a menu_item
    const { data: menuItem } = await supabase
      .from("menu_items")
      .select("id, title, slug, is_published, is_visible")
      .eq("slug", slug)
      .maybeSingle();

    if (menuItem && (preview || (menuItem.is_published && menuItem.is_visible))) {
      return {
        id: menuItem.id,
        menu_item_id: menuItem.id,
        title: menuItem.title,
        slug: menuItem.slug,
        hero_image:
          "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80",
        hero_heading: menuItem.title,
        hero_subtitle: "Sanjeevan Group of Institutions, Panhala",
        description: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Welcome to ${menuItem.title} at Sanjeevan Group of Institutions. Detailed institutional and academic information for this section is managed directly via the Sanjeevan Admin CMS.`,
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Sanjeevan Group of Institutions (Autonomous), Panhala, Kolhapur is committed to holistic education, cutting-edge engineering laboratories, industry mentorship, and dynamic student development.",
                },
              ],
            },
          ],
        },
        gallery: [
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
        ],
        gallery_images: [
          {
            id: "g-1",
            page_id: menuItem.id,
            image_url:
              "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
            sort_order: 0,
          },
          {
            id: "g-2",
            page_id: menuItem.id,
            image_url:
              "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
            sort_order: 1,
          },
          {
            id: "g-3",
            page_id: menuItem.id,
            image_url:
              "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
            sort_order: 2,
          },
        ],
        pdf_file: null,
        page_files: [],
        video_url: null,
        cta_label: "Apply for Admission",
        cta_url: "/admission",
        cta_text: "Apply for Admission",
        cta_link: "/admission",
        seo_title: `${menuItem.title} | Sanjeevan Group of Institutions`,
        seo_description: `Learn more about ${menuItem.title} at Sanjeevan Group of Institutions, Panhala.`,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Check if this slug belongs to a top-level menu
    const { data: menu } = await supabase
      .from("menus")
      .select("id, title, slug, is_published, is_visible")
      .eq("slug", slug)
      .maybeSingle();

    if (menu && (preview || (menu.is_published && menu.is_visible))) {
      return {
        id: menu.id,
        menu_item_id: null,
        title: menu.title,
        slug: menu.slug,
        hero_image:
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
        hero_heading: menu.title,
        hero_subtitle: "Sanjeevan Group of Institutions, Panhala",
        description: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Welcome to the ${menu.title} section of Sanjeevan Group of Institutions. Explore our diverse educational offerings, departments, and campus life.`,
                },
              ],
            },
          ],
        },
        gallery: [
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
        ],
        gallery_images: [
          {
            id: "m-1",
            page_id: menu.id,
            image_url:
              "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
            sort_order: 0,
          },
          {
            id: "m-2",
            page_id: menu.id,
            image_url:
              "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
            sort_order: 1,
          },
        ],
        pdf_file: null,
        page_files: [],
        video_url: null,
        cta_label: "Contact Admissions",
        cta_url: "/contact",
        cta_text: "Contact Admissions",
        cta_link: "/contact",
        seo_title: `${menu.title} | Sanjeevan Group of Institutions`,
        seo_description: `Learn more about ${menu.title} at Sanjeevan Group of Institutions.`,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return null;
  }

  const galleryList = Array.isArray(page.gallery) ? page.gallery : [];
  const galleryItems = galleryList.map((url: string, idx: number) => ({
    id: `${page.id}-${idx}`,
    page_id: page.id,
    image_url: url,
    sort_order: idx,
  }));

  const fileItems = page.pdf_file
    ? [
        {
          id: `${page.id}-pdf`,
          page_id: page.id,
          file_name: page.pdf_file.split("/").pop() || "Document.pdf",
          file_url: page.pdf_file,
          file_type: "pdf",
        },
      ]
    : [];

  return {
    ...(page as NavigationPage),
    hero_heading: (page as Record<string, unknown>).hero_heading as string || page.title,
    hero_subtitle:
      (page as Record<string, unknown>).hero_subtitle as string ||
      page.seo_description ||
      null,
    cta_text:
      (page as Record<string, unknown>).cta_text as string ||
      page.cta_label ||
      null,
    cta_link:
      (page as Record<string, unknown>).cta_link as string ||
      page.cta_url ||
      null,
    gallery: galleryList,
    gallery_images: galleryItems,
    page_files: fileItems,
  };
}
