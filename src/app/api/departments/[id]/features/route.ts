import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/departments/[id]/features
 *  Public: ?drafts=false (default) → published+active only
 *  Admin:  ?drafts=true            → all features
 */
export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const url = new URL(request.url);
  const drafts = url.searchParams.get("drafts") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ features: [] });

  let q = supabase
    .from("department_features")
    .select("*")
    .eq("department_id", id)
    .order("display_order");

  if (!drafts) {
    q = q.eq("published", true).eq("is_active", true);
  }

  const { data: features, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!features || features.length === 0) return Response.json({ features: [] });

  // Join images + documents
  const ids = features.map((f) => f.id as string);
  const [{ data: images }, { data: docs }] = await Promise.all([
    supabase
      .from("department_feature_images")
      .select("*")
      .in("feature_id", ids)
      .order("sort_order"),
    supabase
      .from("department_feature_documents")
      .select("*")
      .in("feature_id", ids)
      .order("sort_order"),
  ]);

  const enriched = features.map((f) => ({
    ...f,
    images: (images ?? []).filter((img) => img.feature_id === f.id),
    documents: (docs ?? []).filter((doc) => doc.feature_id === f.id),
  }));

  return Response.json({ features: enriched });
}

/** POST /api/departments/[id]/features — create a new feature */
export async function POST(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body?.name?.trim()) {
    return Response.json({ error: "Feature name is required." }, { status: 400 });
  }
  if (!body?.slug || !slugPattern.test(body.slug)) {
    return Response.json(
      { error: "Feature slug must be lowercase letters, numbers, and hyphens." },
      { status: 400 },
    );
  }

  const { data, error } = await access.supabase
    .from("department_features")
    .insert({
      department_id: id,
      name: body.name.trim(),
      slug: body.slug,
      short_description: body.short_description || null,
      full_description: body.full_description ?? null,
      cover_image: body.cover_image || null,
      pdf_url: body.pdf_url || null,
      external_url: body.external_url || null,
      feature_icon: body.feature_icon || null,
      display_order: Number(body.display_order ?? 0),
      is_active: body.is_active ?? true,
      published: body.published ?? true,
      open_in_new_page: body.open_in_new_page ?? false,
    })
    .select("*")
    .single();

  if (error) {
    return Response.json(
      { error: error.message },
      { status: error.code === "23505" ? 409 : 400 },
    );
  }

  return Response.json(data, { status: 201 });
}

/** PATCH /api/departments/[id]/features — bulk reorder */
export async function PATCH(request: Request, { params: _params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const items: { id: string; display_order: number }[] = body?.items ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Provide items array." }, { status: 400 });
  }

  const results = await Promise.all(
    items.map(({ id, display_order }) =>
      access.supabase
        .from("department_features")
        .update({ display_order })
        .eq("id", id),
    ),
  );

  const failure = results.find((r) => r.error)?.error;
  return failure
    ? Response.json({ error: failure.message }, { status: 400 })
    : Response.json({ ok: true });
}
