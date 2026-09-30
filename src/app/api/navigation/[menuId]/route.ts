import { requireNavigationAdmin } from "@/lib/supabase/admin";
import type { MenuInput } from "@/lib/navigation-types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Context = { params: Promise<{ menuId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { menuId } = await params;
  const body = (await request
    .json()
    .catch(() => null)) as Partial<MenuInput> | null;
  if (
    !body ||
    (body.title !== undefined && !body.title.trim()) ||
    (body.slug !== undefined && !slugPattern.test(body.slug))
  ) {
    return Response.json(
      { error: "Menu title or slug is invalid." },
      { status: 400 },
    );
  }
  const update = {
    ...(body.title === undefined ? {} : { title: body.title.trim() }),
    ...(body.slug === undefined ? {} : { slug: body.slug }),
    ...(body.icon === undefined ? {} : { icon: body.icon || null }),
    ...(body.sort_order === undefined ? {} : { sort_order: body.sort_order }),
    ...(body.is_visible === undefined ? {} : { is_visible: body.is_visible }),
    ...(body.is_published === undefined
      ? {}
      : { is_published: body.is_published }),
  };
  const { data, error } = await access.supabase
    .from("menus")
    .update(update)
    .eq("id", menuId)
    .select("*")
    .maybeSingle();
  if (error)
    return Response.json(
      { error: error.message },
      { status: error.code === "23505" ? 409 : 400 },
    );
  if (!data)
    return Response.json({ error: "Menu not found." }, { status: 404 });
  return Response.json(data);
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { menuId } = await params;
  const { error } = await access.supabase
    .from("menus")
    .delete()
    .eq("id", menuId);
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ ok: true });
}
