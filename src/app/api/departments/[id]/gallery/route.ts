import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/departments/[id]/gallery */
export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const url = new URL(request.url);
  const drafts = url.searchParams.get("drafts") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ gallery: [] });

  let q = supabase
    .from("department_gallery")
    .select("*")
    .eq("department_id", id)
    .order("sort_order");

  if (!drafts) q = q.eq("published", true);

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ gallery: data ?? [] });
}

/** POST /api/departments/[id]/gallery — add image */
export async function POST(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.image_url?.trim()) {
    return Response.json({ error: "image_url is required." }, { status: 400 });
  }

  const { data: existing } = await access.supabase
    .from("department_gallery")
    .select("sort_order")
    .eq("department_id", id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing?.length ? (existing[0].sort_order as number) + 1 : 0;

  const { data, error } = await access.supabase
    .from("department_gallery")
    .insert({
      department_id: id,
      image_url: body.image_url.trim(),
      caption: body.caption || null,
      album_name: body.album_name || null,
      sort_order: body.sort_order ?? nextOrder,
      published: body.published ?? true,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

/** PATCH /api/departments/[id]/gallery — reorder */
export async function PATCH(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const items: { id: string; sort_order: number }[] = body?.items ?? [];
  if (!items.length) return Response.json({ error: "Provide items array." }, { status: 400 });

  const results = await Promise.all(
    items.map(({ id, sort_order }) =>
      access.supabase.from("department_gallery").update({ sort_order }).eq("id", id),
    ),
  );
  const failure = results.find((r) => r.error)?.error;
  return failure
    ? Response.json({ error: failure.message }, { status: 400 })
    : Response.json({ ok: true });
}

/** DELETE /api/departments/[id]/gallery?imageId=xxx */
export async function DELETE(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const imageId = url.searchParams.get("imageId");
  if (!imageId) return Response.json({ error: "imageId required." }, { status: 400 });

  const { error } = await access.supabase
    .from("department_gallery")
    .delete()
    .eq("id", imageId);

  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
