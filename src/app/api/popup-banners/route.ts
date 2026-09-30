import { requireNavigationAdmin } from "@/lib/supabase/admin";
import { getPublishedPopupBanner } from "@/lib/popup-banners";
import { validatePopupBannerPayload } from "@/lib/popup-banner-validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const drafts = new URL(request.url).searchParams.get("drafts") === "true";
  if (!drafts) {
    return Response.json({ item: await getPublishedPopupBanner() });
  }

  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { data, error } = await access.supabase
    .from("popup_banners")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  const validated = validatePopupBannerPayload(body);
  if (validated.error) return Response.json({ error: validated.error }, { status: 400 });

  const { data, error } = await access.supabase
    .from("popup_banners")
    .insert(validated.payload ?? {})
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ item: data }, { status: 201 });
}