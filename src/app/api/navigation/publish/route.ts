import { requireNavigationAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const menus = await access.supabase
    .from("menus")
    .update({ is_published: true })
    .eq("is_visible", true);
  if (menus.error)
    return Response.json({ error: menus.error.message }, { status: 400 });
  const items = await access.supabase
    .from("menu_items")
    .update({ is_published: true })
    .eq("is_visible", true);
  if (items.error)
    return Response.json({ error: items.error.message }, { status: 400 });
  return Response.json({ ok: true });
}
