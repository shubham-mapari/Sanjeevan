"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  ListTree,
  LoaderCircle,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Sliders,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import type {
  MenuInput,
  MenuItemInput,
  NavigationItem,
  NavigationMenu,
  NavigationPage,
  RichDocument,
} from "@/lib/navigation-types";
import { flattenNavigationItems } from "@/lib/navigation-tree";
import "@/app/admin/navigation/navigation-tree.css";

const emptyDocument: RichDocument = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};
const sideItems = [
  { title: "Department Manager",   icon: BookOpen,   href: "/secure-institute-management/departments" },
  { title: "Leadership Manager",   icon: Users,      href: "/secure-institute-management/leadership" },
  { title: "Navigation Manager",   icon: ListTree,   href: "/secure-institute-management/navigation" },
  { title: "Hero Content Manager", icon: Sliders,    href: "/secure-institute-management/hero" },
  { title: "Popup Manager",        icon: ImageIcon,  href: "/secure-institute-management/popup-manager" },
];

type MenuDraft = {
  title: string;
  slug: string;
  is_visible: boolean;
  is_published: boolean;
};
type ItemDraft = {
  title: string;
  slug: string;
  parent_id: string | null;
  is_visible: boolean;
  is_published: boolean;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(result.error || `Request failed (${response.status})`);
  return result as T;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function StatusTag({
  published,
  visible,
}: {
  published: boolean;
  visible: boolean;
}) {
  const state = !visible ? "Hidden" : published ? "Published" : "Draft";
  return (
    <span
      className={`status-tag status-${!visible ? "hidden" : published ? "published" : "draft"}`}
    >
      <i />
      {state}
    </span>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={`switch ${checked ? "is-on" : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function NavigationManager() {
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuDraft, setMenuDraft] = useState<NavigationMenu | null | false>(
    false,
  );
  const [itemDraft, setItemDraft] = useState<{
    menu: NavigationMenu;
    item: NavigationItem | null;
    parentId: string | null;
  } | null>(null);
  const [pageDraft, setPageDraft] = useState<{
    menu: NavigationMenu;
    item: NavigationItem;
  } | null>(null);
  const [dragMenuId, setDragMenuId] = useState<string | null>(null);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [message, setMessage] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  async function loadMenus() {
    setLoading(true);
    try {
      const result = await api<NavigationMenu[]>(
        "/api/navigation?drafts=true",
        { cache: "no-store" },
      );
      setMenus(result);
      setMessage(null);
    } catch (error) {
      setMenus([]);
      setMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Navigation data could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api<NavigationMenu[]>("/api/navigation?drafts=true", { cache: "no-store" })
      .then((result) => {
        if (!active) return;
        setMenus(result);
        setMessage(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMenus([]);
        setMessage({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "Navigation data could not be loaded.",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      await loadMenus();
      setMessage({ kind: "success", text: success });
      return true;
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "The change could not be saved.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveMenu(draft: MenuDraft, menu: NavigationMenu | null) {
    const payload: MenuInput = {
      ...draft,
      icon: menu?.icon ?? null,
      sort_order: menu?.sort_order ?? menus.length,
    };
    const saved = await runAction(
      () =>
        api(menu ? `/api/navigation/${menu.id}` : "/api/navigation", {
          method: menu ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }),
      menu ? "Menu updated." : "Menu created.",
    );
    if (saved) setMenuDraft(false);
  }

  async function deleteMenu(menu: NavigationMenu) {
    if (!window.confirm(`Delete ΓÇ£${menu.title}ΓÇ¥ and all nested dropdown pages?`))
      return;
    await runAction(
      () => api(`/api/navigation/${menu.id}`, { method: "DELETE" }),
      "Menu and its dropdowns deleted.",
    );
  }

  async function toggleMenu(
    menu: NavigationMenu,
    field: "is_visible" | "is_published",
    value: boolean,
  ) {
    await runAction(
      () =>
        api(`/api/navigation/${menu.id}`, {
          method: "PATCH",
          body: JSON.stringify({ [field]: value }),
        }),
      "Menu status updated.",
    );
  }

  async function saveItem(
    menu: NavigationMenu,
    item: NavigationItem | null,
    draft: ItemDraft,
  ) {
    const siblings = draft.parent_id
      ? flattenNavigationItems(menu.items).find((entry) => entry.id === draft.parent_id)?.children ?? []
      : menu.items;
    const payload: MenuItemInput = {
      ...draft,
      menu_id: menu.id,
      sort_order: item?.sort_order ?? siblings.length,
    };
    const saved = await runAction(
      () =>
        api(
          item ? `/api/navigation/items/${item.id}` : "/api/navigation/items",
          {
            method: item ? "PATCH" : "POST",
            body: JSON.stringify(payload),
          },
        ),
      item ? "Dropdown updated." : "Dropdown created.",
    );
    if (saved) setItemDraft(null);
  }

  async function deleteItem(item: NavigationItem) {
    if (!window.confirm(`Delete ΓÇ£${item.title}ΓÇ¥, all nested child items, and linked page content?`)) return;
    await runAction(
      () => api(`/api/navigation/items/${item.id}`, { method: "DELETE" }),
      "Dropdown and linked page deleted.",
    );
  }

  async function reorderMenus(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const next = [...menus];
    const from = next.findIndex((menu) => menu.id === sourceId);
    const to = next.findIndex((menu) => menu.id === targetId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    const ordered = next.map((menu, index) => ({ ...menu, sort_order: index }));
    setMenus(ordered);
    await runAction(
      () =>
        api("/api/navigation", {
          method: "PATCH",
          body: JSON.stringify({
            menus: ordered.map(
              ({ id, sort_order, is_visible, is_published }) => ({
                id,
                sort_order,
                is_visible,
                is_published,
              }),
            ),
          }),
        }),
      "Navigation order saved.",
    );
  }

  async function reorderItems(
    menu: NavigationMenu,
    sourceId: string,
    targetId: string,
    parentId: string | null,
  ) {
    if (sourceId === targetId) return;
    const source = flattenNavigationItems(menu.items).find((item) => item.id === sourceId);
    const target = flattenNavigationItems(menu.items).find((item) => item.id === targetId);
    if (!source || !target || source.parent_id !== parentId || target.parent_id !== parentId) return;
    const next = parentId
      ? [...(flattenNavigationItems(menu.items).find((item) => item.id === parentId)?.children ?? [])]
      : [...menu.items];
    const from = next.findIndex((item) => item.id === sourceId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    const ordered = next.map((item, index) => ({ ...item, sort_order: index }));
    const reorderTree = (items: NavigationItem[]): NavigationItem[] => {
      if (parentId === null) return ordered;
      return items.map((item) => item.id === parentId
        ? { ...item, children: ordered }
        : { ...item, children: reorderTree(item.children) });
    };
    const reorderedTree = reorderTree(menu.items);
    setMenus((current) => current.map((row) =>
      row.id === menu.id ? { ...row, items: reorderedTree } : row,
    ));
    await runAction(
      () =>
        api("/api/navigation/items", {
          method: "PATCH",
          body: JSON.stringify({
            items: ordered.map(({ id, sort_order }) => ({ id, sort_order })),
          }),
        }),
      "Dropdown order saved.",
    );
  }

  async function publishVisible() {
    await runAction(
      () => api("/api/navigation/publish", { method: "POST" }),
      "Visible menus and dropdowns published.",
    );
  }

  const visibleMenus = menus.filter((menu) =>
    `${menu.title} ${menu.slug}`.toLowerCase().includes(query.toLowerCase()),
  );
  const totalItems = menus.reduce(
    (count, menu) => count + flattenNavigationItems(menu.items).length,
    0,
  );
  const publishedCount = menus.filter(
    (menu) => menu.is_visible && menu.is_published,
  ).length;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <span className="admin-brand-mark">S</span>
          <span>
            <strong>Sanjeevan</strong>
            <small>An autonomous engineering institute</small>
          </span>
          <PanelLeftClose size={16} />
        </Link>
        <div className="admin-workspace">
          <span className="workspace-badge">SG</span>
          <span>
            <strong>Sanjeevan Group</strong>
            <small>Institution workspace</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav aria-label="Admin navigation" className="admin-side-nav">
          {sideItems.map(({ title, icon: Icon, href }) => (
            <Link
              key={title}
              href={href}
              className={`side-link${title === "Navigation Manager" ? " active" : ""}`}
            >
              <Icon size={17} />
              <span>{title}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" className="public-site-link">
            View public website <ArrowUpRight size={14} />
          </Link>
          <div className="admin-profile">
            <span className="profile-avatar">SG</span>
            <span>
              <strong>Institute Admin</strong>
              <small>Navigation workspace</small>
            </span>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>Navigation Manager</strong>
          </div>
          <div className="topbar-actions">
            <span className="environment-tag">
              <i /> Live content
            </span>
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </button>
            <span className="topbar-avatar">SG</span>
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">CONTENT MANAGEMENT</span>
              <h1>Navigation Manager</h1>
              <p>
                Control your website menus, dropdowns and page publishing from
                one place.
              </p>
            </div>
            <button
              className="admin-primary-button"
              type="button"
              onClick={() => setMenuDraft(null)}
            >
              <Plus size={16} /> Create menu
            </button>
          </div>
          {message && (
            <div className={`admin-alert ${message.kind}`} role="status">
              <span>
                {message.kind === "error" ? (
                  <CircleHelp size={17} />
                ) : (
                  <Check size={17} />
                )}
                {message.text}
              </span>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setMessage(null)}
              >
                <X size={15} />
              </button>
            </div>
          )}
          <section className="admin-stats" aria-label="Navigation summary">
            <div>
              <span>Total menus</span>
              <strong>{menus.length.toString().padStart(2, "0")}</strong>
              <small>Top-level website navigation</small>
            </div>
            <div>
              <span>Dropdown pages</span>
              <strong>{totalItems.toString().padStart(2, "0")}</strong>
              <small>Linked content pages</small>
            </div>
            <div>
              <span>Published</span>
              <strong>{publishedCount.toString().padStart(2, "0")}</strong>
              <small>Visible to website visitors</small>
            </div>
            <div className="admin-stat-note">
              <span>Publication status</span>
              <strong>
                <i />{" "}
                {publishedCount === menus.length && menus.length > 0
                  ? "All current"
                  : "Changes pending"}
              </strong>
              <small>Publish when your menu is ready</small>
            </div>
          </section>
          <section className="manager-panel">
            <div className="panel-heading">
              <div>
                <h2>Website menus</h2>
                <p>
                  Drag rows to reorder. Expand a menu to manage its dropdown
                  pages.
                </p>
              </div>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={publishVisible}
                disabled={busy || !menus.length}
              >
                <ArrowUpRight size={15} /> Publish changes
              </button>
            </div>
            <div className="table-toolbar">
              <label className="admin-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search menus"
                  aria-label="Search menus"
                />
              </label>
              <span>{visibleMenus.length} menus</span>
              <button
                className="admin-icon-button"
                type="button"
                onClick={loadMenus}
                aria-label="Refresh menus"
              >
                <LoaderCircle size={16} className={loading ? "spinning" : ""} />
              </button>
            </div>
            <div className="menu-table-wrap">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th scope="col">Menu</th>
                    <th scope="col">Dropdown count</th>
                    <th scope="col">Visibility</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="table-empty">
                        <LoaderCircle className="spinning" size={20} /> Loading
                        navigationΓÇª
                      </td>
                    </tr>
                  ) : visibleMenus.length ? (
                    visibleMenus.map((menu) => (
                      <MenuRow
                        key={menu.id}
                        menu={menu}
                        expanded={expanded === menu.id}
                        busy={busy}
                        onExpand={() =>
                          setExpanded(expanded === menu.id ? null : menu.id)
                        }
                        onEdit={() => setMenuDraft(menu)}
                        onDelete={() => deleteMenu(menu)}
                        onAddItem={() => setItemDraft({ menu, item: null, parentId: null })}
                        onToggle={(field, value) =>
                          toggleMenu(menu, field, value)
                        }
                        onDragStart={() => setDragMenuId(menu.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (dragMenuId)
                            void reorderMenus(dragMenuId, menu.id);
                          setDragMenuId(null);
                        }}
                        onItemEdit={(item) => setItemDraft({ menu, item, parentId: item.parent_id })}
                        onAddChild={(item) => setItemDraft({ menu, item: null, parentId: item.id })}
                        expandedItemIds={expandedItemIds}
                        onToggleItemExpanded={(id) => setExpandedItemIds((current) => {
                          const next = new Set(current);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        })}
                        onItemDelete={deleteItem}
                        onPageEdit={(item) => setPageDraft({ menu, item })}
                        onItemToggle={(item, field, value) =>
                          runAction(
                            () =>
                              api(`/api/navigation/items/${item.id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ [field]: value }),
                              }),
                            "Dropdown status updated.",
                          )
                        }
                        onItemDragStart={setDragItemId}
                        onItemDrop={(itemId, parentId) => {
                          if (dragItemId)
                            void reorderItems(menu, dragItemId, itemId, parentId);
                          setDragItemId(null);
                        }}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="table-empty">
                        {message?.kind === "error"
                          ? "Connect Supabase and sign in with an admin account to load menus."
                          : "No menus yet. Create your first navigation menu."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="panel-footer">
              <span>
                <GripVertical size={14} /> Drag a row to change its position
              </span>
              <span>Menu changes appear after publishing</span>
            </div>
          </section>
          <div className="admin-footnote">
            <CircleHelp size={15} />
            <span>
              Changes are saved to Supabase. Only published, visible menus and
              pages appear on the public website.
            </span>
            <Link href="/">
              Preview website <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </main>
      {menuDraft !== false && (
        <MenuDialog
          menu={menuDraft}
          onClose={() => setMenuDraft(false)}
          onSave={saveMenu}
        />
      )}
      {itemDraft && (
        <ItemDialog
          menu={itemDraft.menu}
          item={itemDraft.item}
          items={flattenNavigationItems(itemDraft.menu.items)}
          initialParentId={itemDraft.parentId}
          onClose={() => setItemDraft(null)}
          onSave={saveItem}
        />
      )}
      {pageDraft && (
        <PageEditor
          menu={pageDraft.menu}
          item={pageDraft.item}
          onClose={() => setPageDraft(null)}
          onSaved={loadMenus}
          onError={(text) => setMessage({ kind: "error", text })}
        />
      )}
    </div>
  );
}

