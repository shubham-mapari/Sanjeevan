import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* GET /api/hero-slides — public fetches published only; ?drafts=true fetches all (admin) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drafts = searchParams.get("drafts") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return Response.json({
      slides: [],
      tableReady: false,
    });
  }

  let query = supabase
    .from("hero_slides")
    .select("*")
    .order("display_order", { ascending: true });

  if (!drafts) {
    query = query.eq("published", true).eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json(
      {
        slides: [],
        tableReady: false,
        error: error.message,
      },
      { status: 200 }
    );
  }

  return Response.json({
    slides: data ?? [],
    tableReady: true,
  });
}

/* POST /api/hero-slides — create a new slide */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const payload: Record<string, unknown> = {
    image_url: body.image_url,
    label: body.label || null,
    heading: body.heading,
    highlight: body.highlight || null,
    description: body.description || null,
    quote: body.quote || null,
    quote_author: body.quote_author || null,
    button_text: body.button_text || null,
    button_link: body.button_link || null,
    image_ratio: body.image_ratio || "4 / 4.5",
    display_order: body.display_order ?? 0,
    is_active: body.is_active ?? true,
    published: body.published ?? false,
  };

  let { data, error } = await supabase
    .from("hero_slides")
    .insert(payload)
    .select()
    .single();

  // Gracefully fallback if image_ratio column does not exist yet in Supabase table
  if (error && error.message?.includes("image_ratio")) {
    delete payload.image_ratio;
    const retry = await supabase
      .from("hero_slides")
      .insert(payload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

/* PATCH /api/hero-slides — bulk reorder */
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const slides: { id: string; display_order: number }[] = body.slides ?? [];

  const updates = slides.map(({ id, display_order }) =>
    supabase.from("hero_slides").update({ display_order }).eq("id", id)
  );
  await Promise.all(updates);
  return Response.json({ ok: true });
}
