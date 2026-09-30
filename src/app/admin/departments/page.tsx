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
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bell,
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Eye,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  ListTree,
  LoaderCircle,
  Plus,
  Search,
  Settings,
  Sliders,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  DEFAULT_DEPARTMENTS,
  type Department,
  type FacultyMember,
  type Laboratory,
  type SyllabusItem,
} from "@/lib/departments-data";
import { DepartmentIcon, ICON_OPTIONS } from "@/components/department-icon";
import "@/app/admin/admin.css";
import "@/app/departments/departments.css";

const sideItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { title: "Department Manager", icon: Building2, href: "/admin/departments", active: true },
  { title: "Leadership Manager", icon: Users, href: "/admin/leadership" },
  { title: "Navigation Manager", icon: ListTree, href: "/admin/navigation" },
  { title: "Hero Content Manager", icon: Sliders, href: "/admin/hero" },
  { title: "Popup Manager", icon: ImageIcon, href: "/admin/popup-manager" },
  { title: "Pages", icon: BookOpen, href: "/admin/navigation" },
  { title: "Notices", icon: Bell, href: "/admin/dashboard" },
  { title: "Gallery", icon: ImageIcon, href: "/admin/dashboard" },
  { title: "Faculty", icon: Users, href: "/admin/dashboard" },
  { title: "Placements", icon: ArrowUpRight, href: "/admin/dashboard" },
  { title: "Settings", icon: Settings, href: "/admin/dashboard" },
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
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return result as T;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MIGRATION_SQL = `-- Run this in your Supabase SQL Editor:
create table if not exists public.departments (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  short_code    text        not null,
  slug          text        not null unique,
  icon_url      text,
  hero_image    text,
  description   text,
  hod_name      text,
  hod_photo     text,
  intake        text        default '60 Seats',
  duration      text        default '4 Years / 8 Semesters',
  display_order integer     not null default 0,
  button_text   text        default 'Explore Department',
  theme         text        default 'blue',
  is_active     boolean     not null default true,
  published     boolean     not null default true,
  vision        text,
  mission       text,
  laboratories  jsonb       default '[]'::jsonb,
  faculty       jsonb       default '[]'::jsonb,
  syllabus      jsonb       default '[]'::jsonb,
  gallery       jsonb       default '[]'::jsonb,
  placements    jsonb       default '{}'::jsonb,
  contact       jsonb       default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists departments_order_idx
  on public.departments(display_order, is_active, published);

create index if not exists departments_slug_idx
  on public.departments(slug);

alter table public.departments enable row level security;

create policy "public read published departments"
  on public.departments for select to anon, authenticated
  using (published = true and is_active = true);

create policy "admins read all departments"
  on public.departments for select to authenticated
  using (public.is_navigation_admin());

create policy "admins manage departments"
  on public.departments for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());
`;

const emptyDraft: Partial<Department> = {
  name: "",
  short_code: "",
  slug: "",
  icon_url: "cpu",
  theme: "blue",
  hero_image: "",
  description: "",
  hod_name: "",
  hod_photo: "",
  intake: "60 Seats",
  duration: "4 Years / 8 Semesters",
  display_order: 0,
  button_text: "Explore Department",
  is_active: true,
  published: true,
  vision: "",
  mission: "",
  laboratories: [],
  faculty: [],
  syllabus: [],
  gallery: [],
  placements: {
    highest_package: "",
    average_package: "",
    placed_percentage: "",
    top_companies: [],
  },
  contact: {
    email: "",
    phone: "",
    cabin: "",
    office_hours: "Monday - Friday: 9:00 AM - 5:00 PM",
  },
};

