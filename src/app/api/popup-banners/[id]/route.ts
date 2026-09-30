import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { validatePopupBannerPayload } from "@/lib/popup-banner-validation";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Popup not found." }, { status: 404 });

  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const { data: existing, error: lookupError } = await access.supabase
    .from("popup_banners")
    .select("start_date,end_date")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) return Response.json({ error: lookupError.message }, { status: 500 });
  if (!existing) return Response.json({ error: "Popup not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const validated = validatePopupBannerPayload(body, { partial: true, existing });
  if (validated.error) return Response.json({ error: validated.error }, { status: 400 });

  const { data, error } = await access.supabase
    .from("popup_banners")
    .update(validated.payload ?? {})
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Popup not found." }, { status: 404 });
  return Response.json({ item: data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return Response.json({ error: "Popup not found." }, { status: 404 });

  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { data, error } = await access.supabase
    .from("popup_banners")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data) return Response.json({ error: "Popup not found." }, { status: 404 });
  return Response.json({ ok: true });
}