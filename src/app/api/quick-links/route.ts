import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  if (!Array.isArray(value)) return [];
  return value
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .map((image_url, display_order) => ({ image_url: image_url.trim(), display_order }));
}

export async function GET(request: Request) {
  const drafts = new URL(request.url).searchParams.get("drafts") === "true";
  let supabase;
  if (drafts) {
    const access = await requireNavigationAdmin();
    if (access.response) return access.response;
    supabase = access.supabase;
  } else {
    supabase = await createSupabaseServerClient();
  }
  if (!supabase) {
    return Response.json({ error: "Sign in is required." }, { status: drafts ? 401 : 503 });
  }

  const { data, error } = await supabase
    .from("quick_links")
    .select("*, quick_link_gallery(*)")
    .order("display_order", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const items = drafts
    ? data ?? []
    : (data ?? []).filter((item) => item.is_active && item.published);
  return Response.json({ items, tableReady: true });
}

export async function POST(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid quick link data." }, { status: 400 });
  }
  const payload = itemPayload(body as Record<string, unknown>);
  if (!payload.title || !payload.slug || !payload.thumbnail_url) {
    return Response.json(
      { error: "Title, page slug, and thumbnail image are required." },
      { status: 400 },
    );
  }

  const { data, error } = await access.supabase
    .from("quick_links")
    .insert(payload)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const gallery = galleryPayload((body as Record<string, unknown>).gallery_images);
  if (gallery.length) {
    const { error: galleryError } = await access.supabase
      .from("quick_link_gallery")
      .insert(gallery.map((image) => ({ ...image, quick_link_id: data.id })));
    if (galleryError) {
      await access.supabase.from("quick_links").delete().eq("id", data.id);
      return Response.json({ error: galleryError.message }, { status: 400 });
    }
  }
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const body = await request.json().catch(() => null);
  const items = body && Array.isArray(body.items) ? body.items : null;
  if (!items) return Response.json({ error: "No order supplied." }, { status: 400 });

  const results = await Promise.all(
    items.map((item: { id?: unknown; display_order?: unknown }) =>
      typeof item.id === "string"
        ? access.supabase
            .from("quick_links")
            .update({ display_order: Number(item.display_order) || 0 })
            .eq("id", item.id)
        : Promise.resolve({ error: new Error("Invalid item id") }),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return Response.json({ error: failed.error.message }, { status: 400 });
  return Response.json({ ok: true });
}