/* ──────────────────────────────────────────
   Department Editor Modal
────────────────────────────────────────── */
function DepartmentEditor({
  department,
  onClose,
  onSave,
}: {
  department: Department | null;
  onClose: () => void;
  onSave: (draft: Partial<Department>) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<
    "basic" | "visuals" | "academic" | "faculty" | "placements"
  >("basic");
  const [draft, setDraft] = useState<Partial<Department>>(
    department
      ? {
          ...department,
          laboratories: department.laboratories ?? [],
          faculty: department.faculty ?? [],
          syllabus: department.syllabus ?? [],
          gallery: department.gallery ?? [],
          placements: department.placements ?? { top_companies: [] },
          contact: department.contact ?? {},
        }
      : { ...emptyDraft }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const hodFileRef = useRef<HTMLInputElement>(null);
  const [companiesInput, setCompaniesInput] = useState(
    draft.placements?.top_companies?.join(", ") || ""
  );

  function set<K extends keyof Department>(key: K, value: Department[K]) {
    setDraft((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "name" && (!prev.slug || prev.slug === slugify(prev.name || ""))) {
        updated.slug = slugify(String(value));
      }
      return updated;
    });
  }

  async function handleFileUpload(file: File, target: "hero" | "hod") {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ url: string }>("/api/uploads", {
        method: "POST",
        body: fd,
      });
      if (res?.url) {
        if (target === "hero") set("hero_image", res.url);
        else set("hod_photo", res.url);
        return;
      }
    } catch {
      // Fallback: Read as base64 Data URL so local image preview always works
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (target === "hero") set("hero_image", url);
        else set("hod_photo", url);
      };
      reader.readAsDataURL(file);
    }
  }

  // Labs manager
  function addLab() {
    const labs = [...(draft.laboratories || [])];
    labs.push({
      name: "New Laboratory",
      description: "State-of-the-art facility for practical experimentation.",
      capacity: "30 Students",
      incharge: "",
    });
    set("laboratories", labs);
  }

  function updateLab(index: number, field: keyof Laboratory, val: string) {
    const labs = [...(draft.laboratories || [])];
    labs[index] = { ...labs[index], [field]: val };
    set("laboratories", labs);
  }

  function removeLab(index: number) {
    const labs = (draft.laboratories || []).filter((_, i) => i !== index);
    set("laboratories", labs);
  }

  // Faculty manager
  function addFaculty() {
    const fac = [...(draft.faculty || [])];
    fac.push({
      name: "Faculty Member Name",
      designation: "Assistant Professor",
      qualification: "M.Tech / Ph.D.",
      experience: "5 Years",
    });
    set("faculty", fac);
  }

  function updateFaculty(index: number, field: keyof FacultyMember, val: string) {
    const fac = [...(draft.faculty || [])];
    fac[index] = { ...fac[index], [field]: val };
    set("faculty", fac);
  }

  function removeFaculty(index: number) {
    const fac = (draft.faculty || []).filter((_, i) => i !== index);
    set("faculty", fac);
  }

  // Syllabus manager
  function addSyllabus() {
    const syl = [...(draft.syllabus || [])];
    syl.push({
      title: "Course Curriculum Handbook",
      semester: "Semesters 1-8",
      url: "#",
      file_size: "3.2 MB",
    });
    set("syllabus", syl);
  }

  function updateSyllabus(index: number, field: keyof SyllabusItem, val: string) {
    const syl = [...(draft.syllabus || [])];
    syl[index] = { ...syl[index], [field]: val };
    set("syllabus", syl);
  }

  function removeSyllabus(index: number) {
    const syl = (draft.syllabus || []).filter((_, i) => i !== index);
    set("syllabus", syl);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.name?.trim()) {
      setError("Please enter the Department Name.");
      return;
    }
    if (!draft.short_code?.trim()) {
      setError("Please enter the Short Code (e.g. CE, AI, ME).");
      return;
    }
    if (!draft.slug?.trim()) {
      setError("Please specify the Page Slug.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const companies = companiesInput
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const finalDraft = {
        ...draft,
        placements: {
          ...draft.placements,
          top_companies: companies,
        },
      };

      await onSave(finalDraft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal modal-wide"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 960 }}
      >
        <div className="modal-header">
          <div>
            <span>CMS DEPARTMENT EDITOR</span>
            <h2>{department ? `Edit: ${department.name}` : "Create New Department"}</h2>
          </div>
          <button
            type="button"
            className="action-more"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "8px 22px",
            borderBottom: "1px solid var(--admin-line)",
            background: "#fafbfc",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            className={`admin-small-button ${activeTab === "basic" ? "active" : ""}`}
            style={activeTab === "basic" ? { background: "#17365f", color: "#fff" } : {}}
            onClick={() => setActiveTab("basic")}
          >
            1. Basic & Card
          </button>
          <button
            type="button"
            className={`admin-small-button ${activeTab === "visuals" ? "active" : ""}`}
            style={activeTab === "visuals" ? { background: "#17365f", color: "#fff" } : {}}
            onClick={() => setActiveTab("visuals")}
          >
            2. Hero & HOD
          </button>
          <button
            type="button"
            className={`admin-small-button ${activeTab === "academic" ? "active" : ""}`}
            style={activeTab === "academic" ? { background: "#17365f", color: "#fff" } : {}}
            onClick={() => setActiveTab("academic")}
          >
            3. Vision, Mission & Labs
          </button>
          <button
            type="button"
            className={`admin-small-button ${activeTab === "faculty" ? "active" : ""}`}
            style={activeTab === "faculty" ? { background: "#17365f", color: "#fff" } : {}}
            onClick={() => setActiveTab("faculty")}
          >
            4. Faculty & Syllabus
          </button>
          <button
            type="button"
            className={`admin-small-button ${activeTab === "placements" ? "active" : ""}`}
            style={activeTab === "placements" ? { background: "#17365f", color: "#fff" } : {}}
            onClick={() => setActiveTab("placements")}
          >
            5. Placements & Contact
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form" style={{ padding: "20px 22px" }}>
            {error && (
              <div className="admin-alert error">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)}>
                  <X size={13} />
                </button>
              </div>
            )}

            {/* TAB 1: BASIC & CARD */}
            {activeTab === "basic" && (
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <label>
                      Department Name *
                      <input
                        type="text"
                        placeholder="e.g. Computer Engineering"
                        value={draft.name || ""}
                        onChange={(e) => set("name", e.target.value)}
                        required
                      />
                    </label>

                    <div className="cms-form-grid">
                      <label>
                        Short Code *
                        <input
                          type="text"
                          placeholder="e.g. CE, AI, ME"
                          value={draft.short_code || ""}
                          onChange={(e) => set("short_code", e.target.value.toUpperCase())}
                          required
                        />
                      </label>

                      <label>
                        Card Theme Accent
                        <select
                          value={draft.theme || "blue"}
                          onChange={(e) => set("theme", e.target.value)}
                          style={{
                            height: 35,
                            border: "1px solid #dfe4eb",
                            borderRadius: 4,
                            padding: "0 8px",
                            fontSize: 11,
                          }}
                        >
                          <option value="blue">Blue Accent (Tech)</option>
                          <option value="red">Red Accent (AI / Electrical)</option>
                          <option value="gold">Gold Accent (Mechanical / Robotics)</option>
                          <option value="green">Green Accent (Civil / Environment)</option>
                        </select>
                      </label>
                    </div>

                    <label>
                      Page Slug *
                      <div className="slug-field">
                        <span>/departments/</span>
                        <input
                          type="text"
                          value={draft.slug || ""}
                          onChange={(e) => set("slug", slugify(e.target.value))}
                          placeholder="computer-engineering"
                          required
                        />
                      </div>
                      <small className="field-hint">
                        URL for the dynamic detail page: /departments/{draft.slug || "slug"}
                      </small>
                    </label>

                    <label>
                      Card Description
                      <textarea
                        rows={2}
                        placeholder="Brief 1-2 sentence description shown on the public homepage card."
                        value={draft.description || ""}
                        onChange={(e) => set("description", e.target.value)}
                      />
                    </label>

                    <div className="cms-form-grid">
                      <label>
                        Button Text
                        <input
                          type="text"
                          placeholder="Explore Department"
                          value={draft.button_text || "Explore Department"}
                          onChange={(e) => set("button_text", e.target.value)}
                        />
                      </label>
                      <label>
                        Display Order
                        <input
                          type="number"
                          value={draft.display_order ?? 0}
                          onChange={(e) => set("display_order", parseInt(e.target.value) || 0)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Live Card Preview */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: "#a47714",
                        marginBottom: 12,
                        textTransform: "uppercase",
                      }}
                    >
                      Live Public Card Preview
                    </span>

                    <div
                      className={`dynamic-dept-card theme-${draft.theme || "blue"}`}
                      style={{
                        width: "100%",
                        maxWidth: 280,
                        pointerEvents: "none",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="dynamic-dept-top">
                        <span className="dynamic-dept-icon-wrap">
                          <DepartmentIcon nameOrUrl={draft.icon_url} size={22} />
                        </span>
                        <span className="dynamic-dept-number">
                          {String(draft.display_order || 1).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="dynamic-dept-code">
                        {draft.short_code || "CODE"}
                      </span>
                      <h3 className="dynamic-dept-title">
                        {draft.name || "Department Name"}
                      </h3>
                      {draft.description && (
                        <p className="dynamic-dept-desc">{draft.description}</p>
                      )}
                      <div className="dynamic-dept-link">
                        <span>{draft.button_text || "Explore Department"}</span>
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label style={{ display: "block", marginBottom: 8 }}>
                    Department Icon (Choose icon or enter image URL)
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 8,
                      maxHeight: 140,
                      overflowY: "auto",
                      border: "1px solid #dfe4eb",
                      borderRadius: 6,
                      padding: 8,
                      background: "#fff",
                    }}
                  >
                    {ICON_OPTIONS.map((opt) => {
                      const IconComp = opt.icon;
                      const isSelected = draft.icon_url === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => set("icon_url", opt.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 4,
                            border: isSelected ? "1px solid #2563eb" : "1px solid #e2e8f0",
                            background: isSelected ? "#eff6ff" : "#fff",
                            cursor: "pointer",
                            fontSize: 10,
                            textAlign: "left",
                          }}
                        >
                          <IconComp size={16} color={isSelected ? "#2563eb" : "#475569"} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="Or paste custom icon image/SVG URL (https://...)"
                      value={draft.icon_url || ""}
                      onChange={(e) => set("icon_url", e.target.value)}
                    />
                  </div>
                </div>

                {/* Switches */}
                <div className="form-switch-row">
                  <span>
                    <strong>Published Status</strong>
                    <small>Make department publicly visible on the website</small>
                  </span>
                  <button
                    type="button"
                    className={`switch ${draft.published ? "is-on" : ""}`}
                    onClick={() => set("published", !draft.published)}
                  >
                    <span />
                  </button>
                </div>

                <div className="form-switch-row">
                  <span>
                    <strong>Active Status</strong>
                    <small>Enable department in admissions and program lists</small>
                  </span>
                  <button
                    type="button"
                    className={`switch ${draft.is_active ? "is-on" : ""}`}
                    onClick={() => set("is_active", !draft.is_active)}
                  >
                    <span />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: HERO & HOD */}
            {activeTab === "visuals" && (
              <div style={{ display: "grid", gap: 18 }}>
                <div className="cms-form-grid">
                  <label>
                    Intake Capacity
                    <input
                      type="text"
                      placeholder="e.g. 120 Seats"
                      value={draft.intake || ""}
                      onChange={(e) => set("intake", e.target.value)}
                    />
                  </label>
                  <label>
                    Program Duration
                    <input
                      type="text"
                      placeholder="e.g. 4 Years / 8 Semesters"
                      value={draft.duration || ""}
                      onChange={(e) => set("duration", e.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Hero Banner Image
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={draft.hero_image || ""}
                      onChange={(e) => set("hero_image", e.target.value)}
                    />
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => heroFileRef.current?.click()}
                    >
                      <Upload size={13} /> Upload
                    </button>
                    <input
                      ref={heroFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "hero");
                      }}
                    />
                  </div>
                  {draft.hero_image && (
                    <div style={{ marginTop: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.hero_image}
                        alt="Hero Preview"
                        style={{ height: 110, width: "100%", objectFit: "cover", borderRadius: 6 }}
                      />
                    </div>
                  )}
                </label>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 16,
                    background: "#fcfdfe",
                  }}
                >
                  <h4 style={{ fontSize: 13, color: "#10264a", marginBottom: 12 }}>
                    Head of Department (HOD) Profile
                  </h4>
                  <div className="cms-form-grid">
                    <label>
                      HOD Full Name
                      <input
                        type="text"
                        placeholder="e.g. Dr. S. R. Mane"
                        value={draft.hod_name || ""}
                        onChange={(e) => set("hod_name", e.target.value)}
                      />
                    </label>
                    <label>
                      HOD Photo URL
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={draft.hod_photo || ""}
                          onChange={(e) => set("hod_photo", e.target.value)}
                        />
                        <button
                          type="button"
                          className="admin-secondary-button"
                          onClick={() => hodFileRef.current?.click()}
                        >
                          <Upload size={13} />
                        </button>
                        <input
                          ref={hodFileRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, "hod");
                          }}
                        />
                      </div>
                    </label>
                  </div>
                  {draft.hod_photo && (
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.hod_photo}
                        alt="HOD Preview"
                        style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
                      />
                      <span style={{ fontSize: 11, color: "#64748b" }}>Photo uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ACADEMICS & LABS */}
            {activeTab === "academic" && (
              <div style={{ display: "grid", gap: 18 }}>
                <label>
                  Vision Statement
                  <textarea
                    rows={3}
                    placeholder="Vision of the department..."
                    value={draft.vision || ""}
                    onChange={(e) => set("vision", e.target.value)}
                  />
                </label>

                <label>
                  Mission Statement
                  <textarea
                    rows={3}
                    placeholder="Mission objectives and pedagogical principles..."
                    value={draft.mission || ""}
                    onChange={(e) => set("mission", e.target.value)}
                  />
                </label>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <strong>Laboratories ({draft.laboratories?.length || 0})</strong>
                    <button
                      type="button"
                      className="admin-small-button"
                      onClick={addLab}
                    >
                      <Plus size={13} /> Add Laboratory
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {draft.laboratories?.map((lab, i) => (
                      <div
                        key={i}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          padding: 12,
                          background: "#fff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <input
                            type="text"
                            placeholder="Laboratory Name"
                            value={lab.name}
                            onChange={(e) => updateLab(i, "name", e.target.value)}
                            style={{ fontWeight: 600, flex: 1, marginRight: 8 }}
                          />
                          <button
                            type="button"
                            className="action-more"
                            onClick={() => removeLab(i)}
                          >
                            <Trash2 size={13} color="#b91c1c" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Description / key equipment"
                          value={lab.description}
                          onChange={(e) => updateLab(i, "description", e.target.value)}
                          style={{ marginBottom: 6 }}
                        />
                        <div className="cms-form-grid">
                          <input
                            type="text"
                            placeholder="Capacity (e.g. 40 Workstations)"
                            value={lab.capacity || ""}
                            onChange={(e) => updateLab(i, "capacity", e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Faculty In-Charge"
                            value={lab.incharge || ""}
                            onChange={(e) => updateLab(i, "incharge", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FACULTY & SYLLABUS */}
            {activeTab === "faculty" && (
              <div style={{ display: "grid", gap: 18 }}>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <strong>Faculty Members ({draft.faculty?.length || 0})</strong>
                    <button
                      type="button"
                      className="admin-small-button"
                      onClick={addFaculty}
                    >
                      <Plus size={13} /> Add Faculty
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {draft.faculty?.map((fac, i) => (
                      <div
                        key={i}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          padding: 12,
                          background: "#fff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <input
                            type="text"
                            placeholder="Faculty Name (e.g. Prof. A. B. Joshi)"
                            value={fac.name}
                            onChange={(e) => updateFaculty(i, "name", e.target.value)}
                            style={{ fontWeight: 600, flex: 1, marginRight: 8 }}
                          />
                          <button
                            type="button"
                            className="action-more"
                            onClick={() => removeFaculty(i)}
                          >
                            <Trash2 size={13} color="#b91c1c" />
                          </button>
                        </div>
                        <div className="cms-form-grid" style={{ marginBottom: 6 }}>
                          <input
                            type="text"
                            placeholder="Designation (e.g. Associate Professor)"
                            value={fac.designation}
                            onChange={(e) => updateFaculty(i, "designation", e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Qualification (e.g. Ph.D., M.Tech)"
                            value={fac.qualification}
                            onChange={(e) => updateFaculty(i, "qualification", e.target.value)}
                          />
                        </div>
                        <div className="cms-form-grid">
                          <input
                            type="text"
                            placeholder="Experience (e.g. 12 Years)"
                            value={fac.experience}
                            onChange={(e) => updateFaculty(i, "experience", e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Photo URL"
                            value={fac.photo || ""}
                            onChange={(e) => updateFaculty(i, "photo", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <strong>Syllabus & PDFs ({draft.syllabus?.length || 0})</strong>
                    <button
                      type="button"
                      className="admin-small-button"
                      onClick={addSyllabus}
                    >
                      <Plus size={13} /> Add Syllabus Document
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {draft.syllabus?.map((syl, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          padding: 8,
                          background: "#fff",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Document Title"
                          value={syl.title}
                          onChange={(e) => updateSyllabus(i, "title", e.target.value)}
                          style={{ flex: 1.5 }}
                        />
                        <input
                          type="text"
                          placeholder="Semester"
                          value={syl.semester}
                          onChange={(e) => updateSyllabus(i, "semester", e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          placeholder="File size (e.g. 2.4 MB)"
                          value={syl.file_size || ""}
                          onChange={(e) => updateSyllabus(i, "file_size", e.target.value)}
                          style={{ width: 100 }}
                        />
                        <button
                          type="button"
                          className="action-more"
                          onClick={() => removeSyllabus(i)}
                        >
                          <Trash2 size={13} color="#b91c1c" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PLACEMENTS & CONTACT */}
            {activeTab === "placements" && (
              <div style={{ display: "grid", gap: 18 }}>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 16,
                    background: "#fcfdfe",
                  }}
                >
                  <h4 style={{ fontSize: 13, color: "#10264a", marginBottom: 12 }}>
                    Placement Metrics
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <label>
                      Highest Package
                      <input
                        type="text"
                        placeholder="e.g. ₹14.5 LPA"
                        value={draft.placements?.highest_package || ""}
                        onChange={(e) =>
                          set("placements", {
                            ...draft.placements,
                            highest_package: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Average Package
                      <input
                        type="text"
                        placeholder="e.g. ₹4.8 LPA"
                        value={draft.placements?.average_package || ""}
                        onChange={(e) =>
                          set("placements", {
                            ...draft.placements,
                            average_package: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Placement Rate
                      <input
                        type="text"
                        placeholder="e.g. 95%"
                        value={draft.placements?.placed_percentage || ""}
                        onChange={(e) =>
                          set("placements", {
                            ...draft.placements,
                            placed_percentage: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <label style={{ marginTop: 12 }}>
                    Top Recruiting Companies (Comma separated)
                    <input
                      type="text"
                      placeholder="Tata Consultancy Services, Infosys, Cognizant, KPIT..."
                      value={companiesInput}
                      onChange={(e) => setCompaniesInput(e.target.value)}
                    />
                  </label>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 16,
                    background: "#fcfdfe",
                  }}
                >
                  <h4 style={{ fontSize: 13, color: "#10264a", marginBottom: 12 }}>
                    Department Office & Contact
                  </h4>
                  <div className="cms-form-grid">
                    <label>
                      Official Email
                      <input
                        type="email"
                        placeholder="hod.comp@sanjeevan.edu.in"
                        value={draft.contact?.email || ""}
                        onChange={(e) =>
                          set("contact", { ...draft.contact, email: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Phone Number
                      <input
                        type="text"
                        placeholder="+91 231 2686600"
                        value={draft.contact?.phone || ""}
                        onChange={(e) =>
                          set("contact", { ...draft.contact, phone: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label style={{ marginTop: 10 }}>
                    Cabin / Department Office Location
                    <input
                      type="text"
                      placeholder="Main Engineering Complex, 3rd Floor, Room 304"
                      value={draft.contact?.cabin || ""}
                      onChange={(e) =>
                        set("contact", { ...draft.contact, cabin: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle size={13} className="spinning" /> Saving...
                </>
              ) : (
                <>
                  <Check size={13} /> {department ? "Update Department" : "Create Department"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main Department Manager Page
────────────────────────────────────────── */
export default function DepartmentManagerPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState(true);
  const [search, setSearch] = useState("");
  const [editingDept, setEditingDept] = useState<Department | null | "new">(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadDepartments() {
    try {
      setLoading(true);
      const res = await api<{
        departments: Department[];
        tableReady: boolean;
      }>("/api/departments?drafts=true");

      setDepartments(res.departments ?? DEFAULT_DEPARTMENTS);
      setTableReady(res.tableReady ?? true);
    } catch {
      setDepartments(DEFAULT_DEPARTMENTS);
      setTableReady(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function handleTogglePublish(dept: Department) {
    const nextVal = !dept.published;
    setDepartments((prev) =>
      prev.map((d) => (d.id === dept.id ? { ...d, published: nextVal } : d))
    );

    try {
      await api(`/api/departments/${dept.id}`, {
        method: "PUT",
        body: JSON.stringify({ published: nextVal }),
      });
      setAlertMsg({
        type: "success",
        text: `"${dept.name}" is now ${nextVal ? "Published" : "Unpublished"}.`,
      });
    } catch {
      setAlertMsg({ type: "error", text: "Failed to update publish state." });
      loadDepartments();
    }
  }

  async function handleToggleActive(dept: Department) {
    const nextVal = !dept.is_active;
    setDepartments((prev) =>
      prev.map((d) => (d.id === dept.id ? { ...d, is_active: nextVal } : d))
    );

    try {
      await api(`/api/departments/${dept.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: nextVal }),
      });
      setAlertMsg({
        type: "success",
        text: `"${dept.name}" status set to ${nextVal ? "Active" : "Inactive"}.`,
      });
    } catch {
      setAlertMsg({ type: "error", text: "Failed to update active state." });
      loadDepartments();
    }
  }

  async function handleDelete(dept: Department) {
    if (!confirm(`Are you sure you want to delete the "${dept.name}" department?`)) {
      return;
    }

    try {
      await api(`/api/departments/${dept.id}`, { method: "DELETE" });
      setAlertMsg({ type: "success", text: `Department "${dept.name}" deleted.` });
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    } catch {
      setAlertMsg({ type: "error", text: "Failed to delete department." });
    }
  }

  async function handleSaveDepartment(draft: Partial<Department>) {
    if (editingDept === "new") {
      // Create new
      const nextOrder = departments.length + 1;
      const created = await api<Department>("/api/departments", {
        method: "POST",
        body: JSON.stringify({ ...draft, display_order: draft.display_order || nextOrder }),
      });
      setAlertMsg({ type: "success", text: `Created department "${draft.name}".` });
      setDepartments((prev) => [...prev, created]);
    } else if (editingDept && typeof editingDept === "object") {
      // Update existing
      const updated = await api<Department>(`/api/departments/${editingDept.id}`, {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      setAlertMsg({ type: "success", text: `Updated department "${draft.name}".` });
      setDepartments((prev) =>
        prev.map((d) => (d.id === editingDept.id ? updated : d))
      );
    }
  }

  // Move up/down order
  async function moveItem(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= departments.length) return;

    const list = [...departments];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Recalculate display_order
    const updated = list.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setDepartments(updated);

    try {
      await api("/api/departments", {
        method: "PATCH",
        body: JSON.stringify({
          departments: updated.map((d) => ({ id: d.id, display_order: d.display_order })),
        }),
      });
      setAlertMsg({ type: "success", text: "Department order saved." });
    } catch {
      setAlertMsg({ type: "error", text: "Failed to save order." });
    }
  }

  // Drag and drop
  function onDragStart(e: DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const fromIdx = departments.findIndex((d) => d.id === draggedId);
    const toIdx = departments.findIndex((d) => d.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...departments];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setDepartments(reordered);
  }

  async function onDragEnd() {
    setDraggedId(null);
    const reorderedWithOrder = departments.map((d, idx) => ({
      ...d,
      display_order: idx + 1,
    }));
    setDepartments(reorderedWithOrder);

    try {
      await api("/api/departments", {
        method: "PATCH",
        body: JSON.stringify({
          departments: reorderedWithOrder.map((d) => ({
            id: d.id,
            display_order: d.display_order,
          })),
        }),
      });
      setAlertMsg({ type: "success", text: "New department order saved." });
    } catch {
      setAlertMsg({ type: "error", text: "Failed to save order." });
    }
  }

  const filtered = departments.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.short_code?.toLowerCase().includes(q) ||
      d.slug?.toLowerCase().includes(q)
    );
  });

  const totalPublished = departments.filter((d) => d.published).length;
  const totalActive = departments.filter((d) => d.is_active).length;

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">S</div>
          <span>
            <strong>Sanjeevan CMS</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </div>

        <div className="admin-workspace">
          <div className="workspace-badge">SG</div>
          <span>
            <strong>Main Campus Portal</strong>
            <small>Production Environment</small>
          </span>
        </div>

        <span className="sidebar-label">CORE MODULES</span>
        <nav className="admin-side-nav">
          {sideItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`side-link ${item.active ? "active" : ""}`}
              >
                <Icon size={15} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={16} />
            <strong>Department Manager</strong>
            <span>Changes reflect instantly on public website cards.</span>
          </div>
          <Link href="/" target="_blank" className="public-site-link">
            <span>View Public Website</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Admin</span>
            <ChevronRight size={12} />
            <strong>Department Manager</strong>
          </div>

          <div className="topbar-actions">
            <div className="environment-tag">
              <i /> Connected: Supabase
            </div>
            <Link
              href="/"
              target="_blank"
              className="admin-secondary-button"
              style={{ fontSize: 10, padding: "0 10px" }}
            >
              <Eye size={13} /> View Live Site
            </Link>
          </div>
        </header>

        <div className="admin-content">
          {/* Header */}
          <div className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">ACADEMIC CMS &middot; DYNAMIC MODULE</span>
              <h1>Department Manager</h1>
              <p>
                Manage public department cards, intake details, laboratory facilities, faculty, and syllabi.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => setEditingDept("new")}
              >
                <Plus size={14} /> Add Department
              </button>
            </div>
          </div>

          {/* Database Setup Banner if table is not yet generated */}
          {!tableReady && (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 24,
                color: "#92400e",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <strong style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                    Supabase Schema Initialization Required
                  </strong>
                  <p style={{ margin: 0, fontSize: 11, color: "#78350f" }}>
                    The <code>departments</code> table has not been created in your Supabase project yet. Running in offline/seeded mode.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    navigator.clipboard.writeText(MIGRATION_SQL);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2500);
                  }}
                  style={{ background: "#fff", borderColor: "#fcd34d" }}
                >
                  {copiedSql ? (
                    <>
                      <Check size={13} color="#059669" /> SQL Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy Migration SQL
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Alert Message */}
          {alertMsg && (
            <div className={`admin-alert ${alertMsg.type}`}>
              <span>{alertMsg.text}</span>
              <button type="button" onClick={() => setAlertMsg(null)}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* Top Summary Stats */}
          <div className="admin-stats">
            <div>
              <span>Total Departments</span>
              <strong>{departments.length}</strong>
              <small>All registered faculties</small>
            </div>
            <div>
              <span>Published on Website</span>
              <strong style={{ color: "#2563eb" }}>{totalPublished}</strong>
              <small>Visible to visitors</small>
            </div>
            <div>
              <span>Active in Admissions</span>
              <strong style={{ color: "#059669" }}>{totalActive}</strong>
              <small>Current intake active</small>
            </div>
            <div>
              <span>Quick Preview</span>
              <strong style={{ fontSize: 13, marginTop: 10 }}>
                <Link
                  href="/departments"
                  target="_blank"
                  style={{ color: "#a47714", display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  Browse Directory <ArrowUpRight size={14} />
                </Link>
              </strong>
              <small>Opens /departments</small>
            </div>
          </div>

          {/* Table Panel */}
          <div className="manager-panel">
            <div className="panel-heading">
              <div>
                <h2>Configured Departments ({departments.length})</h2>
                <p>Drag rows using the grip handle or use up/down arrows to reorder.</p>
              </div>
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => setEditingDept("new")}
              >
                <Plus size={13} /> New Department
              </button>
            </div>

            {/* Toolbar */}
            <div className="table-toolbar">
              <div className="admin-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search by department name, code, or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span>Showing {filtered.length} of {departments.length} departments</span>
            </div>

            {/* Department Table */}
            <div className="menu-table-wrap">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>Order</th>
                    <th>Icon</th>
                    <th>Department Name & Slug</th>
                    <th>Code</th>
                    <th>Intake</th>
                    <th>Active</th>
                    <th>Published</th>
                    <th style={{ textAlign: "right", paddingRight: 18 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="table-empty">
                        <LoaderCircle size={16} className="spinning" /> Loading departments...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="table-empty">
                        No departments found. Click &quot;Add Department&quot; above to create one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((dept, idx) => (
                      <tr
                        key={dept.id}
                        className="menu-row"
                        draggable
                        onDragStart={(e) => onDragStart(e, dept.id)}
                        onDragOver={(e) => onDragOver(e, dept.id)}
                        onDragEnd={onDragEnd}
                        style={{
                          opacity: draggedId === dept.id ? 0.4 : 1,
                          cursor: "grab",
                        }}
                      >
                        {/* Order & Grip */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <GripVertical size={14} color="#94a3b8" />
                            <span style={{ fontWeight: 700, fontSize: 11, color: "#64748b" }}>
                              {String(dept.display_order || idx + 1).padStart(2, "0")}
                            </span>
                          </div>
                        </td>

                        {/* Icon */}
                        <td>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: "#f1f5f9",
                              display: "grid",
                              placeItems: "center",
                              color: "#1e3a8a",
                            }}
                          >
                            <DepartmentIcon nameOrUrl={dept.icon_url} size={18} />
                          </div>
                        </td>

                        {/* Name & Slug */}
                        <td>
                          <div className="menu-title-cell">
                            <strong>{dept.name}</strong>
                            <small>/departments/{dept.slug}</small>
                          </div>
                        </td>

                        {/* Short Code */}
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              fontWeight: 700,
                              fontSize: 10,
                            }}
                          >
                            {dept.short_code}
                          </span>
                        </td>

                        {/* Intake */}
                        <td>
                          <span style={{ fontSize: 11, color: "#475569" }}>
                            {dept.intake || "60 Seats"}
                          </span>
                        </td>

                        {/* Active Switch */}
                        <td>
                          <button
                            type="button"
                            className={`switch ${dept.is_active ? "is-on" : ""}`}
                            onClick={() => handleToggleActive(dept)}
                            title={dept.is_active ? "Disable Department" : "Enable Department"}
                          >
                            <span />
                          </button>
                        </td>

                        {/* Published Switch */}
                        <td>
                          <button
                            type="button"
                            className={`switch ${dept.published ? "is-on" : ""}`}
                            onClick={() => handleTogglePublish(dept)}
                            title={dept.published ? "Unpublish" : "Publish"}
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
                            {/* Move Up */}
                            <button
                              type="button"
                              className="action-more"
                              disabled={idx === 0}
                              onClick={() => moveItem(idx, "up")}
                              title="Move Up"
                              style={{ opacity: idx === 0 ? 0.3 : 1 }}
                            >
                              <ArrowUp size={12} />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              className="action-more"
                              disabled={idx === departments.length - 1}
                              onClick={() => moveItem(idx, "down")}
                              title="Move Down"
                              style={{ opacity: idx === departments.length - 1 ? 0.3 : 1 }}
                            >
                              <ArrowDown size={12} />
                            </button>

                            {/* Live View */}
                            <Link
                              href={`/departments/${dept.slug}`}
                              target="_blank"
                              className="action-more"
                              title="View Public Page"
                            >
                              <ExternalLink size={12} />
                            </Link>

                            {/* Edit */}
                            <button
                              type="button"
                              className="admin-small-button"
                              onClick={() => setEditingDept(dept)}
                            >
                              Edit
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              className="action-more"
                              onClick={() => handleDelete(dept)}
                              title="Delete Department"
                            >
                              <Trash2 size={12} color="#dc2626" />
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
                Tip: Changes made here update both the <strong>&ldquo;Make something that matters&rdquo;</strong> homepage grid and the dedicated <strong>/departments/[slug]</strong> pages.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      {editingDept && (
        <DepartmentEditor
          department={editingDept === "new" ? null : editingDept}
          onClose={() => setEditingDept(null)}
          onSave={handleSaveDepartment}
        />
      )}
    </div>
  );
}