function NavigationTreeItem({
  item,
  expandedItemIds,
  onToggleExpanded,
  onAddChild,
  onEdit,
  onDelete,
  onPageEdit,
  onToggle,
  onDragStart,
  onDrop,
}: {
  item: NavigationItem;
  expandedItemIds: Set<string>;
  onToggleExpanded: (id: string) => void;
  onAddChild: (item: NavigationItem) => void;
  onEdit: (item: NavigationItem) => void;
  onDelete: (item: NavigationItem) => void;
  onPageEdit: (item: NavigationItem) => void;
  onToggle: (item: NavigationItem, field: "is_visible" | "is_published", value: boolean) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string, parentId: string | null) => void;
}) {
  const hasChildren = item.children.length > 0;
  const expanded = expandedItemIds.has(item.id);

  return (
    <div className="navigation-tree-node">
      <div
        className="dropdown-item-row navigation-tree-row"
        style={{ marginLeft: `${Math.max(0, item.level - 1) * 20}px` }}
        draggable
        onDragStart={() => onDragStart(item.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(item.id, item.parent_id); }}
      >
        <GripVertical size={15} className="item-grip" />
        {hasChildren ? (
          <button className="tree-expand-button" type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`} aria-expanded={expanded} onClick={() => onToggleExpanded(item.id)}>
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : <span className="tree-expand-spacer" />}
        <span className="tree-level-tag">L{item.level}</span>
        <div className="dropdown-item-name">
          <strong>{item.title}</strong>
          <small>/{item.slug}</small>
        </div>
        <StatusTag published={item.is_published && !!item.page?.published} visible={item.is_visible} />
        <Toggle checked={item.is_visible} label={`${item.is_visible ? "Hide" : "Show"} ${item.title}`} onChange={(value) => onToggle(item, "is_visible", value)} />
        <Toggle checked={item.is_published} label={`${item.is_published ? "Unpublish" : "Publish"} ${item.title}`} onChange={(value) => onToggle(item, "is_published", value)} />
        {item.level < 3 && <button className="row-action" type="button" onClick={() => onAddChild(item)}><Plus size={13} /> Add child</button>}
        <button className="row-action" type="button" onClick={() => onPageEdit(item)}><FileText size={14} /> {item.page ? "Edit page" : "Add page"}</button>
        <button className="row-action" type="button" onClick={() => onEdit(item)}><Pencil size={14} /> Edit</button>
        <button className="action-more" type="button" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item)}><Trash2 size={14} /></button>
      </div>
      {hasChildren && expanded && (
        <div className="navigation-tree-children">
          {item.children.map((child) => (
            <NavigationTreeItem
              key={child.id}
              item={child}
              expandedItemIds={expandedItemIds}
              onToggleExpanded={onToggleExpanded}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onPageEdit={onPageEdit}
              onToggle={onToggle}
              onDragStart={onDragStart}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuRow(props: {
  menu: NavigationMenu;
  expanded: boolean;
  busy: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onToggle: (field: "is_visible" | "is_published", value: boolean) => void;
  onDragStart: () => void;
  onDragOver: (event: DragEvent) => void;
  onDrop: () => void;
  onItemEdit: (item: NavigationItem) => void;
  onAddChild: (item: NavigationItem) => void;
  expandedItemIds: Set<string>;
  onToggleItemExpanded: (id: string) => void;
  onItemDelete: (item: NavigationItem) => void;
  onPageEdit: (item: NavigationItem) => void;
  onItemToggle: (
    item: NavigationItem,
    field: "is_visible" | "is_published",
    value: boolean,
  ) => void;
  onItemDragStart: (id: string) => void;
  onItemDrop: (id: string, parentId: string | null) => void;
}) {
  const { menu } = props;
  return (
    <>
      <tr
        draggable
        onDragStart={props.onDragStart}
        onDragOver={props.onDragOver}
        onDrop={props.onDrop}
        className="menu-row"
      >
        <td>
          <div className="menu-cell">
            <button
              className="row-grip"
              type="button"
              aria-label={`Drag to reorder ${menu.title}`}
            >
              <GripVertical size={16} />
            </button>
            <button
              className="expand-row"
              type="button"
              aria-expanded={props.expanded}
              aria-label={`${props.expanded ? "Collapse" : "Expand"} ${menu.title}`}
              onClick={props.onExpand}
            >
              {props.expanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            <span className="menu-glyph">
              {menu.icon?.slice(0, 2).toUpperCase() ||
                menu.title.slice(0, 2).toUpperCase()}
            </span>
            <span className="menu-title-cell">
              <strong>{menu.title}</strong>
              <small>/{menu.slug}</small>
            </span>
          </div>
        </td>
        <td>
          <span className="count-badge">{flattenNavigationItems(menu.items).length}</span>
        </td>
        <td>
          <Toggle
            checked={menu.is_visible}
            label={`${menu.is_visible ? "Hide" : "Show"} ${menu.title}`}
            onChange={(value) => props.onToggle("is_visible", value)}
          />
        </td>
        <td>
          <StatusTag published={menu.is_published} visible={menu.is_visible} />
        </td>
        <td>
          <div className="row-actions">
            <button className="row-action" type="button" onClick={props.onEdit}>
              <Pencil size={14} /> Edit
            </button>
            <button
              className="row-action"
              type="button"
              onClick={props.onAddItem}
            >
              <Plus size={14} /> Add dropdown
            </button>
            <Link
              className="row-action"
              href={menu.slug === "home" ? "/" : `/${menu.slug}`}
              target="_blank"
            >
              <Eye size={14} /> Preview
            </Link>
            <button
              className="action-more"
              type="button"
              aria-label={`Delete ${menu.title}`}
              onClick={props.onDelete}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>
      {props.expanded && (
        <tr className="dropdown-detail-row">
          <td colSpan={5}>
            <div className="dropdown-panel">
              <div className="dropdown-panel-heading">
                <div>
                  <strong>Navigation tree</strong>
                  <span>
                    {flattenNavigationItems(menu.items).length} linked to {menu.title}
                  </span>
                </div>
                <button
                  className="admin-small-button"
                  type="button"
                  onClick={props.onAddItem}
                >
                  <Plus size={14} /> Add dropdown
                </button>
              </div>
              {menu.items.length ? (
                <div className="dropdown-list navigation-tree">
                  {menu.items.map((item) => (
                    <NavigationTreeItem
                      key={item.id}
                      item={item}
                      expandedItemIds={props.expandedItemIds}
                      onToggleExpanded={props.onToggleItemExpanded}
                      onAddChild={props.onAddChild}
                      onEdit={props.onItemEdit}
                      onDelete={props.onItemDelete}
                      onPageEdit={props.onPageEdit}
                      onToggle={props.onItemToggle}
                      onDragStart={props.onItemDragStart}
                      onDrop={props.onItemDrop}
                    />
                  ))}
                </div>
              ) : (
                <div className="dropdown-empty">
                  No dropdown pages yet. Add one to build this menu.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ModalFrame({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`admin-modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <span>{eyebrow}</span>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button
            className="admin-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function MenuDialog({
  menu,
  onClose,
  onSave,
}: {
  menu: NavigationMenu | null;
  onClose: () => void;
  onSave: (draft: MenuDraft, menu: NavigationMenu | null) => Promise<void>;
}) {
  const [title, setTitle] = useState(menu?.title ?? "");
  const [slug, setSlug] = useState(menu?.slug ?? "");
  const [visible, setVisible] = useState(menu?.is_visible ?? true);
  const [published, setPublished] = useState(menu?.is_published ?? true);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    await onSave(
      { title, slug, is_visible: visible, is_published: published },
      menu,
    );
    setSubmitting(false);
  }
  return (
    <ModalFrame
      title={menu ? "Edit menu" : "Create menu"}
      eyebrow="TOP-LEVEL NAVIGATION"
      onClose={onClose}
    >
      <form className="admin-form" onSubmit={submit}>
        <label>
          Menu name
          <input
            required
            value={title}
            onChange={(event) => {
              const value = event.target.value;
              setTitle(value);
              if (!menu) setSlug(slugify(value));
            }}
            placeholder="e.g. About Us"
          />
        </label>
        <label>
          URL slug
          <div className="slug-field">
            <span>/</span>
            <input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="about-us"
            />
          </div>
        </label>
        <div className="form-switch-row">
          <span>
            <strong>Show in navigation</strong>
            <small>Visible to visitors when published</small>
          </span>
          <Toggle
            checked={visible}
            label="Show in navigation"
            onChange={setVisible}
          />
        </div>
        <div className="form-switch-row">
          <span>
            <strong>Published</strong>
            <small>Make this menu available on the website</small>
          </span>
          <Toggle
            checked={published}
            label="Published"
            onChange={setPublished}
          />
        </div>
        <footer className="modal-actions">
          <button
            className="admin-secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="admin-primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <LoaderCircle size={15} className="spinning" />
            ) : (
              <Check size={15} />
            )}
            {menu ? "Save changes" : "Create menu"}
          </button>
        </footer>
      </form>
    </ModalFrame>
  );
}

