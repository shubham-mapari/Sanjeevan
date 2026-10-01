"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import {
  ArrowLeft, BookOpen, Check, ChevronDown, ChevronRight,
  ExternalLink, FileText, GripVertical, Image as ImgIcon,
  LoaderCircle, Pencil, Plus, Save, Trash2, Upload, Users, X,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import type {
  Department,
  DepartmentFeature,
  DepartmentFeatureDocument,
  DepartmentFeatureImage,
  DepartmentHOD,
  DepartmentFacultyMember,
  DepartmentLab,
  DepartmentGalleryImage,
} from "@/lib/departments-data";
import "@/app/admin/campus-content-admin.css";
import "@/app/admin/admin.css";

// ─── helpers ─────────────────────────────────────────────────
function slugify(v: string) {
  return v.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

// ─── RichEditor component ─────────────────────────────────────
function RichEditor({
  value,
  onChange,
}: {
  value: object | null;
  onChange: (v: object) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension.configure({ inline: false, allowBase64: true }),
    ],
    content: value ?? { type: "doc", content: [] },
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
  });

  if (!editor) return <div style={{ padding: 12, color: "#888" }}>Loading editor…</div>;

  const btn = (label: string, action: () => void, active?: boolean) => (
    <button
      key={label}
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      style={{
        padding: "3px 7px", borderRadius: 3, border: "1px solid #dde",
        background: active ? "#1e3a8a" : "#fff", color: active ? "#fff" : "#334",
        fontSize: 11, cursor: "pointer", fontWeight: 600,
      }}
    >{label}</button>
  );

  return (
    <div style={{ border: "1px solid #dfe4eb", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 8px", background: "#f8fafc", borderBottom: "1px solid #dfe4eb" }}>
        {btn("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {btn("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {btn("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {btn("H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
        {btn("• List", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {btn("1. List", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {btn("Quote", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
        {btn("Code", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
        {btn("Link", () => {
          const url = window.prompt("Enter URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }, editor.isActive("link"))}
      </div>
      <div style={{ minHeight: 120, padding: "10px 12px" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ─── Section tabs ─────────────────────────────────────────────
type SectionTab = "features" | "hod" | "faculty" | "labs" | "gallery";

const SECTION_TABS: { id: SectionTab; label: string; icon: typeof Users }[] = [
  { id: "features",  label: "Features / Menu", icon: BookOpen },
  { id: "hod",       label: "HOD",             icon: Users },
  { id: "faculty",   label: "Faculty",          icon: Users },
  { id: "labs",      label: "Laboratories",     icon: BookOpen },
  { id: "gallery",   label: "Gallery",          icon: ImgIcon },
];

// ─── FEATURES tab ─────────────────────────────────────────────
function FeaturesTab({ deptId }: { deptId: string }) {
  const [features, setFeatures] = useState<DepartmentFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DepartmentFeature | null | "new">(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ features: DepartmentFeature[] }>(
        `/api/departments/${deptId}/features?drafts=true`
      );
      setFeatures(res.features ?? []);
    } catch { setFeatures([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [deptId]);

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const reordered = [...features];
    const from = reordered.findIndex(f => f.id === dragId);
    const to   = reordered.findIndex(f => f.id === targetId);
    if (from < 0 || to < 0) return;
    reordered.splice(to, 0, reordered.splice(from, 1)[0]);
    const items = reordered.map((f, i) => ({ id: f.id, display_order: i }));
    setFeatures(reordered);
    setDragId(null);
    await apiFetch(`/api/departments/${deptId}/features`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    }).catch(() => {});
    load();
  }

  async function togglePublish(f: DepartmentFeature) {
    await apiFetch(`/api/departments/${deptId}/features/${f.id}`, {
      method: "PUT",
      body: JSON.stringify({ published: !f.published }),
    });
    load();
  }

  async function del(f: DepartmentFeature) {
    if (!window.confirm(`Delete "${f.name}"? This removes all its images and documents.`)) return;
    await apiFetch(`/api/departments/${deptId}/features/${f.id}`, { method: "DELETE" });
    setMsg({ type: "success", text: `"${f.name}" deleted.` });
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b1f4d", margin: 0 }}>Department Features</h2>
          <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>
            These appear as the department navigation bar on the public page. Drag to reorder.
          </p>
        </div>
        <button className="admin-primary-button" type="button" onClick={() => setEditing("new")}>
          <Plus size={14} /> Add Feature
        </button>
      </div>

      {msg && (
        <div className={`admin-alert ${msg.type}`} style={{ marginBottom: 12 }}>
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)}><X size={13} /></button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
          <LoaderCircle size={20} className="spinning" /> Loading…
        </div>
      ) : features.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 8, color: "#64748b" }}>
          <BookOpen size={28} style={{ opacity: 0.4, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
          <strong>No features yet</strong>
          <p style={{ fontSize: 12, margin: "4px 0 0" }}>Add features like Vision & Mission, Faculty, Laboratories, Events…</p>
        </div>
      ) : (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
          {features.map((f, i) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => setDragId(f.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(f.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px",
                borderBottom: i < features.length - 1 ? "1px solid #f1f5f9" : undefined,
                background: dragId === f.id ? "#f8fafc" : "#fff",
                cursor: "grab",
              }}
            >
              <GripVertical size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", width: 22 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>{f.name}</strong>
                <small style={{ color: "#94a3b8", fontSize: 10 }}>/{f.slug}</small>
                {f.short_description && (
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.short_description}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                {(f.images?.length ?? 0) > 0 && (
                  <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, background: "#eff6ff", color: "#1d4ed8" }}>
                    {f.images!.length} imgs
                  </span>
                )}
                {(f.documents?.length ?? 0) > 0 && (
                  <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 3, background: "#f0fdf4", color: "#15803d" }}>
                    {f.documents!.length} docs
                  </span>
                )}
                <button
                  type="button"
                  className={`switch ${f.published ? "is-on" : ""}`}
                  onClick={() => togglePublish(f)}
                  title={f.published ? "Unpublish" : "Publish"}
                  style={{ transform: "scale(0.85)" }}
                >
                  <span />
                </button>
                <button type="button" className="admin-small-button" onClick={() => setEditing(f)}>
                  <Pencil size={12} /> Edit
                </button>
                <button type="button" className="action-more" onClick={() => del(f)}>
                  <Trash2 size={12} color="#dc2626" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <FeatureEditor
          deptId={deptId}
          feature={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── FeatureEditor modal ──────────────────────────────────────
function FeatureEditor({
  deptId, feature, onClose, onSaved,
}: {
  deptId: string;
  feature: DepartmentFeature | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"basic" | "content" | "images" | "docs">("basic");
  const [name, setName] = useState(feature?.name ?? "");
  const [slug, setSlug] = useState(feature?.slug ?? "");
  const [shortDesc, setShortDesc] = useState(feature?.short_description ?? "");
  const [fullDesc, setFullDesc] = useState<object | null>(feature?.full_description ?? null);
  const [coverImage, setCoverImage] = useState(feature?.cover_image ?? "");
  const [pdfUrl, setPdfUrl] = useState(feature?.pdf_url ?? "");
  const [extUrl, setExtUrl] = useState(feature?.external_url ?? "");
  const [icon, setIcon] = useState(feature?.feature_icon ?? "");
  const [order, setOrder] = useState(feature?.display_order ?? 0);
  const [active, setActive] = useState(feature?.is_active ?? true);
  const [published, setPublished] = useState(feature?.published ?? true);
  const [openNew, setOpenNew] = useState(feature?.open_in_new_page ?? false);

  // images & docs state (for existing features)
  const [images, setImages] = useState<DepartmentFeatureImage[]>(feature?.images ?? []);
  const [docs, setDocs] = useState<DepartmentFeatureDocument[]>(feature?.documents ?? []);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  async function upload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: fd });
    return res.url;
  }

  async function handleCoverUpload(file: File) {
    setUploading(true);
    try { setCoverImage(await upload(file)); } catch (e) { setError(String(e)); }
    finally { setUploading(false); }
  }

  async function handleAddImage(file: File) {
    if (!feature) { setError("Save the feature first before adding images."); return; }
    setUploading(true);
    try {
      const url = await upload(file);
      const res = await apiFetch<DepartmentFeatureImage>(
        `/api/departments/${deptId}/features/${feature.id}/images`,
        { method: "POST", body: JSON.stringify({ image_url: url }) },
      );
      setImages(prev => [...prev, res]);
    } catch (e) { setError(String(e)); }
    finally { setUploading(false); }
  }

  async function deleteImage(img: DepartmentFeatureImage) {
    if (!feature) return;
    await apiFetch(
      `/api/departments/${deptId}/features/${feature.id}/images?imageId=${img.id}`,
      { method: "DELETE" },
    );
    setImages(prev => prev.filter(i => i.id !== img.id));
  }

  async function handleAddDoc(file?: File) {
    if (!feature) { setError("Save the feature first before adding documents."); return; }
    setUploading(true);
    try {
      let fileUrl = newDocUrl;
      let fileName = "";
      let fileType = "";
      let fileSize = "";
      if (file) {
        const res = await apiFetch<{ url: string }>("/api/uploads", {
          method: "POST",
          body: (() => { const fd = new FormData(); fd.append("file", file); return fd; })(),
        });
        fileUrl = res.url;
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size > 1048576
          ? `${(file.size / 1048576).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      }
      if (!fileUrl) { setError("Provide a file or URL."); setUploading(false); return; }
      const res = await apiFetch<DepartmentFeatureDocument>(
        `/api/departments/${deptId}/features/${feature.id}/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            display_title: newDocTitle || fileName || "Document",
            file_url: fileUrl,
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize,
          }),
        },
      );
      setDocs(prev => [...prev, res]);
      setNewDocTitle("");
      setNewDocUrl("");
    } catch (e) { setError(String(e)); }
    finally { setUploading(false); }
  }

  async function deleteDoc(doc: DepartmentFeatureDocument) {
    if (!feature) return;
    await apiFetch(
      `/api/departments/${deptId}/features/${feature.id}/documents?docId=${doc.id}`,
      { method: "DELETE" },
    );
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Feature name is required."); return; }
    if (!slug) { setError("Slug is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(), slug,
        short_description: shortDesc || null,
        full_description: fullDesc,
        cover_image: coverImage || null,
        pdf_url: pdfUrl || null,
        external_url: extUrl || null,
        feature_icon: icon || null,
        display_order: order,
        is_active: active,
        published,
        open_in_new_page: openNew,
      };
      if (feature) {
        await apiFetch(`/api/departments/${deptId}/features/${feature.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/departments/${deptId}/features`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const tabBtn = (t: typeof tab, label: string) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      style={{
        padding: "6px 14px", borderRadius: 4, border: "none", cursor: "pointer",
        fontSize: 11, fontWeight: 700,
        background: tab === t ? "#0b1f4d" : "transparent",
        color: tab === t ? "#fff" : "#64748b",
      }}
    >{label}</button>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal modal-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 820 }}>
        <div className="modal-header">
          <div>
            <span>DEPARTMENT FEATURE</span>
            <h2>{feature ? `Edit: ${feature.name}` : "Add New Feature"}</h2>
          </div>
          <button type="button" className="action-more" onClick={onClose}><X size={15} /></button>
        </div>

        <div style={{ display: "flex", gap: 4, padding: "8px 20px", background: "#fafbfc", borderBottom: "1px solid #e2e8f0" }}>
          {tabBtn("basic", "1. Basic")}
          {tabBtn("content", "2. Content")}
          {tabBtn("images", "3. Images")}
          {tabBtn("docs", "4. Documents")}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form" style={{ padding: "20px 20px", maxHeight: "62vh", overflowY: "auto" }}>
            {error && (
              <div className="admin-alert error" style={{ marginBottom: 12 }}>
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)}><X size={12} /></button>
              </div>
            )}

            {/* TAB 1: BASIC */}
            {tab === "basic" && (
              <div style={{ display: "grid", gap: 14 }}>
                <div className="cms-form-grid">
                  <label>
                    Feature Name *
                    <input required value={name} onChange={e => {
                      setName(e.target.value);
                      if (!feature) setSlug(slugify(e.target.value));
                    }} placeholder="e.g. Vision & Mission" />
                  </label>
                  <label>
                    Feature Icon <small>(Lucide icon name or emoji)</small>
                    <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="e.g. target, users, flask" />
                  </label>
                </div>
                <label>
                  Slug *
                  <div className="slug-field">
                    <span>/</span>
                    <input required value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="vision-mission" />
                  </div>
                </label>
                <label>
                  Short Description <small>(shown in nav tooltip / card)</small>
                  <input value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Brief one-liner description" />
                </label>
                <label>
                  Cover Image URL
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://... or upload" />
                    <button type="button" className="admin-secondary-button" onClick={() => coverRef.current?.click()} disabled={uploading}>
                      <Upload size={13} /> {uploading ? "…" : "Upload"}
                    </button>
                    <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ""; }} />
                  </div>
                  {coverImage && <img src={coverImage} alt="" style={{ marginTop: 8, height: 80, objectFit: "cover", borderRadius: 4, width: "100%" }} />}
                </label>
                <div className="cms-form-grid">
                  <label>
                    PDF URL <small>(optional)</small>
                    <input value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} placeholder="https://..." />
                  </label>
                  <label>
                    External URL <small>(optional)</small>
                    <input value={extUrl} onChange={e => setExtUrl(e.target.value)} placeholder="https://..." />
                  </label>
                </div>
                <div className="cms-form-grid">
                  <label>Display Order <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} /></label>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[
                    { label: "Published", val: published, set: setPublished },
                    { label: "Active", val: active, set: setActive },
                    { label: "Open in new page", val: openNew, set: setOpenNew },
                  ].map(({ label, val, set }) => (
                    <div key={label} className="form-switch-row" style={{ flex: "none" }}>
                      <span><strong>{label}</strong></span>
                      <button type="button" className={`switch ${val ? "is-on" : ""}`} onClick={() => set(!val)}><span /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: RICH CONTENT */}
            {tab === "content" && (
              <div style={{ display: "grid", gap: 14 }}>
                <label>
                  Full Description (Rich Text)
                  <div style={{ marginTop: 6 }}>
                    <RichEditor value={fullDesc} onChange={setFullDesc} />
                  </div>
                </label>
              </div>
            )}

            {/* TAB 3: IMAGES */}
            {tab === "images" && (
              <div style={{ display: "grid", gap: 14 }}>
                {!feature && (
                  <div style={{ padding: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, fontSize: 12, color: "#92400e" }}>
                    Save the feature first (Tab 1), then come back to add images.
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <strong>Gallery Images ({images.length})</strong>
                  <button
                    type="button" className="admin-small-button"
                    onClick={() => imgRef.current?.click()} disabled={!feature || uploading}
                  >
                    <Upload size={13} /> {uploading ? "Uploading…" : "Upload Image"}
                  </button>
                  <input ref={imgRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleAddImage(f); e.target.value = ""; }} />
                </div>
                {images.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 8, color: "#94a3b8", fontSize: 12 }}>
                    No images yet. Upload images above.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {images.map(img => (
                      <div key={img.id} style={{ position: "relative", borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <img src={img.image_url} alt={img.caption ?? ""} style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                        {img.caption && <div style={{ padding: "4px 6px", fontSize: 10, color: "#64748b", background: "#f8fafc" }}>{img.caption}</div>}
                        <button
                          type="button" onClick={() => deleteImage(img)}
                          style={{ position: "absolute", top: 4, right: 4, background: "rgba(185,28,28,0.9)", border: "none", borderRadius: 3, color: "#fff", cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
                        ><Trash2 size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {tab === "docs" && (
              <div style={{ display: "grid", gap: 14 }}>
                {!feature && (
                  <div style={{ padding: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, fontSize: 12, color: "#92400e" }}>
                    Save the feature first (Tab 1), then come back to add documents.
                  </div>
                )}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, background: "#f8fafc" }}>
                  <strong style={{ display: "block", marginBottom: 10, fontSize: 12 }}>Add Document</strong>
                  <div className="cms-form-grid" style={{ marginBottom: 8 }}>
                    <input placeholder="Display Title (e.g. Syllabus 2024)" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} />
                    <input placeholder="File URL (or upload below)" value={newDocUrl} onChange={e => setNewDocUrl(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="admin-small-button" onClick={() => docRef.current?.click()} disabled={!feature || uploading}>
                      <Upload size={12} /> {uploading ? "Uploading…" : "Upload File"}
                    </button>
                    <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleAddDoc(f); e.target.value = ""; }} />
                    <button type="button" className="admin-small-button" onClick={() => handleAddDoc()} disabled={!feature || !newDocUrl || uploading}>
                      <Plus size={12} /> Add by URL
                    </button>
                  </div>
                </div>
                {docs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 8, color: "#94a3b8", fontSize: 12 }}>
                    No documents yet.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {docs.map(doc => (
                      <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff" }}>
                        <FileText size={16} color="#1d4ed8" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: 12, display: "block" }}>{doc.display_title}</strong>
                          <small style={{ color: "#94a3b8" }}>{doc.file_type} {doc.file_size && `· ${doc.file_size}`}</small>
                        </div>
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="action-more"><ExternalLink size={12} /></a>
                        <button type="button" className="action-more" onClick={() => deleteDoc(doc)}><Trash2 size={12} color="#dc2626" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? <><LoaderCircle size={13} className="spinning" /> Saving…</> : <><Check size={13} /> {feature ? "Update Feature" : "Create Feature"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── HOD tab ──────────────────────────────────────────────────
function HODTab({ deptId }: { deptId: string }) {
  const [hods, setHods] = useState<DepartmentHOD[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DepartmentHOD | null | "new">(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      // Use admin route directly
      const supaRes = await fetch(`/api/departments/${deptId}/hod`);
      const json = await supaRes.json();
      // For admin we need all, not just published — fetch via generic admin dept data
      // Workaround: store state from saves
      if (json.hod) setHods([json.hod]);
      else setHods([]);
    } catch { setHods([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [deptId]);

  async function del(h: DepartmentHOD) {
    if (!window.confirm(`Delete HOD "${h.name}"?`)) return;
    await fetch(`/api/departments/${deptId}/hod?hodId=${h.id}`, { method: "DELETE" });
    setMsg("HOD deleted.");
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b1f4d", margin: 0 }}>Head of Department</h2>
          <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>Add the HOD profile and message. This appears on the public department page.</p>
        </div>
        <button className="admin-primary-button" type="button" onClick={() => setEditing("new")}>
          <Plus size={14} /> Add HOD
        </button>
      </div>

      {msg && <div className="admin-alert success" style={{ marginBottom: 12 }}><span>{msg}</span><button type="button" onClick={() => setMsg(null)}><X size={12} /></button></div>}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "#64748b" }}><LoaderCircle size={20} className="spinning" /></div>
      ) : hods.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 8, color: "#64748b" }}>
          <Users size={28} style={{ opacity: 0.4, display: "block", margin: "0 auto 8px" }} />
          <strong>No HOD profile yet</strong>
        </div>
      ) : hods.map(h => (
        <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", marginBottom: 10 }}>
          {h.photo_url && <img src={h.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />}
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 14 }}>{h.name}</strong>
            <div style={{ fontSize: 11, color: "#64748b" }}>{h.designation} {h.qualification && `· ${h.qualification}`}</div>
            {h.email && <div style={{ fontSize: 11, color: "#94a3b8" }}>{h.email}</div>}
          </div>
          <span style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, background: h.published ? "#f0fdf4" : "#fef3c7", color: h.published ? "#15803d" : "#92400e" }}>
            {h.published ? "Published" : "Draft"}
          </span>
          <button type="button" className="admin-small-button" onClick={() => setEditing(h)}><Pencil size={12} /> Edit</button>
          <button type="button" className="action-more" onClick={() => del(h)}><Trash2 size={12} color="#dc2626" /></button>
        </div>
      ))}

      {editing !== null && (
        <HODEditor deptId={deptId} hod={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function HODEditor({ deptId, hod, onClose, onSaved }: { deptId: string; hod: DepartmentHOD | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(hod?.name ?? "");
  const [designation, setDesig] = useState(hod?.designation ?? "");
  const [qualification, setQual] = useState(hod?.qualification ?? "");
  const [experience, setExp] = useState(hod?.experience ?? "");
  const [photoUrl, setPhoto] = useState(hod?.photo_url ?? "");
  const [shortIntro, setShortIntro] = useState(hod?.short_intro ?? "");
  const [fullMessage, setFullMessage] = useState<object | null>(hod?.full_message ?? null);
  const [email, setEmail] = useState(hod?.email ?? "");
  const [phone, setPhone] = useState(hod?.phone ?? "");
  const [resumePdf, setResume] = useState(hod?.resume_pdf ?? "");
  const [published, setPublished] = useState(hod?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: fd });
      setPhoto(res.url);
    } catch (e) { setError(String(e)); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError(null);
    const payload = { name, designation, qualification, experience, photo_url: photoUrl, short_intro: shortIntro, full_message: fullMessage, email, phone, resume_pdf: resumePdf, published };
    try {
      if (hod) {
        await apiFetch(`/api/departments/${deptId}/hod?hodId=${hod.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/departments/${deptId}/hod`, { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed."); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal modal-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div><span>HOD PROFILE</span><h2>{hod ? `Edit: ${hod.name}` : "Add HOD"}</h2></div>
          <button type="button" className="action-more" onClick={onClose}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form" style={{ padding: "20px", maxHeight: "60vh", overflowY: "auto", display: "grid", gap: 14 }}>
            {error && <div className="admin-alert error"><span>{error}</span><button type="button" onClick={() => setError(null)}><X size={12} /></button></div>}
            <div className="cms-form-grid">
              <label>Name *<input required value={name} onChange={e => setName(e.target.value)} placeholder="Dr. A. B. Sharma" /></label>
              <label>Designation<input value={designation} onChange={e => setDesig(e.target.value)} placeholder="Professor & HOD" /></label>
            </div>
            <div className="cms-form-grid">
              <label>Qualification<input value={qualification} onChange={e => setQual(e.target.value)} placeholder="Ph.D., M.Tech" /></label>
              <label>Experience<input value={experience} onChange={e => setExp(e.target.value)} placeholder="15 Years" /></label>
            </div>
            <label>
              Profile Photo
              <div style={{ display: "flex", gap: 8 }}>
                <input value={photoUrl} onChange={e => setPhoto(e.target.value)} placeholder="https://..." />
                <button type="button" className="admin-secondary-button" onClick={() => photoRef.current?.click()} disabled={uploading}><Upload size={12} /></button>
                <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
              </div>
              {photoUrl && <img src={photoUrl} alt="" style={{ marginTop: 6, width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />}
            </label>
            <div className="cms-form-grid">
              <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
              <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} /></label>
            </div>
            <label>Short Introduction <small>(shown on department page preview)</small>
              <textarea rows={2} value={shortIntro} onChange={e => setShortIntro(e.target.value)} placeholder="Brief introduction shown on the department page." />
            </label>
            <label>
              Full Message (Rich Text)
              <div style={{ marginTop: 6 }}><RichEditor value={fullMessage} onChange={setFullMessage} /></div>
            </label>
            <label>Resume PDF URL<input value={resumePdf} onChange={e => setResume(e.target.value)} placeholder="https://..." /></label>
            <div className="form-switch-row">
              <span><strong>Published</strong></span>
              <button type="button" className={`switch ${published ? "is-on" : ""}`} onClick={() => setPublished(!published)}><span /></button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? <><LoaderCircle size={13} className="spinning" /> Saving…</> : <><Check size={13} /> {hod ? "Update" : "Add"} HOD</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Faculty tab ──────────────────────────────────────────────
function FacultyTab({ deptId }: { deptId: string }) {
  const [faculty, setFaculty] = useState<DepartmentFacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DepartmentFacultyMember | null | "new">(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ faculty: DepartmentFacultyMember[] }>(`/api/departments/${deptId}/faculty?drafts=true`);
      setFaculty(res.faculty ?? []);
    } catch { setFaculty([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [deptId]);

  async function del(m: DepartmentFacultyMember) {
    if (!window.confirm(`Delete "${m.name}"?`)) return;
    await apiFetch(`/api/departments/${deptId}/faculty?memberId=${m.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b1f4d", margin: 0 }}>Faculty Members ({faculty.length})</h2>
        <button className="admin-primary-button" type="button" onClick={() => setEditing("new")}><Plus size={14} /> Add Faculty</button>
      </div>
      {loading ? <div style={{ padding: 24, textAlign: "center" }}><LoaderCircle size={20} className="spinning" /></div>
        : faculty.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 8, color: "#64748b" }}>
            <Users size={28} style={{ opacity: 0.4, display: "block", margin: "0 auto 8px" }} /><strong>No faculty members yet</strong>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {faculty.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
                {m.photo_url ? <img src={m.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e2e8f0", display: "grid", placeItems: "center" }}><Users size={18} color="#94a3b8" /></div>}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13 }}>{m.name}</strong>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{m.designation} {m.qualification && `· ${m.qualification}`}</div>
                  {m.specialization && <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.specialization}</div>}
                </div>
                <span style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, background: m.published ? "#f0fdf4" : "#fef3c7", color: m.published ? "#15803d" : "#92400e" }}>{m.published ? "Published" : "Draft"}</span>
                <button type="button" className="admin-small-button" onClick={() => setEditing(m)}><Pencil size={12} /> Edit</button>
                <button type="button" className="action-more" onClick={() => del(m)}><Trash2 size={12} color="#dc2626" /></button>
              </div>
            ))}
          </div>
        )}
      {editing !== null && (
        <FacultyEditor deptId={deptId} member={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function FacultyEditor({ deptId, member, onClose, onSaved }: { deptId: string; member: DepartmentFacultyMember | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(member?.name ?? "");
  const [desig, setDesig] = useState(member?.designation ?? "");
  const [qual, setQual] = useState(member?.qualification ?? "");
  const [exp, setExp] = useState(member?.experience ?? "");
  const [spec, setSpec] = useState(member?.specialization ?? "");
  const [photo, setPhoto] = useState(member?.photo_url ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [bio, setBio] = useState(member?.short_bio ?? "");
  const [research, setResearch] = useState(member?.research_info ?? "");
  const [resume, setResume] = useState(member?.resume_pdf ?? "");
  const [order, setOrder] = useState(member?.display_order ?? 0);
  const [published, setPublished] = useState(member?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const r = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: fd }); setPhoto(r.url); }
    catch (e) { setError(String(e)); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name required."); return; }
    setSaving(true);
    const payload = { name, designation: desig, qualification: qual, experience: exp, specialization: spec, photo_url: photo, email, phone, short_bio: bio, research_info: research, resume_pdf: resume, display_order: order, published };
    try {
      if (member) {
        await apiFetch(`/api/departments/${deptId}/faculty?memberId=${member.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/departments/${deptId}/faculty`, { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed."); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal modal-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div><span>FACULTY</span><h2>{member ? `Edit: ${member.name}` : "Add Faculty Member"}</h2></div>
          <button type="button" className="action-more" onClick={onClose}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form" style={{ padding: 20, maxHeight: "60vh", overflowY: "auto", display: "grid", gap: 12 }}>
            {error && <div className="admin-alert error"><span>{error}</span><button type="button" onClick={() => setError(null)}><X size={12} /></button></div>}
            <div className="cms-form-grid">
              <label>Name *<input required value={name} onChange={e => setName(e.target.value)} /></label>
              <label>Designation<input value={desig} onChange={e => setDesig(e.target.value)} placeholder="Associate Professor" /></label>
            </div>
            <div className="cms-form-grid">
              <label>Qualification<input value={qual} onChange={e => setQual(e.target.value)} placeholder="Ph.D., M.Tech" /></label>
              <label>Experience<input value={exp} onChange={e => setExp(e.target.value)} placeholder="10 Years" /></label>
            </div>
            <div className="cms-form-grid">
              <label>Specialization<input value={spec} onChange={e => setSpec(e.target.value)} /></label>
              <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
            </div>
            <div className="cms-form-grid">
              <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} /></label>
              <label>Display Order<input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} /></label>
            </div>
            <label>
              Profile Photo
              <div style={{ display: "flex", gap: 8 }}>
                <input value={photo} onChange={e => setPhoto(e.target.value)} placeholder="https://..." />
                <button type="button" className="admin-secondary-button" onClick={() => photoRef.current?.click()} disabled={uploading}><Upload size={12} /></button>
                <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
              </div>
              {photo && <img src={photo} alt="" style={{ marginTop: 6, width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />}
            </label>
            <label>Short Bio<textarea rows={2} value={bio} onChange={e => setBio(e.target.value)} /></label>
            <label>Research / Publications<textarea rows={2} value={research} onChange={e => setResearch(e.target.value)} /></label>
            <label>Resume PDF URL<input value={resume} onChange={e => setResume(e.target.value)} /></label>
            <div className="form-switch-row">
              <span><strong>Published</strong></span>
              <button type="button" className={`switch ${published ? "is-on" : ""}`} onClick={() => setPublished(!published)}><span /></button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? <><LoaderCircle size={13} className="spinning" /> Saving…</> : <><Check size={13} /> {member ? "Update" : "Add"} Faculty</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Labs tab ─────────────────────────────────────────────────
function LabsTab({ deptId }: { deptId: string }) {
  const [labs, setLabs] = useState<DepartmentLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DepartmentLab | null | "new">(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ labs: DepartmentLab[] }>(`/api/departments/${deptId}/labs?drafts=true`);
      setLabs(res.labs ?? []);
    } catch { setLabs([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [deptId]);

  async function del(l: DepartmentLab) {
    if (!window.confirm(`Delete lab "${l.name}"?`)) return;
    await apiFetch(`/api/departments/${deptId}/labs?labId=${l.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b1f4d", margin: 0 }}>Laboratories ({labs.length})</h2>
        <button className="admin-primary-button" type="button" onClick={() => setEditing("new")}><Plus size={14} /> Add Lab</button>
      </div>
      {loading ? <div style={{ padding: 24, textAlign: "center" }}><LoaderCircle size={20} className="spinning" /></div>
        : labs.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 8, color: "#64748b" }}>No labs yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {labs.map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
                {l.cover_image && <img src={l.cover_image} alt="" style={{ width: 56, height: 44, borderRadius: 4, objectFit: "cover" }} />}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13 }}>{l.name}</strong>
                  {l.lab_code && <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 5px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 3 }}>{l.lab_code}</span>}
                  {l.incharge && <div style={{ fontSize: 11, color: "#64748b" }}>In-charge: {l.incharge}</div>}
                </div>
                <button type="button" className="admin-small-button" onClick={() => setEditing(l)}><Pencil size={12} /> Edit</button>
                <button type="button" className="action-more" onClick={() => del(l)}><Trash2 size={12} color="#dc2626" /></button>
              </div>
            ))}
          </div>
        )}
      {editing !== null && (
        <LabEditor deptId={deptId} lab={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function LabEditor({ deptId, lab, onClose, onSaved }: { deptId: string; lab: DepartmentLab | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(lab?.name ?? "");
  const [code, setCode] = useState(lab?.lab_code ?? "");
  const [desc, setDesc] = useState(lab?.description ?? "");
  const [incharge, setIncharge] = useState(lab?.incharge ?? "");
  const [cover, setCover] = useState(lab?.cover_image ?? "");
  const [equip, setEquip] = useState(lab?.equipment ?? "");
  const [fac, setFac] = useState(lab?.facilities ?? "");
  const [pdf, setPdf] = useState(lab?.pdf_url ?? "");
  const [ext, setExt] = useState(lab?.external_url ?? "");
  const [order, setOrder] = useState(lab?.display_order ?? 0);
  const [active, setActive] = useState(lab?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  async function uploadCover(file: File) {
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const r = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: fd }); setCover(r.url); }
    catch (e) { setError(String(e)); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Lab name required."); return; }
    setSaving(true);
    const payload = { name, lab_code: code, description: desc, incharge, cover_image: cover, equipment: equip, facilities: fac, pdf_url: pdf, external_url: ext, display_order: order, is_active: active };
    try {
      if (lab) {
        await apiFetch(`/api/departments/${deptId}/labs?labId=${lab.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/departments/${deptId}/labs`, { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed."); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal modal-wide" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
        <div className="modal-header">
          <div><span>LABORATORY</span><h2>{lab ? `Edit: ${lab.name}` : "Add Laboratory"}</h2></div>
          <button type="button" className="action-more" onClick={onClose}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form" style={{ padding: 20, maxHeight: "60vh", overflowY: "auto", display: "grid", gap: 12 }}>
            {error && <div className="admin-alert error"><span>{error}</span><button type="button" onClick={() => setError(null)}><X size={12} /></button></div>}
            <div className="cms-form-grid">
              <label>Lab Name *<input required value={name} onChange={e => setName(e.target.value)} /></label>
              <label>Lab Code<input value={code} onChange={e => setCode(e.target.value)} placeholder="CSE-LAB-01" /></label>
            </div>
            <label>Description<textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} /></label>
            <div className="cms-form-grid">
              <label>Lab In-charge<input value={incharge} onChange={e => setIncharge(e.target.value)} /></label>
              <label>Display Order<input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} /></label>
            </div>
            <label>
              Cover Image
              <div style={{ display: "flex", gap: 8 }}>
                <input value={cover} onChange={e => setCover(e.target.value)} placeholder="https://..." />
                <button type="button" className="admin-secondary-button" onClick={() => coverRef.current?.click()} disabled={uploading}><Upload size={12} /></button>
                <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />
              </div>
              {cover && <img src={cover} alt="" style={{ marginTop: 6, height: 70, width: "100%", objectFit: "cover", borderRadius: 4 }} />}
            </label>
            <label>Equipment List<textarea rows={2} value={equip} onChange={e => setEquip(e.target.value)} placeholder="List key equipment, one per line or comma-separated" /></label>
            <label>Facilities<textarea rows={2} value={fac} onChange={e => setFac(e.target.value)} /></label>
            <div className="cms-form-grid">
              <label>PDF URL<input value={pdf} onChange={e => setPdf(e.target.value)} /></label>
              <label>External Link<input value={ext} onChange={e => setExt(e.target.value)} /></label>
            </div>
            <div className="form-switch-row">
              <span><strong>Active</strong></span>
              <button type="button" className={`switch ${active ? "is-on" : ""}`} onClick={() => setActive(!active)}><span /></button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? <><LoaderCircle size={13} className="spinning" /> Saving…</> : <><Check size={13} /> {lab ? "Update" : "Add"} Lab</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Gallery tab ──────────────────────────────────────────────
function GalleryTab({ deptId }: { deptId: string }) {
  const [images, setImages] = useState<DepartmentGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ gallery: DepartmentGalleryImage[] }>(`/api/departments/${deptId}/gallery?drafts=true`);
      setImages(res.gallery ?? []);
    } catch { setImages([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [deptId]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const upRes = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: fd });
      await apiFetch(`/api/departments/${deptId}/gallery`, { method: "POST", body: JSON.stringify({ image_url: upRes.url }) });
      load();
    } catch { }
    finally { setUploading(false); }
  }

  async function del(img: DepartmentGalleryImage) {
    await apiFetch(`/api/departments/${deptId}/gallery?imageId=${img.id}`, { method: "DELETE" });
    setImages(prev => prev.filter(i => i.id !== img.id));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b1f4d", margin: 0 }}>Department Gallery ({images.length})</h2>
        <button className="admin-primary-button" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload size={14} /> {uploading ? "Uploading…" : "Upload Image"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden multiple onChange={e => {
          Array.from(e.target.files ?? []).forEach(f => handleUpload(f));
          e.target.value = "";
        }} />
      </div>
      {loading ? <div style={{ padding: 24, textAlign: "center" }}><LoaderCircle size={20} className="spinning" /></div>
        : images.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 8, color: "#64748b" }}>No gallery images yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {images.map(img => (
              <div key={img.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <img src={img.image_url} alt={img.caption ?? ""} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                {img.caption && <div style={{ padding: "4px 6px", fontSize: 10, color: "#64748b", background: "#f8fafc" }}>{img.caption}</div>}
                <button
                  type="button" onClick={() => del(img)}
                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(185,28,28,0.9)", border: "none", borderRadius: 3, color: "#fff", cursor: "pointer", padding: "2px 4px" }}
                ><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function DepartmentCMSPage() {
  const { deptId } = useParams<{ deptId: string }>();
  const [dept, setDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SectionTab>("features");

  useEffect(() => {
    if (!deptId) return;
    fetch(`/api/departments/${deptId}`)
      .then(r => r.json())
      .then(d => setDept(d as Department))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deptId]);

  if (loading) {
    return (
      <AdminShell currentSection="departments">
        <main className="campus-cms-main">
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            <LoaderCircle size={24} className="spinning" />
            <p style={{ marginTop: 8 }}>Loading department…</p>
          </div>
        </main>
      </AdminShell>
    );
  }

  if (!dept) {
    return (
      <AdminShell currentSection="departments">
        <main className="campus-cms-main">
          <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Department not found.</div>
        </main>
      </AdminShell>
    );
  }

  return (
    <AdminShell currentSection="departments">
      <main className="campus-cms-main">
        <header className="campus-cms-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/secure-institute-management/departments" style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748b", textDecoration: "none", fontSize: 11 }}>
              <ArrowLeft size={14} /> Departments
            </Link>
            <ChevronRight size={12} color="#94a3b8" />
            <strong style={{ fontSize: 11, color: "#0b1f4d" }}>{dept.name}</strong>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#eff6ff", color: "#1d4ed8", marginLeft: 4 }}>{dept.short_code}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={`/departments/${dept.slug}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#16a34a", textDecoration: "none" }}>
              <ExternalLink size={12} /> View Public Page
            </a>
          </div>
        </header>

        <div className="campus-cms-content">
          {/* Dept header card */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 24 }}>
            {dept.hero_image && <img src={dept.hero_image} alt="" style={{ width: 80, height: 56, borderRadius: 8, objectFit: "cover" }} />}
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0b1f4d", margin: 0 }}>{dept.name}</h1>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>{dept.description ?? "No description set."}</p>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
            {SECTION_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700,
                  background: activeTab === t.id ? "#0b1f4d" : "#f1f5f9",
                  color: activeTab === t.id ? "#fff" : "#475569",
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Active section */}
          {activeTab === "features" && <FeaturesTab deptId={deptId} />}
          {activeTab === "hod"      && <HODTab deptId={deptId} />}
          {activeTab === "faculty"  && <FacultyTab deptId={deptId} />}
          {activeTab === "labs"     && <LabsTab deptId={deptId} />}
          {activeTab === "gallery"  && <GalleryTab deptId={deptId} />}
        </div>
      </main>
    </AdminShell>
  );
}
