import { getPublishedNavigation } from "@/lib/navigation-data";
import { buildNavigationTree } from "@/lib/navigation-tree";
import type { MenuInput, NavigationItem } from "@/lib/navigation-types";
import { requireNavigationAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("drafts") !== "true") {
    return Response.json(await getPublishedNavigation(), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const { data: menus, error: menuError } = await access.supabase
    .from("menus")
    .select("*")
    .order("sort_order");
  if (menuError)
    return Response.json({ error: menuError.message }, { status: 500 });

  const menuIds = (menus ?? []).map((menu) => menu.id);
  const { data: items, error: itemError } = menuIds.length
    ? await access.supabase
        .from("menu_items")
        .select("*")
        .in("menu_id", menuIds)
        .order("sort_order")
    : { data: [], error: null };
  if (itemError)
    return Response.json({ error: itemError.message }, { status: 500 });

  const itemIds = (items ?? []).map((item) => item.id);
  const { data: pages, error: pageError } = itemIds.length
    ? await access.supabase
        .from("pages")
        .select("*")
        .in("menu_item_id", itemIds)
    : { data: [], error: null };
  if (pageError)
    return Response.json({ error: pageError.message }, { status: 500 });

  const pageByItemId = new Map(
    (pages ?? []).map((page) => [page.menu_item_id, page]),
  );
  const tree = buildNavigationTree(
    (items ?? []).map((item) => ({
      ...item,
      parent_id: item.parent_id ?? null,
      level: item.level ?? 1,
      icon: item.icon ?? null,
      page: pageByItemId.get(item.id) ?? null,
    })) as NavigationItem[],
  );
  return Response.json(
    (menus ?? []).map((menu) => ({
      ...menu,
      items: tree.filter(
        (item) => item.menu_id === menu.id && item.parent_id === null,
      ),
    })),
  );
}

export async function POST(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  let body: MenuInput;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "A valid JSON body is required." },
      { status: 400 },
    );
  }
  if (!body.title?.trim() || !slugPattern.test(body.slug ?? "")) {
    return Response.json(
      { error: "Menu title and a lowercase URL slug are required." },
      { status: 400 },
    );
  }
  const { data, error } = await access.supabase
    .from("menus")
    .insert({
      title: body.title.trim(),
      slug: body.slug,
      icon: body.icon || null,
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
    menus?: {
      id: string;
      sort_order: number;
      is_visible?: boolean;
      is_published?: boolean;
    }[];
  } | null;
  if (
    !body?.menus?.length ||
    body.menus.some((menu) => !menu.id || !Number.isInteger(menu.sort_order))
  ) {
    return Response.json(
      { error: "Provide menus with valid IDs and integer sort_order values." },
      { status: 400 },
    );
  }
  const results = await Promise.all(
    body.menus.map(({ id, sort_order, is_visible, is_published }) =>
      access.supabase
        .from("menus")
        .update({
          sort_order,
          ...(is_visible === undefined ? {} : { is_visible }),
          ...(is_published === undefined ? {} : { is_published }),
        })
        .eq("id", id),
    ),
  );
  const failure = results.find((result) => result.error)?.error;
  return failure
    ? Response.json({ error: failure.message }, { status: 400 })
    : Response.json({ ok: true });
}
