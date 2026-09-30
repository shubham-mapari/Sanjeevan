"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Italic,
  LoaderCircle,
  List,
  ListOrdered,
  Link2,
  Pencil,
  Plus,
  Quote,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { RichContent } from "@/components/rich-content";
import type { RichDocument } from "@/lib/navigation-types";
import type { QuickLink } from "@/lib/quick-links-data";
import "./quick-links-admin.css";

const EMPTY_DESCRIPTION: RichDocument = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

type QuickLinkDraft = {
  title: string;
  category: string;
  thumbnail_url: string;
  slug: string;
  short_description: string;
  full_description: RichDocument;
  gallery_images: string[];
  pdf_url: string;
  display_order: number;
  is_active: boolean;
  published: boolean;
};

const emptyDraft = (): QuickLinkDraft => ({
  title: "",
  category: "",
  thumbnail_url: "",
  slug: "",
  short_description: "",
  full_description: EMPTY_DESCRIPTION,
  gallery_images: [],
  pdf_url: "",
  display_order: 0,
  is_active: true,
  published: false,
});

function toDraft(item: QuickLink): QuickLinkDraft {
  return {
    title: item.title,
    category: item.category,
    thumbnail_url: item.thumbnail_url,
    slug: item.slug,
    short_description: item.short_description,
    full_description: item.full_description ?? EMPTY_DESCRIPTION,
    gallery_images: (item.quick_link_gallery ?? [])
      .sort((left, right) => left.display_order - right.display_order)
      .map((image) => image.image_url),
    pdf_url: item.pdf_url ?? "",
    display_order: item.display_order,
    is_active: item.is_active,
    published: item.published,
  };
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result as T;
}

function QuickLinkPreview({ draft, onClose }: { draft: QuickLinkDraft; onClose: () => void }) {
  return (
    <div className="quick-links-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="quick-links-preview" role="dialog" aria-modal="true" aria-labelledby="quick-links-preview-title">
        <button className="quick-links-icon-button quick-links-preview-close" type="button" aria-label="Close preview" onClick={onClose}><X size={18} /></button>
        {draft.thumbnail_url && <Image className="quick-links-preview-hero" src={draft.thumbnail_url} alt="" width={1200} height={500} unoptimized />}
        <div className="quick-links-preview-body">
          {draft.category && <span className="quick-links-category">{draft.category}</span>}
          <h2 id="quick-links-preview-title">{draft.title || "Untitled quick link"}</h2>
          {draft.short_description && <p className="quick-links-preview-summary">{draft.short_description}</p>}
          <RichContent document={draft.full_description} />
          {!!draft.gallery_images.length && <div className="quick-links-preview-gallery">{draft.gallery_images.map((url, index) => <Image key={`${url}-${index}`} src={url} alt={`${draft.title} gallery ${index + 1}`} width={320} height={210} unoptimized />)}</div>}
          {draft.pdf_url && <a className="quick-links-pdf-link" href={draft.pdf_url} target="_blank" rel="noreferrer">Download PDF</a>}
        </div>
      </section>
    </div>
  );
}

