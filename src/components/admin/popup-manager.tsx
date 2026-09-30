"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PopupBannerModal } from "@/components/popup-banner-modal";
import { getInstitutionDate } from "@/lib/popup-banner-date";
import type { PopupBanner } from "@/lib/popup-banners";
import "@/app/admin/campus-content-admin.css";
import "@/app/admin/popup-manager.css";

type PopupDraft = {
  title: string;
  image_url: string;
  redirect_url: string;
  open_new_tab: boolean;
  start_date: string;
  end_date: string;
  is_active: boolean;
  published: boolean;
};

const emptyDraft: PopupDraft = {
  title: "",
  image_url: "",
  redirect_url: "",
  open_new_tab: false,
  start_date: "",
  end_date: "",
  is_active: true,
  published: false,
};

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

function formatDate(value: string | null) {
  if (!value) return "No limit";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function stateFor(banner: PopupBanner, today: string) {
  if (!banner.is_active) return "Inactive";
  if (!banner.published) return "Unpublished";
  if (banner.start_date && banner.start_date > today) return "Scheduled";
  if (banner.end_date && banner.end_date < today) return "Expired";
  return "Live";
}

function draftFrom(banner?: PopupBanner): PopupDraft {
  if (!banner) return { ...emptyDraft };
  return {
    title: banner.title,
    image_url: banner.image_url,
    redirect_url: banner.redirect_url ?? "",
    open_new_tab: banner.open_new_tab,
    start_date: banner.start_date ?? "",
    end_date: banner.end_date ?? "",
    is_active: banner.is_active,
    published: banner.published,
  };
}

export function PopupManager() {
  const [items, setItems] = useState<PopupBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PopupBanner | null | undefined>(undefined);
  const [draft, setDraft] = useState<PopupDraft>({ ...emptyDraft });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PopupBanner | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const today = getInstitutionDate();

  useEffect(() => {
    let cancelled = false;
    api<{ items: PopupBanner[] }>("/api/popup-banners?drafts=true", { cache: "no-store" })
      .then(({ items: nextItems }) => {
        if (!cancelled) setItems(nextItems);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load popup banners.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openEditor(item?: PopupBanner) {
    setDraft(draftFrom(item));
    setMessage(null);
    setEditing(item ?? null);
  }

  function updateDraft<K extends keyof PopupDraft>(field: K, value: PopupDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setMessage(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const result = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
      updateDraft("image_url", result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.start_date && draft.end_date && draft.start_date > draft.end_date) {
      setMessage("End date must be on or after the start date.");
      return;
    }

    setSaving(true);
    setMessage(null);
    const payload = {
      ...draft,
      redirect_url: draft.redirect_url.trim() || null,
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
    };
    try {
      if (editing) {
        await api(`/api/popup-banners/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/api/popup-banners", { method: "POST", body: JSON.stringify(payload) });
      }
      const result = await api<{ items: PopupBanner[] }>("/api/popup-banners?drafts=true", { cache: "no-store" });
      setItems(result.items);
      setEditing(undefined);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save popup.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: PopupBanner, field: "is_active" | "published") {
    try {
      const result = await api<{ item: PopupBanner }>(`/api/popup-banners/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: !item[field] }),
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? result.item : entry));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update popup.");
    }
  }

  async function remove(item: PopupBanner) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await api(`/api/popup-banners/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete popup.");
    }
  }

  function previewDraft() {
    if (!draft.image_url) return;
    setPreview({
      id: editing?.id ?? "preview",
      title: draft.title.trim() || "Popup preview",
      image_url: draft.image_url,
      redirect_url: draft.redirect_url.trim() || null,
      open_new_tab: draft.open_new_tab,
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
      is_active: draft.is_active,
      published: draft.published,
      created_at: editing?.created_at ?? new Date().toISOString(),
    });
  }

  const query = search.trim().toLowerCase();
  const visibleItems = items.filter((item) =>
    `${item.title} ${item.redirect_url ?? ""}`.toLowerCase().includes(query),
  );

  return (
    <div className="campus-cms-layout popup-manager-layout">
      <aside className="campus-cms-sidebar">
        <Link className="campus-cms-brand" href="/secure-institute-management/dashboard"><span>SG</span><strong>SANJEEVAN<br /><small>ADMINISTRATION</small></strong></Link>
        <span className="campus-cms-nav-label">CONTENT MANAGEMENT</span>
        <nav aria-label="Admin navigation">
          <Link href="/secure-institute-management/leadership">Leadership Manager</Link>
          <Link href="/secure-institute-management/news">News Manager</Link>
          <Link href="/secure-institute-management/events">Event Manager</Link>
          <Link href="/secure-institute-management/downloads">Download Manager</Link>
          <Link href="/secure-institute-management/departments">Department Manager</Link>
          <Link href="/secure-institute-management/navigation">Navigation Manager</Link>
          <Link href="/secure-institute-management/hero">Hero Content Manager</Link>
          <Link className="is-current" href="/secure-institute-management/popup-manager">Popup Manager</Link>
        </nav>
        <Link className="campus-cms-back" href="/">View website</Link>
      </aside>

      <main className="campus-cms-main">
        <header className="campus-cms-topbar"><span>CMS / Popup Manager</span><span>Supabase connected</span></header>
        <div className="campus-cms-content">
          <div className="campus-cms-heading">
            <div><span>HOMEPAGE CONTENT</span><h1>Popup Manager</h1><p>Manage the welcome image shown to homepage visitors.</p></div>
            <button className="campus-cms-primary" type="button" onClick={() => openEditor()}><Plus size={16} /> Add popup</button>
          </div>

          {message && <p className="campus-cms-message" role="status">{message}</p>}

          <section className="campus-cms-panel" aria-label="Popup banners">
            <div className="campus-cms-toolbar">
              <label className="campus-cms-search"><ImageIcon size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search popups..." /></label>
              <span>{visibleItems.length} {visibleItems.length === 1 ? "popup" : "popups"}</span>
            </div>
            {loading ? <div className="campus-cms-loading"><LoaderCircle size={18} className="campus-cms-spin" /> Loading popups...</div> : visibleItems.length ? (
              <div className="popup-manager-list">
                {visibleItems.map((item) => {
                  const state = stateFor(item, today);
                  return (
                    <article className="popup-manager-row" key={item.id}>
                      <Image className="popup-manager-thumbnail" src={item.image_url} alt="" width={144} height={96} unoptimized />
                      <div className="popup-manager-row-copy">
                        <strong>{item.title}</strong>
                        <small>{formatDate(item.start_date)} – {formatDate(item.end_date)}</small>
                        <span className={`popup-manager-state is-${state.toLowerCase()}`}>{state}</span>
                      </div>
                      <div className="popup-manager-toggles">
                        <label><input type="checkbox" checked={item.is_active} onChange={() => void toggle(item, "is_active")} /><span>Active</span></label>
                        <label><input type="checkbox" checked={item.published} onChange={() => void toggle(item, "published")} /><span>Published</span></label>
                      </div>
                      <div className="popup-manager-actions">
                        <button type="button" title="Preview popup" aria-label={`Preview ${item.title}`} onClick={() => setPreview(item)}><Eye size={16} /></button>
                        <button type="button" title="Edit popup" aria-label={`Edit ${item.title}`} onClick={() => openEditor(item)}><Pencil size={16} /></button>
                        <button type="button" className="is-danger" title="Delete popup" aria-label={`Delete ${item.title}`} onClick={() => void remove(item)}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="campus-cms-empty"><ImageIcon size={24} /><strong>{query ? "No matching popups" : "No popups yet"}</strong><span>{query ? "Try another search." : "Add a welcome image to display on the homepage."}</span></div>
            )}
          </section>
        </div>
      </main>

      {editing !== undefined && (
        <div className="campus-cms-overlay popup-manager-overlay" onMouseDown={(event) => event.target === event.currentTarget && !saving && !uploading && setEditing(undefined)}>
          <form className="campus-cms-editor popup-manager-editor" onSubmit={save}>
            <header><div><span>HOMEPAGE WELCOME POPUP</span><h2>{editing ? "Edit popup" : "Add popup"}</h2></div><button type="button" className="campus-cms-icon-button" aria-label="Close editor" onClick={() => !saving && !uploading && setEditing(undefined)}><X size={18} /></button></header>
            <div className="campus-cms-editor-body">
              <div className="campus-cms-fields">
                <label className="is-full">Popup title<input required maxLength={160} value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></label>
                <label className="is-full">Popup image
                  <span className="campus-cms-upload-field">
                    <input type="url" required value={draft.image_url} onChange={(event) => updateDraft("image_url", event.target.value)} placeholder="https://..." />
                    <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle size={15} className="campus-cms-spin" /> : <Upload size={15} />} Upload</button>
                    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ""; }} />
                  </span>
                  <small className="popup-manager-field-help">JPEG, PNG, or WebP. Uploads use the existing Supabase page-assets bucket.</small>
                </label>
                {draft.image_url && <div className="popup-manager-image-preview"><Image src={draft.image_url} alt="Popup image preview" width={480} height={240} unoptimized /></div>}
                <label className="is-full">Redirect link (optional)<input type="text" value={draft.redirect_url} onChange={(event) => updateDraft("redirect_url", event.target.value)} placeholder="https://... or /admission" /></label>
                <label>Start date<input type="date" max={draft.end_date || undefined} value={draft.start_date} onChange={(event) => updateDraft("start_date", event.target.value)} /></label>
                <label>End date<input type="date" min={draft.start_date || undefined} value={draft.end_date} onChange={(event) => updateDraft("end_date", event.target.value)} /></label>
              </div>
              <div className="campus-cms-switches popup-manager-switches">
                <label><input type="checkbox" checked={draft.open_new_tab} onChange={(event) => updateDraft("open_new_tab", event.target.checked)} /><span><strong>Open redirect in new tab</strong><small>Only applies when a redirect link is set.</small></span></label>
                <label><input type="checkbox" checked={draft.is_active} onChange={(event) => updateDraft("is_active", event.target.checked)} /><span><strong>Active</strong><small>Allow this popup to display during its date range.</small></span></label>
                <label><input type="checkbox" checked={draft.published} onChange={(event) => updateDraft("published", event.target.checked)} /><span><strong>Published</strong><small>Make this popup eligible for the homepage.</small></span></label>
              </div>
              {message && <p className="campus-cms-message" role="alert">{message}</p>}
            </div>
            <footer>
              <button className="campus-cms-secondary" type="button" onClick={previewDraft} disabled={!draft.image_url}><Eye size={15} /> Preview</button>
              <span className="popup-manager-footer-spacer" />
              <button className="campus-cms-secondary" type="button" onClick={() => setEditing(undefined)} disabled={saving || uploading}>Cancel</button>
              <button className="campus-cms-primary" type="submit" disabled={saving || uploading}>{saving ? <LoaderCircle size={15} className="campus-cms-spin" /> : <Save size={15} />} Save popup</button>
            </footer>
          </form>
        </div>
      )}

      <PopupBannerModal banner={preview} onClose={() => setPreview(null)} />
    </div>
  );
}