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
  Italic,
  LayoutDashboard,
  List,
  ListOrdered,
  LoaderCircle,
  Pencil,
  Plus,
  Quote,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { RichContent } from "@/components/rich-content";
import type { Leader, LeaderDesignation } from "@/lib/leaders-data";
import type { RichDocument } from "@/lib/navigation-types";
import "@/app/admin/leadership/leadership-admin.css";
import { AdminShell } from "@/components/admin/admin-shell";

const emptyMessage: RichDocument = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

type LeaderDraft = Omit<Leader, "id" | "created_at">;

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

function LeaderEditor({
  leader,
  onClose,
  onSave,
}: {
  leader: Leader | null;
  onClose: () => void;
  onSave: (draft: LeaderDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<LeaderDraft>(
    leader
      ? {
          name: leader.name,
          designation: leader.designation,
          photo_url: leader.photo_url,
          message_title: leader.message_title,
          message: leader.message,
          signature_url: leader.signature_url,
          email: leader.email,
          display_order: leader.display_order,
          is_active: leader.is_active,
          published: leader.published,
        }
      : {
          name: "",
          designation: "Chairman",
          photo_url: "",
          message_title: "",
          message: emptyMessage,
          signature_url: null,
          email: null,
          display_order: 0,
          is_active: true,
          published: false,
        },
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"photo" | "signature" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const signatureInput = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit],
    content: draft.message,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) =>
      setDraft((currentDraft) => ({
        ...currentDraft,
        message: current.getJSON() as RichDocument,
      })),
  });

  async function upload(file: File, target: "photo" | "signature") {
    setUploading(target);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/uploads", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      setDraft((current) => ({ ...current, [`${target === "photo" ? "photo" : "signature"}_url`]: result.url }));
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
      setError(saveError instanceof Error ? saveError.message : "Could not save leader.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="leadership-admin-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="leadership-editor" onSubmit={submit}>
        <header className="leadership-editor-header">
          <div>
            <span>LEADERSHIP CMS</span>
            <h2>{leader ? "Edit leader" : "Add leader"}</h2>
          </div>
          <button type="button" className="leadership-icon-button" aria-label="Close editor" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="leadership-editor-body">
          <div className="leadership-form-grid">
            <label>Full name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Enter full name" /></label>
            <label>Designation<select value={draft.designation} onChange={(event) => setDraft({ ...draft, designation: event.target.value as LeaderDesignation })}><option>Chairman</option><option>Joint Secretary</option><option>Principal</option></select></label>
            <label>Message title<input required value={draft.message_title} onChange={(event) => setDraft({ ...draft, message_title: event.target.value })} placeholder="A welcome message" /></label>
            <label>Email address<input type="email" value={draft.email ?? ""} onChange={(event) => setDraft({ ...draft, email: event.target.value || null })} placeholder="Optional" /></label>
            <label className="leadership-full-field">Profile photo URL
              <span className="leadership-upload-field">
                <input required value={draft.photo_url} onChange={(event) => setDraft({ ...draft, photo_url: event.target.value })} placeholder="Paste an image URL or upload a photo" />
                <button type="button" onClick={() => photoInput.current?.click()} disabled={uploading === "photo"}>{uploading === "photo" ? <LoaderCircle size={15} className="leadership-spin" /> : <Upload size={15} />} Upload</button>
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, "photo"); event.target.value = ""; }} />
              </span>
              {draft.photo_url && <Image className="leadership-image-preview" src={draft.photo_url} alt="Profile photo preview" width={74} height={74} unoptimized />}
            </label>
            <label className="leadership-full-field">Welcome message
              <div className="leadership-rich-editor">
                <div className="leadership-editor-toolbar" aria-label="Text formatting">
                  <button type="button" title="Bold" aria-label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={15} /></button>
                  <button type="button" title="Italic" aria-label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={15} /></button>
                  <button type="button" title="Bulleted list" aria-label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={15} /></button>
                  <button type="button" title="Numbered list" aria-label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></button>
                  <button type="button" title="Quote" aria-label="Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={15} /></button>
                </div>
                <EditorContent editor={editor} />
              </div>
            </label>
            <label className="leadership-full-field">Signature image URL <span className="leadership-upload-field"><input value={draft.signature_url ?? ""} onChange={(event) => setDraft({ ...draft, signature_url: event.target.value || null })} placeholder="Optional" /><button type="button" onClick={() => signatureInput.current?.click()} disabled={uploading === "signature"}>{uploading === "signature" ? <LoaderCircle size={15} className="leadership-spin" /> : <Upload size={15} />} Upload</button><input ref={signatureInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, "signature"); event.target.value = ""; }} /></span></label>
            <label>Display order<input type="number" min="0" step="1" value={draft.display_order} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} /></label>
          </div>

          <div className="leadership-status-controls">
            <label><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /><span><strong>Active</strong><small>Include this profile in leadership listings.</small></span></label>
            <label><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /><span><strong>Published</strong><small>Make this profile visible on the homepage.</small></span></label>
          </div>
          {error && <p className="leadership-admin-error" role="alert">{error}</p>}
        </div>

        <footer className="leadership-editor-footer">
          <button type="button" className="leadership-admin-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="leadership-admin-primary" disabled={saving || uploading !== null}>{saving ? <LoaderCircle size={15} className="leadership-spin" /> : <Save size={15} />} Save leader</button>
        </footer>
      </form>
    </div>
  );
}

