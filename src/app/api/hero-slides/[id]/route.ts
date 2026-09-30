import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/* GET /api/hero-slides/[id] */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

/* PATCH /api/hero-slides/[id] */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  let { data, error } = await supabase
    .from("hero_slides")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  // Gracefully fallback if image_ratio column does not exist yet in Supabase schema
  if (error && error.message?.includes("image_ratio")) {
    const fallbackBody = { ...body };
    delete fallbackBody.image_ratio;
    const retry = await supabase
      .from("hero_slides")
      .update(fallbackBody)
      .eq("id", id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

/* DELETE /api/hero-slides/[id] */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
