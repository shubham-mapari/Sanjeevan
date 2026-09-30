import type { PageInput } from "@/lib/navigation-types";
import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = (await request.json().catch(() => null)) as
    | (Partial<PageInput> & {
        gallery_images?: { image_url: string; sort_order: number }[];
        page_files?: { file_name: string; file_url: string; file_type?: string }[];
      })
    | null;

  if (!body?.title?.trim() || !slugPattern.test(body.slug ?? "")) {
    return Response.json(
      { error: "Page title and a valid lowercase URL slug are required." },
      { status: 400 },
    );
  }

  const ctaText = body.cta_text || body.cta_label || null;
  const ctaLink = body.cta_link || body.cta_url || null;

  const galleryList = Array.isArray(body.gallery)
    ? body.gallery.filter((item): item is string => typeof item === "string")
    : [];

  // Upsert page record using only existing columns in public.pages table
  const { data: page, error: pageError } = await access.supabase
    .from("pages")
    .upsert(
      {
        menu_item_id: body.menu_item_id || null,
        title: body.title.trim(),
        slug: body.slug,
        hero_image: body.hero_image || null,
        description: body.description ?? { type: "doc", content: [] },
        gallery: galleryList,
        pdf_file: body.pdf_file || null,
        video_url: body.video_url || null,
        cta_label: ctaText,
        cta_url: ctaLink,
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        published: body.published ?? false,
      },
      { onConflict: body.menu_item_id ? "menu_item_id" : "slug" },
    )
    .select("*")
    .single();

  if (pageError) {
    return Response.json(
      { error: pageError.message },
      { status: pageError.code === "23505" ? 409 : 400 },
    );
  }

  // Sync menu_item title and slug if menu_item_id is bound
  if (body.menu_item_id) {
    await access.supabase
      .from("menu_items")
      .update({ title: page.title, slug: page.slug })
      .eq("id", body.menu_item_id);
  }

  // Sync gallery_images if provided or from galleryList
  const imagesToSync =
    body.gallery_images && body.gallery_images.length
      ? body.gallery_images
      : galleryList.map((url, idx) => ({ image_url: url, sort_order: idx }));

  if (imagesToSync.length > 0) {
    try {
      await access.supabase
        .from("gallery_images")
        .delete()
        .eq("page_id", page.id);

      await access.supabase.from("gallery_images").insert(
        imagesToSync.map((img, idx) => ({
          page_id: page.id,
          image_url: img.image_url,
          sort_order: img.sort_order ?? idx,
        })),
      );
    } catch {
      // Table might not exist yet if migration pending
    }
  }

  // Sync page_files if provided or from pdf_file
  if (body.page_files && body.page_files.length) {
    try {
      await access.supabase
        .from("page_files")
        .delete()
        .eq("page_id", page.id);

      await access.supabase.from("page_files").insert(
        body.page_files.map((file) => ({
          page_id: page.id,
          file_name: file.file_name,
          file_url: file.file_url,
          file_type: file.file_type || "pdf",
        })),
      );
    } catch {
      // Table might not exist yet if migration pending
    }
  } else if (body.pdf_file) {
    try {
      await access.supabase
        .from("page_files")
        .delete()
        .eq("page_id", page.id);

      const fileName = body.pdf_file.split("/").pop() || "Document.pdf";
      await access.supabase.from("page_files").insert({
        page_id: page.id,
        file_name: fileName,
        file_url: body.pdf_file,
        file_type: "pdf",
      });
    } catch {
      // Table might not exist yet
    }
  }

  return Response.json(
    {
      ...page,
      hero_heading: body.hero_heading || page.title,
      hero_subtitle: body.hero_subtitle || page.seo_description || null,
      cta_text: page.cta_label,
      cta_link: page.cta_url,
      gallery_images: imagesToSync,
      page_files:
        body.page_files && body.page_files.length
          ? body.page_files
          : page.pdf_file
            ? [
                {
                  id: `${page.id}-pdf`,
                  page_id: page.id,
                  file_name: page.pdf_file.split("/").pop() || "Document.pdf",
                  file_url: page.pdf_file,
                  file_type: "pdf",
                },
              ]
            : [],
    },
    { status: 200 },
  );
}
