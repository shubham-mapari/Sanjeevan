import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/departments/[id]/faculty */
export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const url = new URL(request.url);
  const drafts = url.searchParams.get("drafts") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ faculty: [] });

  let q = supabase
    .from("department_faculty")
    .select("*")
    .eq("department_id", id)
    .order("display_order");

  if (!drafts) q = q.eq("published", true).eq("is_active", true);

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ faculty: data ?? [] });
}

/** POST /api/departments/[id]/faculty — add member */
export async function POST(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.name?.trim()) {
    return Response.json({ error: "Faculty name is required." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from("department_faculty")
    .insert({
      department_id: id,
      name: body.name.trim(),
      designation: body.designation || null,
      qualification: body.qualification || null,
      experience: body.experience || null,
      specialization: body.specialization || null,
      photo_url: body.photo_url || null,
      email: body.email || null,
      phone: body.phone || null,
      short_bio: body.short_bio || null,
      full_bio: body.full_bio ?? null,
      resume_pdf: body.resume_pdf || null,
      research_info: body.research_info || null,
      publications: body.publications || null,
      display_order: Number(body.display_order ?? 0),
      is_active: body.is_active ?? true,
      published: body.published ?? true,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

/** PATCH /api/departments/[id]/faculty — bulk reorder */
export async function PATCH(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const items: { id: string; display_order: number }[] = body?.items ?? [];
  if (!items.length) return Response.json({ error: "Provide items array." }, { status: 400 });

  const results = await Promise.all(
    items.map(({ id, display_order }) =>
      access.supabase.from("department_faculty").update({ display_order }).eq("id", id),
    ),
  );
  const failure = results.find((r) => r.error)?.error;
  return failure
    ? Response.json({ error: failure.message }, { status: 400 })
    : Response.json({ ok: true });
}

/** PUT /api/departments/[id]/faculty?memberId=xxx */
export async function PUT(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) return Response.json({ error: "memberId required." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body." }, { status: 400 });

  const fields = [
    "name", "designation", "qualification", "experience", "specialization",
    "photo_url", "email", "phone", "short_bio", "full_bio",
    "resume_pdf", "research_info", "publications", "display_order",
    "is_active", "published",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (updates.name) updates.name = String(updates.name).trim();

  const { data, error } = await access.supabase
    .from("department_faculty")
    .update(updates)
    .eq("id", memberId)
    .select("*")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Faculty member not found." }, { status: 404 });
  return Response.json(data);
}

/** DELETE /api/departments/[id]/faculty?memberId=xxx */
export async function DELETE(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) return Response.json({ error: "memberId required." }, { status: 400 });

  const { error } = await access.supabase
    .from("department_faculty")
    .delete()
    .eq("id", memberId);

  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
