import type { MenuItemInput } from "@/lib/navigation-types";
import { requireNavigationAdmin } from "@/lib/supabase/admin";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const body = (await request
    .json()
    .catch(() => null)) as Partial<MenuItemInput> | null;
  if (
    !body?.menu_id ||
    !body.title?.trim() ||
    !slugPattern.test(body.slug ?? "")
  ) {
    return Response.json(
      { error: "Menu, item title, and lowercase URL slug are required." },
      { status: 400 },
    );
  }
  const parentId = body.parent_id ?? null;
  let level = 1;
  if (parentId) {
    const { data: parent, error: parentError } = await access.supabase
      .from("menu_items")
      .select("menu_id,level")
      .eq("id", parentId)
      .maybeSingle();
    if (parentError || !parent)
      return Response.json({ error: "Parent dropdown was not found." }, { status: 400 });
    if (parent.menu_id !== body.menu_id)
      return Response.json({ error: "Parent must belong to the same menu." }, { status: 400 });
    if (parent.level >= 3)
      return Response.json({ error: "Navigation supports a maximum of three levels." }, { status: 400 });
    level = parent.level + 1;
  }
  const { data, error } = await access.supabase
    .from("menu_items")
    .insert({
      menu_id: body.menu_id,
      parent_id: parentId,
      level,
      title: body.title.trim(),
      slug: body.slug,
      sort_order: Number.isInteger(body.sort_order) ? body.sort_order : 0,
      is_visible: body.is_visible ?? true,
      is_published: body.is_published ?? false,
    })
    .select("*")
    .single();
  if (error)
    return Response.json(
      { error: error.message },
      { status: error.code === "23505" ? 409 : 400 },
    );
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const body = (await request.json().catch(() => null)) as {
    items?: { id: string; sort_order: number }[];
  } | null;
  if (
    !body?.items?.length ||
    body.items.some((item) => !item.id || !Number.isInteger(item.sort_order))
  ) {
    return Response.json(
      {
        error:
          "Provide dropdown items with valid IDs and integer sort_order values.",
      },
      { status: 400 },
    );
  }
  const results = await Promise.all(
    body.items.map(({ id, sort_order }) =>
      access.supabase.from("menu_items").update({ sort_order }).eq("id", id),
    ),
  );
  const failure = results.find((result) => result.error)?.error;
  return failure
    ? Response.json({ error: failure.message }, { status: 400 })
    : Response.json({ ok: true });
}