function QuickLinkEditor({
  item,
  onClose,
  onSave,
}: {
  item: QuickLink | null;
  onClose: () => void;
  onSave: (draft: QuickLinkDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<QuickLinkDraft>(item ? toDraft(item) : emptyDraft());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const thumbnailInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit],
    content: draft.full_description,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) =>
      setDraft((currentDraft) => ({
        ...currentDraft,
        full_description: current.getJSON() as RichDocument,
      })),
  });

  async function uploadFiles(files: File[], target: "thumbnail" | "gallery" | "pdf") {
    setUploading(target);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed.");
        urls.push(result.url as string);
      }
      if (target === "thumbnail") setDraft((current) => ({ ...current, thumbnail_url: urls[0] ?? current.thumbnail_url }));
      else if (target === "pdf") setDraft((current) => ({ ...current, pdf_url: urls[0] ?? current.pdf_url }));
      else setDraft((current) => ({ ...current, gallery_images: [...current.gallery_images, ...urls] }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save quick link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="quick-links-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="quick-links-editor" onSubmit={submit}>
        <header className="quick-links-editor-header">
          <div><span>HOMEPAGE QUICK LINKS</span><h2>{item ? "Edit item" : "Add item"}</h2></div>
          <button className="quick-links-icon-button" type="button" aria-label="Close editor" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="quick-links-editor-body">
          <div className="quick-links-form-grid">
            <label>Title<input required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} placeholder="Campus View" /></label>
            <label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Campus" /></label>
            <label>Page slug<input required value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} placeholder="campus-view" /></label>
            <label>Display order<input type="number" min="0" step="1" value={draft.display_order} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} /></label>
            <label className="quick-links-full-field">Thumbnail image URL
              <span className="quick-links-upload-field"><input required value={draft.thumbnail_url} onChange={(event) => setDraft({ ...draft, thumbnail_url: event.target.value })} placeholder="Paste an image URL or upload a thumbnail" /><button type="button" onClick={() => thumbnailInput.current?.click()} disabled={uploading !== null}>{uploading === "thumbnail" ? <LoaderCircle size={15} className="quick-links-spin" /> : <Upload size={15} />} Upload</button><input ref={thumbnailInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFiles([file], "thumbnail"); event.target.value = ""; }} /></span>
              {draft.thumbnail_url && <Image className="quick-links-thumb-preview" src={draft.thumbnail_url} alt="Thumbnail preview" width={160} height={92} unoptimized />}
            </label>
            <label className="quick-links-full-field">Short description<textarea rows={2} maxLength={240} value={draft.short_description} onChange={(event) => setDraft({ ...draft, short_description: event.target.value })} placeholder="A short introduction" /></label>
            <label className="quick-links-full-field">Full description
              <div className="quick-links-rich-editor">
                <div className="quick-links-editor-toolbar" aria-label="Text formatting">
                  <button type="button" title="Bold" aria-label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={15} /></button>
                  <button type="button" title="Italic" aria-label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={15} /></button>
                  <button type="button" title="Bulleted list" aria-label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={15} /></button>
                  <button type="button" title="Numbered list" aria-label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></button>
                  <button type="button" title="Quote" aria-label="Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={15} /></button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </label>
            <label className="quick-links-full-field">Gallery images
              <span className="quick-links-upload-field"><input readOnly value={`${draft.gallery_images.length} image${draft.gallery_images.length === 1 ? "" : "s"} selected`} /><button type="button" onClick={() => galleryInput.current?.click()} disabled={uploading !== null}>{uploading === "gallery" ? <LoaderCircle size={15} className="quick-links-spin" /> : <ImageIcon size={15} />} Add images</button><input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => { const files = [...(event.target.files ?? [])]; if (files.length) void uploadFiles(files, "gallery"); event.target.value = ""; }} /></span>
              {!!draft.gallery_images.length && <span className="quick-links-gallery-list">{draft.gallery_images.map((url, index) => <span key={`${url}-${index}`}><Image src={url} alt={`Gallery image ${index + 1}`} width={80} height={56} unoptimized /><button type="button" aria-label={`Remove gallery image ${index + 1}`} onClick={() => setDraft((current) => ({ ...current, gallery_images: current.gallery_images.filter((_, imageIndex) => imageIndex !== index) }))}><X size={13} /></button></span>)}</span>}
            </label>
            <label className="quick-links-full-field">PDF attachment URL
              <span className="quick-links-upload-field"><input value={draft.pdf_url} onChange={(event) => setDraft({ ...draft, pdf_url: event.target.value })} placeholder="Optional PDF URL" /><button type="button" onClick={() => pdfInput.current?.click()} disabled={uploading !== null}>{uploading === "pdf" ? <LoaderCircle size={15} className="quick-links-spin" /> : <Upload size={15} />} Upload PDF</button><input ref={pdfInput} type="file" accept="application/pdf" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFiles([file], "pdf"); event.target.value = ""; }} /></span>
            </label>
          </div>
          <div className="quick-links-status-controls">
            <label><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /><span><strong>Active</strong><small>Include this item in the homepage slider.</small></span></label>
            <label><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /><span><strong>Published</strong><small>Make the item page visible to visitors.</small></span></label>
          </div>
          {error && <p className="quick-links-error" role="alert">{error}</p>}
        </div>
        <footer className="quick-links-editor-footer">
          <button className="quick-links-secondary" type="button" onClick={() => setPreviewing(true)}><Eye size={15} /> Preview</button>
          <span />
          <button className="quick-links-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="quick-links-primary" type="submit" disabled={saving || uploading !== null}>{saving ? <LoaderCircle size={15} className="quick-links-spin" /> : <Save size={15} />} Save item</button>
        </footer>
      </form>
      {previewing && <QuickLinkPreview draft={draft} onClose={() => setPreviewing(false)} />}
    </div>
  );
}

