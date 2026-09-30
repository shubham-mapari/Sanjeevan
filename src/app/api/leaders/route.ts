import type { RichDocument } from "@/lib/navigation-types";
import type { LeaderDesignation } from "@/lib/leaders-data";
import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const designations: LeaderDesignation[] = ["Chairman", "Joint Secretary", "Principal"];
const emptyMessage: RichDocument = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

function isRichDocument(value: unknown): value is RichDocument {
  return !!value && typeof value === "object" && (value as RichDocument).type === "doc";
}

export async function GET(request: Request) {
  const drafts = new URL(request.url).searchParams.get("drafts") === "true";
  let supabase;

  if (drafts) {
    const access = await requireNavigationAdmin();
    if (access.response) return access.response;
    supabase = access.supabase;
  } else {
    supabase = await createSupabaseServerClient();
  }

  if (!supabase) return Response.json({ leaders: [], tableReady: false });

  const query = supabase.from("leaders").select("*").order("display_order", { ascending: true });
  const { data, error } = drafts
    ? await query
    : await query.eq("is_active", true).eq("published", true);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ leaders: data ?? [], tableReady: true });
}

export async function POST(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    !designations.includes(body.designation) ||
    typeof body.photo_url !== "string" ||
    !body.photo_url.trim() ||
    typeof body.message_title !== "string" ||
    !body.message_title.trim() ||
    !isRichDocument(body.message)
  ) {
    return Response.json({ error: "Name, designation, photo, message title, and welcome message are required." }, { status: 400 });
  }

  const payload = {
    name: body.name.trim(),
    designation: body.designation,
    photo_url: body.photo_url.trim(),
    message_title: body.message_title.trim(),
    message: body.message ?? emptyMessage,
    signature_url: typeof body.signature_url === "string" && body.signature_url.trim() ? body.signature_url.trim() : null,
    email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : null,
    display_order: Number.isInteger(body.display_order) ? body.display_order : 0,
    is_active: body.is_active ?? true,
    published: body.published ?? false,
  };

  const { data, error } = await access.supabase.from("leaders").insert(payload).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ leader: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const leaders = body?.leaders as { id: string; display_order: number }[] | undefined;
  if (!Array.isArray(leaders) || leaders.length === 0 || leaders.some((leader) =>
    typeof leader.id !== "string" || !Number.isInteger(leader.display_order)
  )) {
    return Response.json({ error: "A valid ordered list of leaders is required." }, { status: 400 });
  }

  const results = await Promise.all(leaders.map(({ id, display_order }) =>
    access.supabase.from("leaders").update({ display_order }).eq("id", id)
  ));
  const failed = results.find((result) => result.error);
  if (failed?.error) return Response.json({ error: failed.error.message }, { status: 400 });
  return Response.json({ ok: true });
}