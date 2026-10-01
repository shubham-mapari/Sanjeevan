"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  FileText,
  GripVertical,
  LoaderCircle,
  Pin,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { CampusContentItem, ContentKind } from "@/lib/campus-content";
import { AdminShell, type AdminSection } from "@/components/admin/admin-shell";

type Field = {
  name: string;
  label: string;
  kind?: "textarea" | "upload";
  type?: string;
  accept?: string;
  required?: boolean;
};

type Draft = Record<string, string | boolean | number | null>;

const managerConfig: Record<ContentKind, { title: string; singular: string; fields: Field[] }> = {
  news: {
    title: "News Manager",
    singular: "news item",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "category", label: "Category", required: true },
      { name: "publish_date", label: "Publish date", type: "date", required: true },
      { name: "description", label: "Short description", kind: "textarea", required: true },
      { name: "image_url", label: "Thumbnail image", kind: "upload", accept: "image/jpeg,image/png,image/webp" },
      { name: "pdf_url", label: "Related PDF", kind: "upload", accept: "application/pdf" },
    ],
  },
  events: {
    title: "Event Manager",
    singular: "event",
    fields: [
      { name: "title", label: "Event title", required: true },
      { name: "event_date", label: "Event date", type: "date", required: true },
      { name: "venue", label: "Venue", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
      { name: "banner_url", label: "Event banner", kind: "upload", accept: "image/jpeg,image/png,image/webp", required: true },
      { name: "registration_link", label: "Registration link", type: "url" },
    ],
  },
  downloads: {
    title: "Download Manager",
    singular: "download",
    fields: [
      { name: "title", label: "Document title", required: true },
      { name: "category", label: "Category", required: true },
      { name: "pdf_url", label: "PDF file", kind: "upload", accept: "application/pdf", required: true },
      { name: "file_size", label: "File size" },
    ],
  },
};


function emptyDraft(kind: ContentKind): Draft {
  const now = new Date().toISOString().slice(0, 10);
  const common = { is_new: false, is_pinned: false, published: false, display_order: 0 };
  if (kind === "news") {
    return { title: "", category: "", publish_date: now, description: "", image_url: null, pdf_url: null, ...common };
  }
  if (kind === "events") {
    return { title: "", event_date: now, venue: "", description: "", banner_url: null, registration_link: null, ...common };
  }
  return { title: "", category: "", pdf_url: null, file_size: "", ...common };
}

function asDraft(item: CampusContentItem): Draft {
  return { ...item };
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result as T;
}

