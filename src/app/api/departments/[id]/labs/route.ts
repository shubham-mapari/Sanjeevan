import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/departments/[id]/labs */
export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const url = new URL(request.url);
  const drafts = url.searchParams.get("drafts") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ labs: [] });

  let q = supabase
    .from("department_labs")
    .select("*")
    .eq("department_id", id)
    .order("display_order");

  if (!drafts) q = q.eq("is_active", true);

  const { data: labs, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!labs || labs.length === 0) return Response.json({ labs: [] });

  const labIds = labs.map((l) => l.id as string);
  const { data: images } = await supabase
    .from("department_lab_images")
    .select("*")
    .in("lab_id", labIds)
    .order("sort_order");

  const enriched = labs.map((l) => ({
    ...l,
    images: (images ?? []).filter((img) => img.lab_id === l.id),
  }));

  return Response.json({ labs: enriched });
}

/** POST /api/departments/[id]/labs */
export async function POST(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return Response.json({ error: "Lab name is required." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from("department_labs")
    .insert({
      department_id: id,
      name: body.name.trim(),
      lab_code: body.lab_code || null,
      description: body.description || null,
      incharge: body.incharge || null,
      cover_image: body.cover_image || null,
      equipment: body.equipment || null,
      facilities: body.facilities || null,
      pdf_url: body.pdf_url || null,
      external_url: body.external_url || null,
      display_order: Number(body.display_order ?? 0),
      is_active: body.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

/** PUT /api/departments/[id]/labs?labId=xxx */
export async function PUT(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const labId = url.searchParams.get("labId");
  if (!labId) return Response.json({ error: "labId required." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body." }, { status: 400 });

  const fields = [
    "name", "lab_code", "description", "incharge", "cover_image",
    "equipment", "facilities", "pdf_url", "external_url",
    "display_order", "is_active",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (updates.name) updates.name = String(updates.name).trim();

  const { data, error } = await access.supabase
    .from("department_labs")
    .update(updates)
    .eq("id", labId)
    .select("*")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Lab not found." }, { status: 404 });
  return Response.json(data);
}

/** DELETE /api/departments/[id]/labs?labId=xxx */
export async function DELETE(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const labId = url.searchParams.get("labId");
  if (!labId) return Response.json({ error: "labId required." }, { status: 400 });

  const { error } = await access.supabase
    .from("department_labs")
    .delete()
    .eq("id", labId);

  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}

/** POST /api/departments/[id]/labs/image — add image to lab
 *  Body: { lab_id, image_url, caption?, sort_order? }
 */
export async function PATCH(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  if (!body?.lab_id || !body?.image_url) {
    return Response.json({ error: "lab_id and image_url required." }, { status: 400 });
  }

  const { data: existing } = await access.supabase
    .from("department_lab_images")
    .select("sort_order")
    .eq("lab_id", body.lab_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing?.length ? (existing[0].sort_order as number) + 1 : 0;

  const { data, error } = await access.supabase
    .from("department_lab_images")
    .insert({
      lab_id: body.lab_id,
      image_url: body.image_url,
      caption: body.caption || null,
      sort_order: body.sort_order ?? nextOrder,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
