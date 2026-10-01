import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; featureId: string }> };

/** POST /api/departments/[id]/features/[featureId]/images — add image */
export async function POST(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { featureId } = await params;
  const body = await request.json().catch(() => null);

  if (!body?.image_url?.trim()) {
    return Response.json({ error: "image_url is required." }, { status: 400 });
  }

  // get current max sort_order
  const { data: existing } = await access.supabase
    .from("department_feature_images")
    .select("sort_order")
    .eq("feature_id", featureId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0
    ? (existing[0].sort_order as number) + 1
    : 0;

  const { data, error } = await access.supabase
    .from("department_feature_images")
    .insert({
      feature_id: featureId,
      image_url: body.image_url.trim(),
      caption: body.caption || null,
      sort_order: body.sort_order ?? nextOrder,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

/** PATCH /api/departments/[id]/features/[featureId]/images — reorder */
export async function PATCH(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const items: { id: string; sort_order: number }[] = body?.items ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Provide items array." }, { status: 400 });
  }

  const results = await Promise.all(
    items.map(({ id, sort_order }) =>
      access.supabase
        .from("department_feature_images")
        .update({ sort_order })
        .eq("id", id),
    ),
  );

  const failure = results.find((r) => r.error)?.error;
  return failure
    ? Response.json({ error: failure.message }, { status: 400 })
    : Response.json({ ok: true });
}

/** DELETE /api/departments/[id]/features/[featureId]/images?imageId=xxx */
export async function DELETE(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const imageId = url.searchParams.get("imageId");

  if (!imageId) return Response.json({ error: "imageId required." }, { status: 400 });

  const { error } = await access.supabase
    .from("department_feature_images")
    .delete()
    .eq("id", imageId);

  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