export default function QuickLinksAdminPage() {
  const [items, setItems] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<QuickLink | null | undefined>(undefined);
  const [previewing, setPreviewing] = useState<QuickLinkDraft | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  async function loadItems() {
    const result = await api<{ items: QuickLink[] }>("/api/quick-links?drafts=true", { cache: "no-store" });
    setItems(result.items);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    api<{ items: QuickLink[] }>("/api/quick-links?drafts=true", { cache: "no-store" })
      .then((result) => { if (!cancelled) setItems(result.items); })
      .catch((loadError: unknown) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load quick links."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function saveItem(draft: QuickLinkDraft) {
    const editingItem = editing;
    await api(editingItem ? `/api/quick-links/${editingItem.id}` : "/api/quick-links", {
      method: editingItem ? "PATCH" : "POST",
      body: JSON.stringify(draft),
    });
    setEditing(undefined);
    await loadItems();
  }

  async function updateItem(item: QuickLink, changes: Partial<QuickLinkDraft>) {
    const draft = { ...toDraft(item), ...changes };
    await api(`/api/quick-links/${item.id}`, { method: "PATCH", body: JSON.stringify(draft) });
    await loadItems();
  }

  async function deleteItem(item: QuickLink) {
    if (!window.confirm(`Delete “${item.title}”? This also removes its gallery records.`)) return;
    try {
      await api(`/api/quick-links/${item.id}`, { method: "DELETE" });
      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete quick link.");
    }
  }

  async function reorderItems(dragged: string, target: string) {
    const next = [...items];
    const from = next.findIndex((item) => item.id === dragged);
    const to = next.findIndex((item) => item.id === target);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const ordered = next.map((item, index) => ({ ...item, display_order: index }));
    setItems(ordered);
    try {
      await api("/api/quick-links", {
        method: "PATCH",
        body: JSON.stringify({ items: ordered.map(({ id, display_order }) => ({ id, display_order })) }),
      });
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "Could not save item order.");
      await loadItems();
    }
  }

  async function toggle(item: QuickLink, field: "is_active" | "published") {
    try {
      await updateItem(item, { [field]: !item[field] });
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update item status.");
    }
  }

  return (
    <main className="quick-links-admin page-wrap">
      <header className="quick-links-admin-header">
        <div><Link className="quick-links-back" href="/admin/dashboard"><ArrowLeft size={15} /> Dashboard</Link><span className="quick-links-kicker">HOMEPAGE CMS</span><h1>Quick Links Manager</h1><p>Manage the homepage sliding window and its information pages.</p></div>
        <button className="quick-links-primary" type="button" onClick={() => setEditing(null)}><Plus size={16} /> Add item</button>
      </header>
      <div className="quick-links-admin-meta"><span><Link2 size={15} /> {items.length} item{items.length === 1 ? "" : "s"}</span><Link href="/" target="_blank">Preview homepage <Eye size={14} /></Link></div>
      {error && <div className="quick-links-alert" role="alert">{error}</div>}
      <section className="quick-links-table-wrap" aria-label="Quick links">
        {loading ? <div className="quick-links-empty"><LoaderCircle className="quick-links-spin" size={20} /> Loading quick links…</div> : items.length ? (
          <table className="quick-links-table">
            <thead><tr><th>Order</th><th>Item</th><th>Category</th><th>Active</th><th>Published</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} draggable onDragStart={(event: DragEvent<HTMLTableRowElement>) => { setDraggedId(item.id); event.dataTransfer.effectAllowed = "move"; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (draggedId) void reorderItems(draggedId, item.id); setDraggedId(null); }} onDragEnd={() => setDraggedId(null)} className={draggedId === item.id ? "quick-links-dragging" : ""}>
                  <td><span className="quick-links-order"><GripVertical size={15} /> {index + 1}</span></td>
                  <td><span className="quick-links-item-cell"><Image src={item.thumbnail_url} alt="" width={68} height={48} unoptimized /><span><strong>{item.title}</strong><small>/quick-links/{item.slug}</small></span></span></td>
                  <td>{item.category || "—"}</td>
                  <td><button className={`quick-links-status ${item.is_active ? "is-on" : ""}`} type="button" aria-pressed={item.is_active} onClick={() => void toggle(item, "is_active")}>{item.is_active ? "Active" : "Inactive"}</button></td>
                  <td><button className={`quick-links-status ${item.published ? "is-on" : ""}`} type="button" aria-pressed={item.published} onClick={() => void toggle(item, "published")}>{item.published ? "Published" : "Draft"}</button></td>
                  <td><div className="quick-links-actions"><button type="button" title="Preview" aria-label={`Preview ${item.title}`} onClick={() => setPreviewing(toDraft(item))}><Eye size={15} /></button><button type="button" title="Edit" aria-label={`Edit ${item.title}`} onClick={() => setEditing(item)}><Pencil size={15} /></button><button type="button" title="Delete" aria-label={`Delete ${item.title}`} onClick={() => void deleteItem(item)}><Trash2 size={15} /></button><span className="quick-links-order-buttons"><button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0} onClick={() => { const previous = items[index - 1]; if (previous) void reorderItems(item.id, previous.id); }}><ArrowUp size={13} /></button><button type="button" aria-label={`Move ${item.title} down`} disabled={index === items.length - 1} onClick={() => { const next = items[index + 1]; if (next) void reorderItems(item.id, next.id); }}><ArrowDown size={13} /></button></span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="quick-links-empty"><Link2 size={22} /><strong>No quick links yet</strong><span>Add the first item to populate the homepage slider.</span></div>}
      </section>
      <footer className="quick-links-admin-footer"><span>Changes appear on the homepage when an item is both active and published.</span><span>Drag a row to change its order.</span></footer>
      {editing !== undefined && <QuickLinkEditor key={editing?.id ?? "new"} item={editing} onClose={() => setEditing(undefined)} onSave={saveItem} />}
      {previewing && <QuickLinkPreview draft={previewing} onClose={() => setPreviewing(null)} />}
    </main>
  );
}
