import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; featureId: string }> };

/** POST /api/departments/[id]/features/[featureId]/documents — add document */
export async function POST(request: Request, { params }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { featureId } = await params;
  const body = await request.json().catch(() => null);

  if (!body?.file_url?.trim()) {
    return Response.json({ error: "file_url is required." }, { status: 400 });
  }
  if (!body?.display_title?.trim()) {
    return Response.json({ error: "display_title is required." }, { status: 400 });
  }

  const { data: existing } = await access.supabase
    .from("department_feature_documents")
    .select("sort_order")
    .eq("feature_id", featureId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0
    ? (existing[0].sort_order as number) + 1
    : 0;

  const { data, error } = await access.supabase
    .from("department_feature_documents")
    .insert({
      feature_id: featureId,
      display_title: body.display_title.trim(),
      file_url: body.file_url.trim(),
      file_name: body.file_name || null,
      file_type: body.file_type || null,
      file_size: body.file_size || null,
      sort_order: body.sort_order ?? nextOrder,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}

/** DELETE /api/departments/[id]/features/[featureId]/documents?docId=xxx */
export async function DELETE(request: Request, { params: _p }: Ctx) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const url = new URL(request.url);
  const docId = url.searchParams.get("docId");

  if (!docId) return Response.json({ error: "docId required." }, { status: 400 });

  const { error } = await access.supabase
    .from("department_feature_documents")
    .delete()
    .eq("id", docId);

  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
