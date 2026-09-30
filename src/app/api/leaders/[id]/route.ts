import type { RichDocument } from "@/lib/navigation-types";
import type { LeaderDesignation } from "@/lib/leaders-data";
import { requireNavigationAdmin } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
const designations: LeaderDesignation[] = ["Chairman", "Joint Secretary", "Principal"];

export async function PATCH(request: Request, { params }: Context) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid leader details." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim())
      return Response.json({ error: "Full name is required." }, { status: 400 });
    update.name = body.name.trim();
  }
  if (body.designation !== undefined) {
    if (!designations.includes(body.designation))
      return Response.json({ error: "Choose a valid designation." }, { status: 400 });
    update.designation = body.designation;
  }
  for (const field of ["photo_url", "message_title"] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string" || !body[field].trim())
        return Response.json({ error: `${field === "photo_url" ? "Profile photo" : "Message title"} is required.` }, { status: 400 });
      update[field] = body[field].trim();
    }
  }
  if (body.message !== undefined) {
    if (!body.message || typeof body.message !== "object" || (body.message as RichDocument).type !== "doc")
      return Response.json({ error: "Welcome message must be a rich-text document." }, { status: 400 });
    update.message = body.message;
  }
  for (const field of ["signature_url", "email"] as const) {
    if (body[field] !== undefined) update[field] = typeof body[field] === "string" && body[field].trim() ? body[field].trim() : null;
  }
  for (const field of ["display_order", "is_active", "published"] as const) {
    if (body[field] !== undefined) update[field] = body[field];
  }

  const { id } = await params;
  const { data, error } = await access.supabase.from("leaders").update(update).eq("id", id).select("*").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Leader not found." }, { status: 404 });
  return Response.json({ leader: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { id } = await params;
  const { error } = await access.supabase.from("leaders").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}