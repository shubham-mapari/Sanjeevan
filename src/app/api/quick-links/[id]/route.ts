import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function toSlug(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "";
}

function itemPayload(body: Record<string, unknown>) {
  return {
    title: typeof body.title === "string" ? body.title.trim() : "",
    category: typeof body.category === "string" ? body.category.trim() : "",
    thumbnail_url: typeof body.thumbnail_url === "string" ? body.thumbnail_url.trim() : "",
    slug: toSlug(body.slug),
    short_description: typeof body.short_description === "string" ? body.short_description.trim() : "",
    full_description: body.full_description ?? { type: "doc", content: [] },
    pdf_url: typeof body.pdf_url === "string" && body.pdf_url.trim() ? body.pdf_url.trim() : null,
    display_order: Number.isFinite(Number(body.display_order)) ? Number(body.display_order) : 0,
    is_active: body.is_active !== false,
    published: body.published === true,
  };
}

function galleryPayload(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .map((image_url, display_order) => ({ image_url: image_url.trim(), display_order }));
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { data, error } = await access.supabase
    .from("quick_links")
    .select("*, quick_link_gallery(*)")
    .eq("id", id)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid quick link data." }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  const payload = itemPayload(record);
  if (!payload.title || !payload.slug || !payload.thumbnail_url) {
    return Response.json(
      { error: "Title, page slug, and thumbnail image are required." },
      { status: 400 },
    );
  }

  const { data, error } = await access.supabase
    .from("quick_links")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const gallery = galleryPayload(record.gallery_images);
  if (gallery) {
    const { error: deleteError } = await access.supabase
      .from("quick_link_gallery")
      .delete()
      .eq("quick_link_id", id);
    if (deleteError) return Response.json({ error: deleteError.message }, { status: 400 });

    if (gallery.length) {
      const { error: insertError } = await access.supabase
        .from("quick_link_gallery")
        .insert(gallery.map((image) => ({ ...image, quick_link_id: id })));
      if (insertError) return Response.json({ error: insertError.message }, { status: 400 });
    }
  }

  return Response.json(data);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { error } = await access.supabase.from("quick_links").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
