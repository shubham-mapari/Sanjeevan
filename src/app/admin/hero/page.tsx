"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Eye,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  LoaderCircle,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Settings,
  Sliders,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { type HeroSlide } from "@/lib/hero-slides-data";

type SlideDraft = Omit<HeroSlide, "id" | "created_at" | "updated_at">;

const sideItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { title: "Department Manager", icon: BookOpen, href: "/admin/departments" },
  { title: "Navigation Manager", icon: ListTree, href: "/admin/navigation" },
  { title: "Hero Content Manager", icon: Sliders, href: "/admin/hero", active: true },
  { title: "Popup Manager", icon: ImageIcon, href: "/admin/popup-manager" },
  { title: "Pages", icon: BookOpen, href: "/admin/navigation" },
  { title: "Notices", icon: Bell, href: "/admin/navigation" },
  { title: "Gallery", icon: ImageIcon, href: "/admin/navigation" },
  { title: "Faculty", icon: Users, href: "/admin/navigation" },
  { title: "Placements", icon: ArrowUpRight, href: "/admin/navigation" },
  { title: "Settings", icon: Settings, href: "/admin/navigation" },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(result.error || `Request failed (${response.status})`);
  return result as T;
}

const emptyDraft: SlideDraft = {
  image_url: "",
  label: "",
  heading: "",
  highlight: "",
  description: "",
  quote: "",
  quote_author: "",
  button_text: "",
  button_link: "",
  display_order: 0,
  is_active: true,
  published: true,
  image_ratio: "4 / 4.5",
};

const MIGRATION_SQL = `-- Run this in your Supabase SQL Editor:
create table if not exists public.hero_slides (
  id            uuid        primary key default gen_random_uuid(),
  image_url     text        not null,
  label         text,
  heading       text        not null,
  highlight     text,
  description   text,
  quote         text,
  quote_author  text,
  button_text   text,
  button_link   text,
  image_ratio   text        default '4 / 4.5',
  display_order integer     not null default 0,
  is_active     boolean     not null default true,
  published     boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.hero_slides
  add column if not exists image_ratio text default '4 / 4.5';

create index if not exists hero_slides_order_idx
  on public.hero_slides(display_order, is_active, published);

create or replace function public.set_hero_slides_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hero_slides_set_updated_at on public.hero_slides;
create trigger hero_slides_set_updated_at
  before update on public.hero_slides
  for each row execute function public.set_hero_slides_updated_at();

alter table public.hero_slides enable row level security;

create policy "public read published hero slides"
  on public.hero_slides for select to anon, authenticated
  using (published = true and is_active = true);

create policy "admins read all hero slides"
  on public.hero_slides for select to authenticated
  using (public.is_navigation_admin());

create policy "admins manage hero slides"
  on public.hero_slides for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());
`;

