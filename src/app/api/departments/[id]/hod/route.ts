import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/departments/[id]/hod — public, published hod */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ hod: null });

  const { data, error } = await supabase
    .from("department_hods")
    .select("*")
    .eq("department_id", id)
    .eq("published", true)
    .eq("is_active", true)
    .order("display_order")
    .limit(1)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ hod: data ?? null });
}

/** POST /api/departments/[id]/hod — create hod record */
export async function POST(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return Response.json({ error: "HOD name is required." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from("department_hods")
    .insert({
      department_id: id,
      name: body.name.trim(),
      designation: body.designation || null,
      qualification: body.qualification || null,
      experience: body.experience || null,
      photo_url: body.photo_url || null,
      short_intro: body.short_intro || null,
      full_message: body.full_message ?? null,
      email: body.email || null,
      phone: body.phone || null,
      resume_pdf: body.resume_pdf || null,
      display_order: Number(body.display_order ?? 0),
      is_active: body.is_active ?? true,
      published: body.published ?? true,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

/** PUT /api/departments/[id]/hod?hodId=xxx — update hod */
export async function PUT(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const hodId = url.searchParams.get("hodId");
  if (!hodId) return Response.json({ error: "hodId required." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body." }, { status: 400 });

  const fields = [
    "name", "designation", "qualification", "experience", "photo_url",
    "short_intro", "full_message", "email", "phone", "resume_pdf",
    "display_order", "is_active", "published",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (updates.name) updates.name = String(updates.name).trim();

  const { data, error } = await access.supabase
    .from("department_hods")
    .update(updates)
    .eq("id", hodId)
    .select("*")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "HOD not found." }, { status: 404 });
  return Response.json(data);
}

/** DELETE /api/departments/[id]/hod?hodId=xxx */
export async function DELETE(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const hodId = url.searchParams.get("hodId");
  if (!hodId) return Response.json({ error: "hodId required." }, { status: 400 });

  const { error } = await access.supabase
    .from("department_hods")
    .delete()
    .eq("id", hodId);

  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