function ItemDialog({
  menu,
  item,
  items,
  initialParentId,
  onClose,
  onSave,
}: {
  menu: NavigationMenu;
  item: NavigationItem | null;
  items: NavigationItem[];
  initialParentId: string | null;
  onClose: () => void;
  onSave: (
    menu: NavigationMenu,
    item: NavigationItem | null,
    draft: ItemDraft,
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [parentId, setParentId] = useState(item?.parent_id ?? initialParentId ?? "");
  const [visible, setVisible] = useState(item?.is_visible ?? true);
  const [published, setPublished] = useState(item?.is_published ?? true);
  const [submitting, setSubmitting] = useState(false);
  const excludedParentIds = new Set<string>();
  if (item) {
    const collectDescendants = (node: NavigationItem) => {
      excludedParentIds.add(node.id);
      node.children.forEach(collectDescendants);
    };
    collectDescendants(item);
  }
  const availableParents = items.filter(
    (candidate) => candidate.level < 3 && !excludedParentIds.has(candidate.id),
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return;
    }
    setSubmitting(true);
    await onSave(menu, item, {
      title,
      slug,
      parent_id: parentId || null,
      is_visible: visible,
      is_published: published,
    });
    setSubmitting(false);
  }
  return (
    <ModalFrame
      title={item ? "Edit navigation item" : initialParentId ? "Add child item" : "Add dropdown"}
      eyebrow={`UNDER ${(items.find((candidate) => candidate.id === parentId)?.title ?? menu.title).toUpperCase()}`}
      onClose={onClose}
    >
      <form className="admin-form" onSubmit={submit}>
        <label>
          Navigation title
          <input
            required
            value={title}
            onChange={(event) => {
              const value = event.target.value;
              setTitle(value);
              if (!item) setSlug(slugify(value));
            }}
            placeholder="e.g. Vision & Mission"
          />
        </label>
        <label>
          Parent item <small>Choose a top-level dropdown or change this itemΓÇÖs parent</small>
          <select value={parentId} onChange={(event) => setParentId(event.target.value)}>
            <option value="">Top-level dropdown under {menu.title}</option>
            {availableParents.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {"ΓÇö ".repeat(candidate.level)}{candidate.title} (level {candidate.level + 1})
              </option>
            ))}
          </select>
        </label>
        <label>
          Page slug
          <div className="slug-field">
            <span>/</span>
            <input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="vision-mission"
            />
          </div>
        </label>
        <div className="form-switch-row">
          <span>
            <strong>Show dropdown</strong>
            <small>Visible under its parent menu</small>
          </span>
          <Toggle
            checked={visible}
            label="Show dropdown"
            onChange={setVisible}
          />
        </div>
        <div className="form-switch-row">
          <span>
            <strong>Published</strong>
            <small>Include this item in the live menu</small>
          </span>
          <Toggle
            checked={published}
            label="Publish dropdown"
            onChange={setPublished}
          />
        </div>
        <footer className="modal-actions">
          <button
            className="admin-secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="admin-primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <LoaderCircle size={15} className="spinning" />
            ) : (
              <Check size={15} />
            )}
            {item ? "Save item" : "Create item"}
          </button>
        </footer>
      </form>
    </ModalFrame>
  );
}

