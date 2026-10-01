import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Ctx = { params: Promise<{ id: string; featureId: string }> };

/** GET /api/departments/[id]/features/[featureId] */
export async function GET(_req: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { featureId } = await params;

  const { data: feature, error } = await access.supabase
    .from("department_features")
    .select("*")
    .eq("id", featureId)
    .maybeSingle();

  if (error || !feature) {
    return Response.json({ error: "Feature not found." }, { status: 404 });
  }

  const [{ data: images }, { data: docs }] = await Promise.all([
    access.supabase
      .from("department_feature_images")
      .select("*")
      .eq("feature_id", featureId)
      .order("sort_order"),
    access.supabase
      .from("department_feature_documents")
      .select("*")
      .eq("feature_id", featureId)
      .order("sort_order"),
  ]);

  return Response.json({
    ...feature,
    images: images ?? [],
    documents: docs ?? [],
  });
}

/** PUT /api/departments/[id]/features/[featureId] — full update */
export async function PUT(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { featureId } = await params;
  const body = await request.json().catch(() => null);

  if (!body) return Response.json({ error: "Invalid body." }, { status: 400 });
  if (body.name !== undefined && !String(body.name).trim()) {
    return Response.json({ error: "Feature name cannot be empty." }, { status: 400 });
  }
  if (body.slug !== undefined && !slugPattern.test(body.slug)) {
    return Response.json({ error: "Invalid slug." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  const fields = [
    "name", "slug", "short_description", "full_description",
    "cover_image", "pdf_url", "external_url", "feature_icon",
    "display_order", "is_active", "published", "open_in_new_page",
  ] as const;

  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (updates.name) updates.name = String(updates.name).trim();

  const { data, error } = await access.supabase
    .from("department_features")
    .update(updates)
    .eq("id", featureId)
    .select("*")
    .maybeSingle();

  if (error) {
    return Response.json(
      { error: error.message },
      { status: error.code === "23505" ? 409 : 400 },
    );
  }
  if (!data) return Response.json({ error: "Feature not found." }, { status: 404 });

  return Response.json(data);
}

/** DELETE /api/departments/[id]/features/[featureId] */
export async function DELETE(_req: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { featureId } = await params;

  const { error } = await access.supabase
    .from("department_features")
    .delete()
    .eq("id", featureId);

  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