function LeaderPreview({ leader, onClose }: { leader: Leader; onClose: () => void }) {
  return (
    <div className="leadership-admin-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="leadership-preview-modal" role="dialog" aria-modal="true" aria-labelledby="leadership-preview-title">
        <button type="button" className="leadership-icon-button leadership-preview-close" aria-label="Close preview" onClick={onClose}><X size={18} /></button>
        <Image className="leadership-preview-photo" src={leader.photo_url} alt={leader.name} width={95} height={95} unoptimized />
        <span className="leadership-preview-role">{leader.designation}</span>
        <h2 id="leadership-preview-title">{leader.name}</h2>
        <h3>{leader.message_title}</h3>
        <div className="leadership-preview-message"><RichContent document={leader.message} /></div>
        {leader.signature_url && <Image className="leadership-preview-signature" src={leader.signature_url} alt={`${leader.name}'s signature`} width={140} height={65} unoptimized />}
        {leader.email && <a href={`mailto:${leader.email}`}>{leader.email}</a>}
      </section>
    </div>
  );
}

export default function LeadershipAdminPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Leader | null | undefined>(undefined);
  const [previewing, setPreviewing] = useState<Leader | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function fetchLeaders() {
    return api<{ leaders: Leader[] }>("/api/leaders?drafts=true", { cache: "no-store" });
  }

  async function loadLeaders() {
    const result = await fetchLeaders();
    setLeaders(result.leaders);
    setMessage(null);
  }

  useEffect(() => {
    let cancelled = false;
    fetchLeaders()
      .then((result) => {
        if (cancelled) return;
        setLeaders(result.leaders);
        setMessage(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load leaders.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function saveLeader(draft: LeaderDraft) {
    if (editing === undefined) return;
    if (editing) await api(`/api/leaders/${editing.id}`, { method: "PATCH", body: JSON.stringify(draft) });
    else await api("/api/leaders", { method: "POST", body: JSON.stringify(draft) });
    setEditing(undefined);
    try {
      await loadLeaders();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not refresh leaders.");
    }
  }

  async function updateLeader(id: string, values: Partial<LeaderDraft>) {
    try {
      const result = await api<{ leader: Leader }>(`/api/leaders/${id}`, { method: "PATCH", body: JSON.stringify(values) });
      setLeaders((current) => current.map((leader) => leader.id === id ? result.leader : leader));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update leader.");
    }
  }

  async function reorder(nextLeaders: Leader[]) {
    const ordered = nextLeaders.map((leader, index) => ({ ...leader, display_order: index }));
    const previous = leaders;
    setLeaders(ordered);
    try {
      await api("/api/leaders", { method: "PATCH", body: JSON.stringify({ leaders: ordered.map(({ id, display_order }) => ({ id, display_order })) }) });
      setMessage(null);
    } catch (error) {
      setLeaders(previous);
      setMessage(error instanceof Error ? error.message : "Could not reorder leaders.");
    }
  }

  function dropOn(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const next = [...leaders];
    const from = next.findIndex((leader) => leader.id === draggedId);
    const to = next.findIndex((leader) => leader.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggedId(null);
    void reorder(next);
  }

  async function deleteLeader(leader: Leader) {
    if (!window.confirm(`Delete ${leader.name}? This cannot be undone.`)) return;
    try {
      await api(`/api/leaders/${leader.id}`, { method: "DELETE" });
      setLeaders((current) => current.filter((item) => item.id !== leader.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete leader.");
    }
  }

  return (
    <AdminShell currentSection="leadership">
      <main className="leadership-admin-main">
        <header className="leadership-admin-topbar"><span>CMS / Leadership</span><span>Supabase connected</span></header>
        <div className="leadership-admin-content">
          <div className="leadership-admin-heading">
            <div><span className="leadership-admin-eyebrow">HOMEPAGE CONTENT</span><h1>Leadership Manager</h1><p>Manage leadership profiles, welcome messages, and homepage visibility.</p></div>
            <button type="button" className="leadership-admin-primary" onClick={() => setEditing(null)}><Plus size={16} /> Add leader</button>
          </div>

          <section className="leadership-list-panel" aria-label="Leadership profiles">
            <div className="leadership-list-header"><div><strong>Leaders</strong><span>{leaders.length} {leaders.length === 1 ? "profile" : "profiles"}</span></div><span>Drag rows to reorder</span></div>
            {message && <p className="leadership-admin-error leadership-list-error" role="alert">{message}</p>}
            {loading ? <div className="leadership-loading"><LoaderCircle className="leadership-spin" size={21} /> Loading leadersΓÇª</div> : leaders.length === 0 ? <div className="leadership-empty"><strong>No leader profiles yet</strong><span>Add a leader to begin building the homepage section.</span><button type="button" className="leadership-admin-secondary" onClick={() => setEditing(null)}><Plus size={15} /> Add the first leader</button></div> : (
              <div className="leadership-list">
                {leaders.map((leader, index) => (
                  <article className={`leadership-row ${draggedId === leader.id ? "is-dragging" : ""}`} key={leader.id} draggable onDragStart={() => setDraggedId(leader.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(event, leader.id)}>
                    <button type="button" className="leadership-drag-handle" title="Drag to reorder" aria-label={`Drag ${leader.name} to reorder`}><GripVertical size={17} /></button>
                    <Image src={leader.photo_url} alt="" className="leadership-row-photo" width={44} height={44} unoptimized />
                    <div className="leadership-row-info"><strong>{leader.name}</strong><span>{leader.designation} ┬╖ {leader.message_title}</span></div>
                    <div className="leadership-row-status"><span className={`leadership-status ${leader.published ? "is-published" : "is-draft"}`}>{leader.published ? "Published" : "Draft"}</span><span className={`leadership-status ${leader.is_active ? "is-active" : "is-inactive"}`}>{leader.is_active ? "Active" : "Inactive"}</span></div>
                    <div className="leadership-row-actions">
                      <button type="button" title="Move up" aria-label={`Move ${leader.name} up`} disabled={index === 0} onClick={() => void reorder([...leaders.slice(0, index - 1), leader, leaders[index - 1], ...leaders.slice(index + 1)])}><ArrowUp size={15} /></button>
                      <button type="button" title="Move down" aria-label={`Move ${leader.name} down`} disabled={index === leaders.length - 1} onClick={() => void reorder([...leaders.slice(0, index), leaders[index + 1], leader, ...leaders.slice(index + 2)])}><ArrowDown size={15} /></button>
                      <button type="button" title="Preview" aria-label={`Preview ${leader.name}`} onClick={() => setPreviewing(leader)}><Eye size={15} /></button>
                      <button type="button" title={leader.published ? "Unpublish" : "Publish"} aria-label={leader.published ? `Unpublish ${leader.name}` : `Publish ${leader.name}`} onClick={() => void updateLeader(leader.id, { published: !leader.published })}><span className={`leadership-publish-indicator ${leader.published ? "is-on" : ""}`} /></button>
                      <button type="button" title="Edit" aria-label={`Edit ${leader.name}`} onClick={() => setEditing(leader)}><Pencil size={15} /></button>
                      <button type="button" title="Delete" aria-label={`Delete ${leader.name}`} onClick={() => void deleteLeader(leader)}><Trash2 size={15} /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {editing !== undefined && <LeaderEditor key={editing?.id ?? "new"} leader={editing} onClose={() => setEditing(undefined)} onSave={saveLeader} />}
      {previewing && <LeaderPreview leader={previewing} onClose={() => setPreviewing(null)} />}
    </AdminShell>
  );
}
