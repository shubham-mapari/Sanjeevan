import { getPublishedPage } from "@/lib/navigation-data";
import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Context) {
  const { slug } = await params;
  const url = new URL(request.url);
  const isDrafts = url.searchParams.get("drafts") === "true";

  if (!isDrafts) {
    const page = await getPublishedPage(slug);
    return page
      ? Response.json(page)
      : Response.json({ error: "Page not found." }, { status: 404 });
  }

  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { data: page, error } = await access.supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!page) return Response.json({ error: "Page not found." }, { status: 404 });

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

  return Response.json({
    ...page,
    hero_heading: (page as Record<string, unknown>).hero_heading || page.title,
    hero_subtitle:
      (page as Record<string, unknown>).hero_subtitle ||
      page.seo_description ||
      null,
    cta_text:
      (page as Record<string, unknown>).cta_text || page.cta_label || null,
    cta_link: (page as Record<string, unknown>).cta_link || page.cta_url || null,
    gallery_images: galleryItems,
    page_files: fileItems,
  });
}

export async function DELETE(request: Request, { params }: Context) {
  const { slug } = await params;
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { error } = await access.supabase
    .from("pages")
    .delete()
    .eq("slug", slug);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, message: "Page deleted successfully." });
}
