import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_DEPARTMENTS, type Department } from "@/lib/departments-data";

export const dynamic = "force-dynamic";

/* GET /api/departments — public returns published+active; ?drafts=true returns all for admin */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drafts = searchParams.get("drafts") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return Response.json({
      departments: drafts ? DEFAULT_DEPARTMENTS : DEFAULT_DEPARTMENTS.filter((d) => d.published && d.is_active),
      tableReady: false,
    });
  }

  let query = supabase
    .from("departments")
    .select("*")
    .order("display_order", { ascending: true });

  if (!drafts) {
    query = query.eq("published", true).eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({
      departments: drafts ? DEFAULT_DEPARTMENTS : DEFAULT_DEPARTMENTS.filter((d) => d.published && d.is_active),
      tableReady: false,
      error: error.message,
    });
  }

  return Response.json({
    departments: data ?? [],
    tableReady: true,
  });
}

/* POST /api/departments — create a new department */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.name || !body.short_code || !body.slug) {
    return Response.json(
      { error: "Department Name, Short Code, and Page Slug are required." },
      { status: 400 }
    );
  }

  const payload: Partial<Department> = {
    name: body.name.trim(),
    short_code: body.short_code.trim().toUpperCase(),
    slug: body.slug.trim().toLowerCase(),
    icon_url: body.icon_url || "cpu",
    hero_image: body.hero_image || null,
    description: body.description || null,
    hod_name: body.hod_name || null,
    hod_photo: body.hod_photo || null,
    intake: body.intake || "60 Seats",
    duration: body.duration || "4 Years / 8 Semesters",
    display_order: Number(body.display_order ?? 0),
    button_text: body.button_text || "Explore Department",
    theme: body.theme || "blue",
    is_active: body.is_active ?? true,
    published: body.published ?? true,
    vision: body.vision || null,
    mission: body.mission || null,
    laboratories: body.laboratories ?? [],
    faculty: body.faculty ?? [],
    syllabus: body.syllabus ?? [],
    gallery: body.gallery ?? [],
    placements: body.placements ?? {},
    contact: body.contact ?? {},
  };

  const { data, error } = await supabase
    .from("departments")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

/* PATCH /api/departments — bulk reorder */
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const departments: { id: string; display_order: number }[] = body.departments ?? [];

  if (!Array.isArray(departments) || departments.length === 0) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates = departments.map(({ id, display_order }) =>
    supabase.from("departments").update({ display_order }).eq("id", id)
  );

  await Promise.all(updates);
  return Response.json({ ok: true });
}
