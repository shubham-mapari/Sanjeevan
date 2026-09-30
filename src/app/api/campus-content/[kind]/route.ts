import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { getPublishedContent, type ContentKind } from "@/lib/campus-content";
import { validateContentPayload } from "@/lib/campus-content-validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ kind: string }> };
const kinds: ContentKind[] = ["news", "events", "downloads"];

function isContentKind(value: string): value is ContentKind {
  return kinds.includes(value as ContentKind);
}

export async function GET(request: Request, { params }: Context) {
  const { kind } = await params;
  if (!isContentKind(kind)) return Response.json({ error: "Unknown content type." }, { status: 404 });

  const drafts = new URL(request.url).searchParams.get("drafts") === "true";
  if (!drafts) {
    const items = await getPublishedContent(kind);
    return Response.json({ items, tableReady: true });
  }

  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { data, error } = await access.supabase
    .from(kind)
    .select("*")
    .order("display_order", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data ?? [], tableReady: true });
}

export async function POST(request: Request, { params }: Context) {
  const { kind } = await params;
  if (!isContentKind(kind)) return Response.json({ error: "Unknown content type." }, { status: 404 });
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const validated = validateContentPayload(kind, body);
  if (validated.error) return Response.json({ error: validated.error }, { status: 400 });

  const { data, error } = await access.supabase
    .from(kind)
    .insert(validated.payload ?? {})
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Context) {
  const { kind } = await params;
  if (!isContentKind(kind)) return Response.json({ error: "Unknown content type." }, { status: 404 });
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const items = (body as { items?: unknown } | null)?.items;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some((item) =>
      !item ||
      typeof item.id !== "string" ||
      !Number.isInteger(item.display_order) ||
      item.display_order < 0
    )
  ) {
    return Response.json({ error: "Provide an ordered list of content items." }, { status: 400 });
  }

  const results = await Promise.all(items.map(({ id, display_order }) =>
    access.supabase.from(kind).update({ display_order }).eq("id", id)
  ));
  const failed = results.find((result) => result.error);
  if (failed?.error) return Response.json({ error: failed.error.message }, { status: 400 });
  return Response.json({ ok: true });
}