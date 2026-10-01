import type { MenuItemInput } from "@/lib/navigation-types";
import { requireNavigationAdmin } from "@/lib/supabase/admin";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Context = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { itemId } = await params;
  const body = (await request
    .json()
    .catch(() => null)) as Partial<MenuItemInput> | null;
  if (
    !body ||
    (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) ||
    (body.slug !== undefined && (typeof body.slug !== "string" || !slugPattern.test(body.slug)))
  ) {
    return Response.json(
      { error: "Dropdown title or slug is invalid." },
      { status: 400 },
    );
  }
  const { data: current, error: currentError } = await access.supabase
    .from("menu_items")
    .select("id,menu_id,parent_id,level,sort_order")
    .eq("id", itemId)
    .maybeSingle();
  if (currentError || !current)
    return Response.json({ error: "Dropdown item not found." }, { status: 404 });
  if (body.menu_id !== undefined && body.menu_id !== current.menu_id)
    return Response.json({ error: "Change the parent within the same top-level menu." }, { status: 400 });

  const parentChanged = body.parent_id !== undefined;
  const parentId = body.parent_id === undefined ? current.parent_id : body.parent_id;
  if (parentChanged) {
    const { error: moveError } = await access.supabase.rpc("move_menu_item", {
      p_item_id: itemId,
      p_parent_id: parentId,
      p_sort_order: body.sort_order ?? current.sort_order,
    });
    if (moveError) return Response.json({ error: moveError.message }, { status: 400 });
  }

  const update = {
    ...(body.title === undefined ? {} : { title: body.title.trim() }),
    ...(body.slug === undefined ? {} : { slug: body.slug }),
    ...(!parentChanged && body.sort_order !== undefined ? { sort_order: body.sort_order } : {}),
    ...(body.is_visible === undefined ? {} : { is_visible: body.is_visible }),
    ...(body.is_published === undefined
      ? {}
      : { is_published: body.is_published }),
  };
  const { data, error } = await access.supabase
    .from("menu_items")
    .update(update)
    .eq("id", itemId)
    .select("id,menu_id,parent_id,level,title,slug,sort_order,is_visible,is_published,created_at,updated_at")
    .maybeSingle();
  if (error)
    if (parentChanged) {
      await access.supabase.rpc("move_menu_item", {
        p_item_id: itemId,
        p_parent_id: current.parent_id,
        p_sort_order: current.sort_order,
      });
    }
  if (error)
    return Response.json(
      { error: error.message },
      { status: error.code === "23505" ? 409 : 400 },
    );
  if (!data)
    return Response.json(
      { error: "Dropdown item not found." },
      { status: 404 },
    );
  return Response.json(data);
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { itemId } = await params;
  const { error } = await access.supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId);
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