/* ──────────────────────────────────────────
   Slide Editor Modal
────────────────────────────────────────── */
function SlideEditor({
  slide,
  onClose,
  onSave,
}: {
  slide: HeroSlide | null;
  onClose: () => void;
  onSave: (draft: SlideDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SlideDraft>(
    slide
      ? {
          image_url: slide.image_url,
          label: slide.label ?? "",
          heading: slide.heading,
          highlight: slide.highlight ?? "",
          description: slide.description ?? "",
          quote: slide.quote ?? "",
          quote_author: slide.quote_author ?? "",
          button_text: slide.button_text ?? "",
          button_link: slide.button_link ?? "",
          display_order: slide.display_order,
          is_active: slide.is_active,
          published: slide.published,
          image_ratio: slide.image_ratio ?? "4 / 4.5",
        }
      : { ...emptyDraft },
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: keyof SlideDraft, value: unknown) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ url: string }>("/api/uploads", {
        method: "POST",
        body: fd,
      });
      if (res && res.url) {
        set("image_url", res.url);
      } else {
        throw new Error("No URL returned");
      }
    } catch {
      // Fallback: Read file directly as Data URL so image upload works seamlessly without server error
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          set("image_url", e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.heading.trim()) {
      setError("Main Heading is required");
      return;
    }
    if (!draft.image_url.trim()) {
      setError("Hero Image is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Slide Editor"
    >
      <div className="admin-modal modal-wide" style={{ maxWidth: 940 }}>
        <header className="modal-header">
          <div>
            <span>HOMEPAGE SLIDER (2-SECOND AUTOPLAY)</span>
            <h2>{slide ? "Edit Hero Slide" : "New Hero Slide"}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="admin-form">
          {error && (
            <div className="admin-alert error">
              <span>
                <CircleHelp size={16} /> {error}
              </span>
            </div>
          )}

          {/* Notice about 4:4.5 ratio and 2s auto-rotation */}
          <div
            style={{
              padding: "10px 14px",
              background: "#edf4ff",
              border: "1px solid #bfdbfe",
              borderRadius: "4px",
              color: "#1e3a8a",
              fontSize: "11px",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Sliders size={16} style={{ flexShrink: 0, color: "#2563eb" }} />
            <span>
              <strong>Exact 4:4.5 Photo Ratio:</strong> Upload your photo on the left. Write your title, description & quote on the right. The homepage slider updates and changes automatically every <strong>2 seconds</strong>.
            </span>
          </div>

          {/* 2-COLUMN SPLIT: LEFT PHOTO (Exact Ratio) + RIGHT DESCRIPTION */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px", alignItems: "start" }}>
            {/* ── LEFT COLUMN: Photo Upload & Exact Frame Preview ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px", fontWeight: 700, color: "#1c2638" }}>
                <span>Slide Photo * <small style={{ color: "#718096", fontWeight: 400 }}>(Ratio: 4:4.5)</small></span>
                
                {/* Upload Button & URL input */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="admin-primary-button"
                    style={{ flex: 1, height: "36px", fontSize: "11px" }}
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <LoaderCircle size={14} className="spinning" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploading ? "Uploading…" : "Upload Photo"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "10px", color: "#64748b" }}>
                <span>Or direct image URL:</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={draft.image_url}
                  onChange={(e) => set("image_url", e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", fontSize: "11px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </label>

              {/* Photo Ratio Selector */}
              <div style={{ marginTop: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Photo Frame Ratio:
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb" }}>
                    {draft.image_ratio || "4 / 4.5"}
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  {[
                    { label: "4:4.5 (Screenshot)", val: "4 / 4.5" },
                    { label: "1:1 (Square)", val: "1 / 1" },
                    { label: "3:4 (Portrait)", val: "3 / 4" },
                    { label: "4:3 (Classic)", val: "4 / 3" },
                    { label: "16:9 (Landscape)", val: "16 / 9" },
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => set("image_ratio", r.val)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: 600,
                        borderRadius: "3px",
                        border: (draft.image_ratio || "4 / 4.5") === r.val ? "1.5px solid #2563eb" : "1px solid #d1d5db",
                        background: (draft.image_ratio || "4 / 4.5") === r.val ? "#eff6ff" : "#fff",
                        color: (draft.image_ratio || "4 / 4.5") === r.val ? "#1d4ed8" : "#374151",
                        cursor: "pointer",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}

                  {detectedRatio && detectedRatio !== draft.image_ratio && (
                    <button
                      type="button"
                      onClick={() => set("image_ratio", detectedRatio)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        borderRadius: "3px",
                        border: "1.5px dashed #10b981",
                        background: "#ecfdf5",
                        color: "#047857",
                        cursor: "pointer",
                      }}
                    >
                      ✨ Auto ({detectedRatio})
                    </button>
                  )}
                </div>

                {/* Exact Ratio Preview Frame */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: draft.image_ratio || "4 / 4.5",
                    maxHeight: "320px",
                    borderRadius: "3px",
                    overflow: "hidden",
                    background: "#091d44",
                    border: "1.5px solid #d4af37",
                    boxShadow: "0 8px 24px rgba(9, 29, 68, 0.16)",
                    transition: "aspect-ratio 0.3s ease",
                  }}
                >
                  {draft.image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.image_url}
                        alt="Preview"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          if (img.naturalWidth && img.naturalHeight) {
                            const w = img.naturalWidth;
                            const h = img.naturalHeight;
                            const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
                            const d = gcd(w, h);
                            const sw = Math.round(w / d);
                            const sh = Math.round(h / d);
                            const str = sw <= 16 && sh <= 16 ? `${sw} / ${sh}` : `${(w / h).toFixed(2)} / 1`;
                            setDetectedRatio(str);
                          }
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center",
                          display: "block",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => set("image_url", "")}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "rgba(0,0,0,0.65)",
                          color: "#fff",
                          border: 0,
                          borderRadius: "50%",
                          width: 26,
                          height: 26,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          zIndex: 5,
                        }}
                        title="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.7)",
                        padding: "20px",
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => fileRef.current?.click()}
                    >
                      <ImageIcon size={32} style={{ marginBottom: 8, color: "#d4af37" }} />
                      <strong style={{ fontSize: "12px", color: "#fff" }}>Click to Select Photo</strong>
                      <span style={{ fontSize: "10px", marginTop: 4, color: "rgba(255,255,255,0.6)" }}>
                        Frame Ratio: {draft.image_ratio || "4 / 4.5"}
                      </span>
                    </div>
                  )}

                  {/* Gold button badge preview */}
                  {draft.button_text && (
                    <div
                      style={{
                        position: "absolute",
                        right: 10,
                        bottom: 30,
                        background: "#c49b2e",
                        color: "#091d44",
                        padding: "6px 12px",
                        fontSize: "11px",
                        fontStyle: "italic",
                        fontWeight: 700,
                        fontFamily: "Georgia, serif",
                        borderRadius: "2px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        pointerEvents: "none",
                        zIndex: 4,
                      }}
                    >
                      {draft.button_text}
                    </div>
                  )}

                  {/* Caption preview */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 10,
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "8px",
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      pointerEvents: "none",
                      zIndex: 4,
                    }}
                  >
                    PANHALA · MAHARASHTRA
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Description & Text Content ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Eyebrow Label + Display Order */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "12px" }}>
                <label>
                  <span>Label / Eyebrow <small>(Appears in red above title)</small></span>
                  <input
                    placeholder="A DIFFERENT KIND OF ENGINEERING INSTITUTE"
                    value={draft.label ?? ""}
                    onChange={(e) => set("label", e.target.value)}
                  />
                </label>
                <label>
                  <span>Order <small>(#)</small></span>
                  <input
                    type="number"
                    min={0}
                    value={draft.display_order}
                    onChange={(e) => set("display_order", +e.target.value)}
                  />
                </label>
              </div>

              {/* Main Heading & Highlight */}
              <div className="cms-form-grid">
                <label>
                  <span>Main Heading *</span>
                  <input
                    required
                    placeholder="Rooted here."
                    value={draft.heading}
                    onChange={(e) => set("heading", e.target.value)}
                  />
                </label>
                <label>
                  <span>Highlight <small>(Italic red accent)</small></span>
                  <input
                    placeholder="Ready for anywhere."
                    value={draft.highlight ?? ""}
                    onChange={(e) => set("highlight", e.target.value)}
                  />
                </label>
              </div>

              {/* Description Paragraph */}
              <label>
                <span>Slide Description * <small>(Remaining space paragraph)</small></span>
                <textarea
                  rows={3}
                  required
                  placeholder="At Sanjeevan, engineering is more than a degree. It's the confidence to ask better questions, the skill to build useful things..."
                  value={draft.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                />
              </label>

              {/* Button CTA */}
              <div className="cms-form-grid">
                <label>
                  <span>Button Text</span>
                  <input
                    placeholder="Our story"
                    value={draft.button_text ?? ""}
                    onChange={(e) => set("button_text", e.target.value)}
                  />
                </label>
                <label>
                  <span>Button Link</span>
                  <input
                    placeholder="/about-us"
                    value={draft.button_link ?? ""}
                    onChange={(e) => set("button_link", e.target.value)}
                  />
                </label>
              </div>

              {/* Quote & Author */}
              <div className="cms-form-grid">
                <label>
                  <span>Quote Text</span>
                  <textarea
                    rows={2}
                    placeholder="“We want every student to leave with the ability to imagine boldly...”"
                    value={draft.quote ?? ""}
                    onChange={(e) => set("quote", e.target.value)}
                  />
                </label>
                <label>
                  <span>Quote Author</span>
                  <input
                    placeholder="Principal · Sanjeevan Group of Institutions"
                    value={draft.quote_author ?? ""}
                    onChange={(e) => set("quote_author", e.target.value)}
                  />
                </label>
              </div>

              {/* Toggles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                <div className="form-switch-row" style={{ border: 0, padding: 0 }}>
                  <span>
                    <strong>Slide Active</strong>
                    <small>Include in rotation</small>
                  </span>
                  <button
                    type="button"
                    className={`switch ${draft.is_active ? "is-on" : ""}`}
                    onClick={() => set("is_active", !draft.is_active)}
                  >
                    <span />
                  </button>
                </div>

                <div className="form-switch-row" style={{ border: 0, padding: 0 }}>
                  <span>
                    <strong>Published</strong>
                    <small>Live on homepage</small>
                  </span>
                  <button
                    type="button"
                    className={`switch ${draft.published ? "is-on" : ""}`}
                    onClick={() => set("published", !draft.published)}
                  >
                    <span />
                  </button>
                </div>
              </div>
            </div>
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
              {saving ? "Saving…" : "Save slide"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main Hero Content Manager Page
────────────────────────────────────────── */
export default function HeroContentManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tableReady, setTableReady] = useState(true);
  const [copiedSql, setCopiedSql] = useState(false);
  const [editSlide, setEditSlide] = useState<HeroSlide | null | false>(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api<{
        slides: HeroSlide[];
        tableReady?: boolean;
        error?: string;
      }>("/api/hero-slides?drafts=true");

      if (res.tableReady === false) {
        setTableReady(false);
        setSlides([]);
      } else {
        setTableReady(true);
        setSlides(res.slides ?? []);
      }
    } catch (e) {
      setMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "Failed to load slides",
      });
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      await load();
      setMessage({ kind: "success", text: success });
    } catch (e) {
      setMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "Action failed",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveSlide(draft: SlideDraft) {
    if (editSlide) {
      await runAction(
        () =>
          api(`/api/hero-slides/${editSlide.id}`, {
            method: "PATCH",
            body: JSON.stringify(draft),
          }),
        "Slide updated successfully.",
      );
    } else {
      await runAction(
        () =>
          api("/api/hero-slides", {
            method: "POST",
            body: JSON.stringify(draft),
          }),
        "Slide created successfully.",
      );
    }
    setEditSlide(false);
  }

  async function deleteSlide(slide: HeroSlide) {
    if (!window.confirm(`Delete slide "${slide.heading}"?`)) return;
    await runAction(
      () => api(`/api/hero-slides/${slide.id}`, { method: "DELETE" }),
      "Slide deleted.",
    );
  }

  async function toggleField(
    slide: HeroSlide,
    field: "is_active" | "published",
    val: boolean,
  ) {
    await runAction(
      () =>
        api(`/api/hero-slides/${slide.id}`, {
          method: "PATCH",
          body: JSON.stringify({ [field]: val }),
        }),
      `Slide ${field === "published" ? "publishing status" : "visibility"} updated.`,
    );
  }

  // Drag and drop reordering
  function handleDragStart(e: DragEvent, id: string) {
    e.dataTransfer.effectAllowed = "move";
    setDragId(id);
  }

  async function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const next = [...slides];
    const from = next.findIndex((s) => s.id === dragId);
    const to = next.findIndex((s) => s.id === targetId);
    if (from === -1 || to === -1) {
      setDragId(null);
      return;
    }
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reordered = next.map((item, idx) => ({
      ...item,
      display_order: idx,
    }));
    setSlides(reordered);
    setDragId(null);

    await runAction(
      () =>
        api("/api/hero-slides", {
          method: "PATCH",
          body: JSON.stringify({
            slides: reordered.map((s) => ({
              id: s.id,
              display_order: s.display_order,
            })),
          }),
        }),
      "Slide rotation order saved.",
    );
  }

  const filteredSlides = slides.filter(
    (s) =>
      s.heading.toLowerCase().includes(query.toLowerCase()) ||
      (s.highlight && s.highlight.toLowerCase().includes(query.toLowerCase())) ||
      (s.label && s.label.toLowerCase().includes(query.toLowerCase())),
  );

  const publishedCount = slides.filter((s) => s.published && s.is_active).length;

  return (
    <div className="admin-shell">
      {/* ── Standard Admin Sidebar matching navigation.tsx ── */}
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <span className="admin-brand-mark">S</span>
          <span>
            <strong>Sanjeevan</strong>
            <small>INSTITUTE ADMIN</small>
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
          {sideItems.map(({ title, icon: Icon, href, active }) =>
            href ? (
              <Link
                href={href}
                className={`side-link ${active ? "active" : ""}`}
                key={title}
              >
                <Icon size={17} />
                <span>{title}</span>
              </Link>
            ) : (
              <button
                type="button"
                className="side-link side-disabled"
                key={title}
                disabled
              >
                <Icon size={17} />
                <span>{title}</span>
                <small>Later</small>
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={16} />
            <strong>Need a hand?</strong>
            <span>Admin help and setup</span>
          </div>
          <Link href="/" className="public-site-link">
            View public website <ArrowUpRight size={14} />
          </Link>
          <div className="admin-profile">
            <span className="profile-avatar">SG</span>
            <span>
              <strong>Institute Admin</strong>
              <small>Hero Content Manager</small>
            </span>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>Hero Content Manager</strong>
          </div>
          <div className="topbar-actions">
            <span className="environment-tag">
              <i /> Live content
            </span>
            <Link
              href="/"
              target="_blank"
              className="admin-secondary-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                height: 32,
                fontSize: 11,
              }}
            >
              <Eye size={13} /> Preview site
            </Link>
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
          {/* Page Heading */}
          <div className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">HOMEPAGE CONTENT</span>
              <h1>Hero Content Manager</h1>
              <p>
                Manage the dynamic image slider below the navigation. Reorder,
                edit captions, update photos, and publish live slides.
              </p>
            </div>
            <button
              className="admin-primary-button"
              type="button"
              onClick={() => setEditSlide(null)}
            >
              <Plus size={16} /> Add slide
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div className={`admin-alert ${message.kind}`} role="status">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {message.kind === "error" ? (
                    <CircleHelp size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  {message.text}
                </span>
                {message.text.includes("image_ratio") && (
                  <div style={{ marginTop: "4px", fontSize: "12px", background: "rgba(0,0,0,0.04)", padding: "8px 12px", borderRadius: "4px" }}>
                    <span>Run this in your <strong>Supabase SQL Editor</strong>:</span>
                    <pre style={{ margin: "6px 0 0", padding: "6px 10px", background: "#091d44", color: "#facc15", borderRadius: "4px", fontSize: "11px", userSelect: "all" }}>
                      ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS image_ratio text DEFAULT &apos;4 / 4.5&apos;;
                    </pre>
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setMessage(null)}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Supabase Migration Notice Banner if table is not yet executed in remote Supabase */}
          {!tableReady && (
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "6px",
                padding: "16px 20px",
                marginBottom: "22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ maxWidth: 640 }}>
                <strong
                  style={{
                    color: "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 13,
                  }}
                >
                  ⚡ Supabase Database Setup Required
                </strong>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#b45309",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  The <code>hero_slides</code> table has not been created in your
                  Supabase database yet. The starter slides below are loaded in
                  preview mode. To enable permanent database updates, copy the
                  SQL migration and run it in your <strong>Supabase SQL Editor</strong>.
                </p>
              </div>
              <button
                type="button"
                className="admin-secondary-button"
                style={{
                  flexShrink: 0,
                  fontWeight: 600,
                  background: "#ffffff",
                  borderColor: "#f59e0b",
                  color: "#b45309",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onClick={() => {
                  navigator.clipboard.writeText(MIGRATION_SQL);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
              >
                {copiedSql ? (
                  <>
                    <Check size={14} /> SQL Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Migration SQL
                  </>
                )}
              </button>
            </div>
          )}

          {/* Stats Band */}
          <section className="admin-stats" aria-label="Hero slider summary">
            <div>
              <span>Total slides</span>
              <strong>{slides.length.toString().padStart(2, "0")}</strong>
              <small>Configured hero slides</small>
            </div>
            <div>
              <span>Published & Active</span>
              <strong>{publishedCount.toString().padStart(2, "0")}</strong>
              <small>Live on homepage right now</small>
            </div>
            <div>
              <span>Drafts / Hidden</span>
              <strong>
                {(slides.length - publishedCount).toString().padStart(2, "0")}
              </strong>
              <small>Unpublished or toggled off</small>
            </div>
            <div className="admin-stat-note">
              <span>Auto-Play Cadence</span>
              <strong>
                <i /> 2.0s Interval
              </strong>
              <small>Smooth fade + horizontal slide</small>
            </div>
          </section>

          {/* Slides Panel */}
          <section className="manager-panel">
            <div className="panel-heading">
              <div>
                <h2>Website hero slides</h2>
                <p>
                  Drag rows to change rotation order. Click Edit to adjust images,
                  titles, or quotes.
                </p>
              </div>
              <button
                className="admin-primary-button"
                type="button"
                onClick={() => setEditSlide(null)}
              >
                <Plus size={15} /> Add slide
              </button>
            </div>

            <div className="table-toolbar">
              <label className="admin-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter slides by heading or label"
                  aria-label="Filter slides"
                />
              </label>
              <span>{filteredSlides.length} slide(s)</span>
            </div>

            <div className="menu-table-wrap">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th style={{ width: 88 }}>Photo</th>
                    <th>Slide Content</th>
                    <th>Call to Action</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th style={{ width: 80 }}>Active</th>
                    <th style={{ width: 120, textAlign: "right", paddingRight: 18 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "30px 0" }}>
                        <LoaderCircle size={22} className="spinning" style={{ verticalAlign: "middle", marginRight: 8 }} />
                        Loading hero slides…
                      </td>
                    </tr>
                  ) : filteredSlides.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px 0", color: "#8a93a1" }}>
                        No slides found. Click <strong>Add slide</strong> to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredSlides.map((slide, idx) => (
                      <tr
                        key={slide.id}
                        className="menu-row"
                        draggable
                        onDragStart={(e) => handleDragStart(e, slide.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, slide.id)}
                        style={{
                          opacity: dragId === slide.id ? 0.45 : 1,
                          cursor: "grab",
                        }}
                      >
                        {/* Order & Drag Handle */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span className="row-grip" title="Drag to reorder">
                              <GripVertical size={15} />
                            </span>
                            <span className="count-badge">{idx + 1}</span>
                          </div>
                        </td>

                        {/* Thumbnail */}
                        <td>
                          <div
                            style={{
                              width: 74,
                              height: 48,
                              borderRadius: 4,
                              overflow: "hidden",
                              background: "#091d44",
                              border: "1px solid #dfe4eb",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slide.image_url}
                              alt={slide.heading}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>
                        </td>

                        {/* Content */}
                        <td>
                          <div className="menu-title-cell">
                            {slide.label && (
                              <small style={{ color: "#a37c19", fontWeight: 700, letterSpacing: "0.08em" }}>
                                {slide.label}
                              </small>
                            )}
                            <strong>
                              {slide.heading}{" "}
                              {slide.highlight && (
                                <em style={{ color: "#9e1b32", fontStyle: "italic", fontWeight: 400 }}>
                                  {slide.highlight}
                                </em>
                              )}
                            </strong>
                            {slide.description && (
                              <small
                                style={{
                                  maxWidth: 420,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "block",
                                  color: "#788397",
                                }}
                              >
                                {slide.description}
                              </small>
                            )}
                          </div>
                        </td>

                        {/* Button Link */}
                        <td>
                          {slide.button_text ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <strong style={{ fontSize: 10, color: "#17365f" }}>
                                {slide.button_text}
                              </strong>
                              <small style={{ color: "#8a93a1" }}>
                                {slide.button_link || "/"}
                              </small>
                            </div>
                          ) : (
                            <span style={{ color: "#a0a8b4", fontSize: 9 }}>—</span>
                          )}
                        </td>

                        {/* Published Status Tag */}
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleField(slide, "published", !slide.published)}
                            style={{ border: 0, background: "transparent", cursor: "pointer", padding: 0 }}
                            title="Click to toggle published"
                          >
                            <span
                              className={`status-tag ${
                                slide.published ? "status-published" : "status-draft"
                              }`}
                            >
                              <i />
                              {slide.published ? "Published" : "Draft"}
                            </span>
                          </button>
                        </td>

                        {/* Active Switch */}
                        <td>
                          <button
                            type="button"
                            className={`switch ${slide.is_active ? "is-on" : ""}`}
                            aria-label="Toggle active"
                            onClick={() => toggleField(slide, "is_active", !slide.is_active)}
                          >
                            <span />
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right", paddingRight: 18 }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <button
                              type="button"
                              className="admin-small-button"
                              onClick={() => setEditSlide(slide)}
                              title="Edit slide"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="action-more"
                              onClick={() => deleteSlide(slide)}
                              title="Delete slide"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="panel-footer">
              <span>
                <Sliders size={13} />
                Slides rotation active on homepage · 2s autoplay interval
              </span>
              <span>
                Showing {filteredSlides.length} of {slides.length} slide(s)
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* Slide Editor Modal */}
      {editSlide !== false && (
        <SlideEditor
          slide={editSlide}
          onClose={() => setEditSlide(false)}
          onSave={saveSlide}
        />
      )}
    </div>
  );
}
