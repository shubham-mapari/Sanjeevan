import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* GET /api/departments/[id] */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

/* PUT /api/departments/[id] — update department */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.short_code !== undefined) updates.short_code = body.short_code.trim().toUpperCase();
  if (body.slug !== undefined) updates.slug = body.slug.trim().toLowerCase();
  if (body.icon_url !== undefined) updates.icon_url = body.icon_url;
  if (body.hero_image !== undefined) updates.hero_image = body.hero_image;
  if (body.description !== undefined) updates.description = body.description;
  if (body.hod_name !== undefined) updates.hod_name = body.hod_name;
  if (body.hod_photo !== undefined) updates.hod_photo = body.hod_photo;
  if (body.intake !== undefined) updates.intake = body.intake;
  if (body.duration !== undefined) updates.duration = body.duration;
  if (body.display_order !== undefined) updates.display_order = Number(body.display_order);
  if (body.button_text !== undefined) updates.button_text = body.button_text;
  if (body.theme !== undefined) updates.theme = body.theme;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.published !== undefined) updates.published = Boolean(body.published);
  if (body.vision !== undefined) updates.vision = body.vision;
  if (body.mission !== undefined) updates.mission = body.mission;
  if (body.laboratories !== undefined) updates.laboratories = body.laboratories;
  if (body.faculty !== undefined) updates.faculty = body.faculty;
  if (body.syllabus !== undefined) updates.syllabus = body.syllabus;
  if (body.gallery !== undefined) updates.gallery = body.gallery;
  if (body.placements !== undefined) updates.placements = body.placements;
  if (body.contact !== undefined) updates.contact = body.contact;

  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

/* DELETE /api/departments/[id] */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