export function CampusContentManager({ kind }: { kind: ContentKind }) {
  const config = managerConfig[kind];
  const [items, setItems] = useState<CampusContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CampusContentItem | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(kind));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function loadItems() {
    const result = await api<{ items: CampusContentItem[] }>(`/api/campus-content/${kind}?drafts=true`, { cache: "no-store" });
    setItems(result.items);
    setMessage(null);
  }

  useEffect(() => {
    let cancelled = false;
    api<{ items: CampusContentItem[] }>(`/api/campus-content/${kind}?drafts=true`, { cache: "no-store" })
      .then((result) => { if (!cancelled) setItems(result.items); })
      .catch((error: unknown) => { if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load items."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind]);

  function openEditor(item?: CampusContentItem) {
    setDraft(item ? asDraft(item) : emptyDraft(kind));
    setEditing(item ?? null);
  }

  function closeEditor() {
    if (saving || uploading) return;
    setEditing(undefined);
  }

  function updateDraft(field: string, value: string | boolean | number | null) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function uploadFile(field: Field, file: File) {
    setUploading(field.name);
    setMessage(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const result = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
      updateDraft(field.name, result.url);
      if (kind === "downloads") updateDraft("file_size", formatSize(file.size));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = Object.fromEntries([
      ...config.fields.map(({ name }) => [name, draft[name] ?? null]),
      ...["is_new", "is_pinned", "published", "display_order"].map((name) => [name, draft[name]]),
    ]);
    try {
      if (editing) {
        await api(`/api/campus-content/${kind}/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api(`/api/campus-content/${kind}`, { method: "POST", body: JSON.stringify(payload) });
      }
      setEditing(undefined);
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not save ${config.singular}.`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(item: CampusContentItem, field: "is_pinned" | "published") {
    try {
      const result = await api<{ item: CampusContentItem }>(`/api/campus-content/${kind}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: !item[field] }),
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? result.item : entry));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update item.");
    }
  }

  async function removeItem(item: CampusContentItem) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await api(`/api/campus-content/${kind}/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete item.");
    }
  }

  async function reorder(fromId: string, toId: string) {
    const next = [...items];
    const from = next.findIndex((item) => item.id === fromId);
    const to = next.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const previous = items;
    const ordered = next.map((item, index) => ({ ...item, display_order: index }));
    setItems(ordered);
    setDraggedId(null);
    try {
      await api(`/api/campus-content/${kind}`, {
        method: "PATCH",
        body: JSON.stringify({ items: ordered.map(({ id, display_order }) => ({ id, display_order })) }),
      });
      setMessage(null);
    } catch (error) {
      setItems(previous);
      setMessage(error instanceof Error ? error.message : "Could not reorder items.");
    }
  }

  function dropOn(event: DragEvent<HTMLElement>, id: string) {
    event.preventDefault();
    if (draggedId) void reorder(draggedId, id);
  }

  const query = search.trim().toLowerCase();
  const visibleItems = items.filter((item) =>
    [item.title, item.description, item.category, item.venue, item.file_size]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );

  return (
    <AdminShell currentSection={kind as AdminSection}>
      <main className="campus-cms-main">
        <header className="campus-cms-topbar"><span>CMS / {config.title}</span><span>Supabase connected</span></header>
        <div className="campus-cms-content">
          <div className="campus-cms-heading">
            <div><span>HOMEPAGE CONTENT</span><h1>{config.title}</h1><p>Manage, publish, and organize {kind} shown on the website.</p></div>
            <button className="campus-cms-primary" type="button" onClick={() => openEditor()}><Plus size={16} /> Add {config.singular}</button>
          </div>

          {message && <p className="campus-cms-message" role="status">{message}</p>}

          <section className="campus-cms-panel">
            <div className="campus-cms-toolbar">
              <label className="campus-cms-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${kind}...`} /></label>
              <span>{visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}</span>
            </div>
            {search && <p className="campus-cms-hint">Clear search to reorder the full list.</p>}
            {loading ? <div className="campus-cms-loading"><LoaderCircle size={18} /> Loading {kind}...</div> : visibleItems.length ? (
              <div className="campus-cms-list">
                {visibleItems.map((item) => (
                  <article
                    className="campus-cms-row"
                    key={item.id}
                    draggable={!query}
                    onDragStart={() => setDraggedId(item.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => dropOn(event, item.id)}
                    onDragEnd={() => setDraggedId(null)}
                  >
                    <span className={`campus-cms-grip${query ? " is-disabled" : ""}`} title={query ? "Clear search to reorder" : "Drag to reorder"}><GripVertical size={17} /></span>
                    <div className="campus-cms-row-copy">
                      <strong>{item.title}</strong>
                      <small>{[item.category, item.venue, item.publish_date, item.event_date, item.file_size].filter(Boolean).join(" · ")}</small>
                    </div>
                    <div className="campus-cms-badges">
                      {item.is_new && <span className="campus-cms-tag is-new">NEW</span>}
                      <span className={`campus-cms-tag${item.published ? " is-live" : ""}`}>{item.published ? "Published" : "Draft"}</span>
                    </div>
                    <div className="campus-cms-actions">
                      <button type="button" className={item.is_pinned ? "is-active" : ""} title={item.is_pinned ? "Unpin from top" : "Pin to top"} aria-label={item.is_pinned ? "Unpin from top" : "Pin to top"} onClick={() => void toggleItem(item, "is_pinned")}><Pin size={15} /></button>
                      <button type="button" className="campus-cms-edit" onClick={() => openEditor(item)}>Edit</button>
                      <button type="button" className="is-danger" title={`Delete ${item.title}`} aria-label={`Delete ${item.title}`} onClick={() => void removeItem(item)}><Trash2 size={15} /></button>
                      <label className="campus-cms-publish" title={item.published ? "Unpublish" : "Publish"}><input type="checkbox" checked={item.published} onChange={() => void toggleItem(item, "published")} /><span>{item.published ? "Live" : "Publish"}</span></label>
                    </div>
                  </article>
                ))}
              </div>
            ) : <div className="campus-cms-empty"><FileText size={23} /><strong>{query ? "No matching items" : `No ${kind} yet`}</strong><span>{query ? "Try a different search." : `Create your first ${config.singular} to get started.`}</span></div>}
          </section>
        </div>
      </main>

      {editing !== undefined && (
        <div className="campus-cms-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeEditor()}>
          <form className="campus-cms-editor" onSubmit={save}>
            <header><div><span>{config.title.toUpperCase()}</span><h2>{editing ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><button type="button" className="campus-cms-icon-button" aria-label="Close editor" onClick={closeEditor}><X size={18} /></button></header>
            <div className="campus-cms-editor-body">
              <div className="campus-cms-fields">
                {config.fields.map((field) => (
                  <label className={field.kind === "textarea" || field.kind === "upload" ? "is-full" : ""} key={field.name}>
                    {field.label}
                    {field.kind === "textarea" ? (
                      <textarea required={field.required} rows={4} value={String(draft[field.name] ?? "")} onChange={(event) => updateDraft(field.name, event.target.value)} />
                    ) : field.kind === "upload" ? (
                      <span className="campus-cms-upload-field">
                        <input required={field.required} value={String(draft[field.name] ?? "")} onChange={(event) => updateDraft(field.name, event.target.value || null)} placeholder="Upload a file or paste a URL" />
                        <button type="button" onClick={() => fileInputs.current[field.name]?.click()} disabled={uploading === field.name}>{uploading === field.name ? <LoaderCircle size={15} className="campus-cms-spin" /> : <Upload size={15} />} Upload</button>
                        <input ref={(node) => { fileInputs.current[field.name] = node; }} type="file" accept={field.accept} hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(field, file); event.target.value = ""; }} />
                      </span>
                    ) : (
                      <input required={field.required} type={field.type ?? "text"} value={String(draft[field.name] ?? "")} onChange={(event) => updateDraft(field.name, event.target.value)} />
                    )}
                  </label>
                ))}
                <label>Display order<input type="number" min="0" step="1" value={Number(draft.display_order ?? 0)} onChange={(event) => updateDraft("display_order", Number(event.target.value))} /></label>
              </div>
              <div className="campus-cms-switches">
                <label><input type="checkbox" checked={Boolean(draft.is_new)} onChange={(event) => updateDraft("is_new", event.target.checked)} /><span><strong>NEW badge</strong><small>Show the badge beside this item.</small></span></label>
                <label><input type="checkbox" checked={Boolean(draft.is_pinned)} onChange={(event) => updateDraft("is_pinned", event.target.checked)} /><span><strong>Pin to top</strong><small>Prioritize this item in public listings.</small></span></label>
                <label><input type="checkbox" checked={Boolean(draft.published)} onChange={(event) => updateDraft("published", event.target.checked)} /><span><strong>Published</strong><small>Make this item visible on the website.</small></span></label>
              </div>
              {message && <p className="campus-cms-message" role="alert">{message}</p>}
            </div>
            <footer><button className="campus-cms-secondary" type="button" onClick={closeEditor}>Cancel</button><button className="campus-cms-primary" type="submit" disabled={saving || uploading !== null}>{saving ? <LoaderCircle size={15} className="campus-cms-spin" /> : <Save size={15} />} Save {config.singular}</button></footer>
          </form>
        </div>
      )}
    </AdminShell>
  );
}