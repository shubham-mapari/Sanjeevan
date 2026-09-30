import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { type ContentKind } from "@/lib/campus-content";
import { validateContentPayload } from "@/lib/campus-content-validation";

type Context = { params: Promise<{ kind: string; id: string }> };
const kinds: ContentKind[] = ["news", "events", "downloads"];

function isContentKind(value: string): value is ContentKind {
  return kinds.includes(value as ContentKind);
}

export async function PATCH(request: Request, { params }: Context) {
  const { kind, id } = await params;
  if (!isContentKind(kind)) return Response.json({ error: "Unknown content type." }, { status: 404 });
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const validated = validateContentPayload(kind, body, true);
  if (validated.error) return Response.json({ error: validated.error }, { status: 400 });
  if (!Object.keys(validated.payload ?? {}).length) {
    return Response.json({ error: "No content fields were provided." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from(kind)
    .update(validated.payload ?? {})
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Content item not found." }, { status: 404 });
  return Response.json({ item: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { kind, id } = await params;
  if (!isContentKind(kind)) return Response.json({ error: "Unknown content type." }, { status: 404 });
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { error } = await access.supabase.from(kind).delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}