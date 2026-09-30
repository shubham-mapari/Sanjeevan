import type { NavigationItem } from "@/lib/navigation-types";

export function buildNavigationTree(items: NavigationItem[]): NavigationItem[] {
  const nodes = new Map(
    items.map((item) => [
      item.id,
      {
        ...item,
        parent_id: item.parent_id ?? null,
        level: item.level ?? 1,
        icon: item.icon ?? null,
        children: [] as NavigationItem[],
      },
    ]),
  );
  const roots: NavigationItem[] = [];

  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : null;
    if (parent && parent.menu_id === node.menu_id) parent.children.push(node);
    else roots.push(node);
  }

  const sortTree = (siblings: NavigationItem[]) => {
    siblings.sort((left, right) => left.sort_order - right.sort_order);
    siblings.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);
  return roots;
}

export function flattenNavigationItems(items: NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => [item, ...flattenNavigationItems(item.children)]);
}