function PageEditor({
  menu,
  item,
  onClose,
  onSaved,
  onError,
}: {
  menu: NavigationMenu;
  item: NavigationItem;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (text: string) => void;
}) {
  const page = item.page;
  const [title, setTitle] = useState(page?.title ?? item.title);
  const [slug, setSlug] = useState(page?.slug ?? item.slug);
  const [heroImage, setHeroImage] = useState(page?.hero_image ?? "");
  const [gallery, setGallery] = useState(page?.gallery.join("\n") ?? "");
  const [pdfFile, setPdfFile] = useState(page?.pdf_file ?? "");
  const [videoUrl, setVideoUrl] = useState(page?.video_url ?? "");
  const [ctaLabel, setCtaLabel] = useState(page?.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(page?.cta_url ?? "");
  const [seoTitle, setSeoTitle] = useState(page?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    page?.seo_description ?? "",
  );
  const [published, setPublished] = useState(page?.published ?? false);
  const [description, setDescription] = useState<RichDocument>(
    page?.description ?? emptyDocument,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorImageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: description,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) =>
      setDescription(current.getJSON() as RichDocument),
  });

  async function uploadFile(
    file: File,
    target: "hero" | "pdf" | "gallery" | "editor",
  ) {
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    try {
      const result = await api<{ url: string }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      if (target === "hero") setHeroImage(result.url);
      else if (target === "pdf") setPdfFile(result.url);
      else if (target === "editor") {
        editor
          ?.chain()
          .focus()
          .setImage({
            src: result.url,
            alt: file.name.replace(/\.[^/.]+$/, "") || "Illustration",
          })
          .run();
      } else
        setGallery((current) =>
          [current, result.url].filter(Boolean).join("\n"),
        );
    } catch (error) {
      onError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function insertImageUrl() {
    const url = window.prompt("Enter image URL (https://...):");
    if (url && url.trim()) {
      editor
        ?.chain()
        .focus()
        .setImage({ src: url.trim(), alt: "Illustration" })
        .run();
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api<NavigationPage>("/api/pages", {
        method: "POST",
        body: JSON.stringify({
          menu_item_id: item.id,
          title,
          slug,
          hero_image: heroImage || null,
          description: (editor?.getJSON() as RichDocument) ?? description,
          gallery: gallery
            .split("\n")
            .map((path) => path.trim())
            .filter(Boolean),
          pdf_file: pdfFile || null,
          video_url: videoUrl || null,
          cta_label: ctaLabel || null,
          cta_url: ctaUrl || null,
          seo_title: seoTitle || null,
          seo_description: seoDescription || null,
          published,
        }),
      });
      await onSaved();
      onClose();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Page could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame
      title={page ? "Edit page content" : "Create page content"}
      eyebrow={`${menu.title.toUpperCase()} / ${item.title.toUpperCase()}`}
      onClose={onClose}
      wide
    >
      <form className="admin-form cms-form" onSubmit={submit}>
        <div className="cms-form-grid">
          <label>
            Page title
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            URL slug
            <div className="slug-field">
              <span>/</span>
              <input
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </div>
          </label>
        </div>
        <label>
          Rich description
          <span className="field-hint">
            Format the page introduction and body content.
          </span>
          <div className="rich-editor">
            <div className="editor-toolbar">
              {[
                {
                  label: "Bold",
                  action: () => editor?.chain().focus().toggleBold().run(),
                  active: editor?.isActive("bold"),
                },
                {
                  label: "Italic",
                  action: () => editor?.chain().focus().toggleItalic().run(),
                  active: editor?.isActive("italic"),
                },
                {
                  label: "Heading",
                  action: () =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                  active: editor?.isActive("heading"),
                },
                {
                  label: "Bullet list",
                  action: () =>
                    editor?.chain().focus().toggleBulletList().run(),
                  active: editor?.isActive("bulletList"),
                },
                {
                  label: "Quote",
                  action: () =>
                    editor?.chain().focus().toggleBlockquote().run(),
                  active: editor?.isActive("blockquote"),
                },
              ].map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  title={tool.label}
                  aria-label={tool.label}
                  className={tool.active ? "tool-active" : ""}
                  onClick={tool.action}
                >
                  {tool.label === "Bold" ? (
                    <strong>B</strong>
                  ) : tool.label === "Italic" ? (
                    <em>I</em>
                  ) : tool.label === "Heading" ? (
                    "H2"
                  ) : tool.label === "Bullet list" ? (
                    "ΓÇó List"
                  ) : (
                    "Quote"
                  )}
                </button>
              ))}

              <div className="editor-toolbar-separator" />

              <input
                ref={editorImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file, "editor");
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                title="Upload photo from device"
                aria-label="Upload photo from device"
                className="editor-photo-btn"
                onClick={() => editorImageInputRef.current?.click()}
                disabled={uploading}
              >
                <ImageIcon size={13} />
                <span>{uploading ? "Uploading..." : "Add Photo"}</span>
              </button>

              <button
                type="button"
                title="Insert image from link / URL"
                aria-label="Insert image from link / URL"
                className="editor-photo-btn"
                onClick={insertImageUrl}
                disabled={uploading}
              >
                <span>Image Link</span>
              </button>
            </div>
            <EditorContent editor={editor} />
          </div>
        </label>
        <div className="cms-form-grid">
          <label>
            Hero image URL
            <input
              value={heroImage}
              onChange={(event) => setHeroImage(event.target.value)}
              placeholder="https://ΓÇª or upload an image"
            />
            <UploadField
              accept="image/png,image/jpeg,image/webp"
              busy={uploading}
              label="Upload hero image"
              onFile={(file) => uploadFile(file, "hero")}
            />
          </label>
          <label>
            PDF file URL
            <input
              value={pdfFile}
              onChange={(event) => setPdfFile(event.target.value)}
              placeholder="https://ΓÇª or upload a PDF"
            />
            <UploadField
              accept="application/pdf"
              busy={uploading}
              label="Upload PDF"
              onFile={(file) => uploadFile(file, "pdf")}
            />
          </label>
        </div>
        <div className="cms-form-grid">
          <label>
            Gallery images{" "}
            <span className="field-hint">One image URL per line.</span>
            <textarea
              rows={4}
              value={gallery}
              onChange={(event) => setGallery(event.target.value)}
              placeholder="https://image-one.jpg"
            />
            <UploadField
              accept="image/png,image/jpeg,image/webp"
              busy={uploading}
              label="Add gallery image"
              onFile={(file) => uploadFile(file, "gallery")}
            />
          </label>
          <label>
            Video URL
            <input
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://youtube.com/watch?v=ΓÇª"
            />
            <span className="field-hint">
              <Video size={13} /> Published pages show a safe external video
              link.
            </span>
          </label>
        </div>
        <div className="cms-form-grid">
          <label>
            CTA button label
            <input
              value={ctaLabel}
              onChange={(event) => setCtaLabel(event.target.value)}
              placeholder="Explore admissions"
            />
          </label>
          <label>
            CTA button URL
            <input
              value={ctaUrl}
              onChange={(event) => setCtaUrl(event.target.value)}
              placeholder="/admission"
            />
          </label>
        </div>
        <div className="seo-panel">
          <span className="seo-kicker">SEARCH PREVIEW</span>
          <div className="cms-form-grid">
            <label>
              SEO title
              <input
                maxLength={65}
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                placeholder={title}
              />
            </label>
            <label>
              SEO description
              <textarea
                rows={2}
                maxLength={160}
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                placeholder="A concise description for search engines"
              />
            </label>
          </div>
        </div>
        <div className="form-switch-row">
          <span>
            <strong>Publish page</strong>
            <small>
              Published page content is visible at /{slug || item.slug}
            </small>
          </span>
          <Toggle
            checked={published}
            label="Publish page content"
            onChange={setPublished}
          />
        </div>
        <footer className="modal-actions">
          <button
            className="admin-secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="admin-primary-button"
            type="submit"
            disabled={saving || uploading}
          >
            {saving ? (
              <LoaderCircle size={15} className="spinning" />
            ) : (
              <Check size={15} />
            )}
            {saving ? "Saving pageΓÇª" : "Save page"}
          </button>
        </footer>
      </form>
    </ModalFrame>
  );
}

function UploadField({
  accept,
  busy,
  label,
  onFile,
}: {
  accept: string;
  busy: boolean;
  label: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="upload-field">
      <input
        type="file"
        accept={accept}
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
      />
      {busy ? (
        <LoaderCircle size={14} className="spinning" />
      ) : (
        <Upload size={14} />
      )}
      {label}
    </label>
  );
}

export default function NavigationManagerPage() {
  return <NavigationManager />;
}
