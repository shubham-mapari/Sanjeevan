import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Phone,
} from "lucide-react";
import {
  getAllDepartmentSlugs,
  getDepartmentBySlug,
  getDepartmentFeatures,
  getDepartmentHOD,
  getDepartmentFaculty,
  getDepartmentLabs,
  getDepartmentGallery,
  type DepartmentFeature,
} from "@/lib/departments-data";
import { RichContent } from "@/components/rich-content";
import "@/app/departments/departments.css";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getAllDepartmentSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);
  if (!dept) return { title: "Department Not Found | Sanjeevan" };
  return {
    title: `${dept.name} (${dept.short_code}) | Sanjeevan Group of Institutions`,
    description:
      dept.description ||
      `Explore ${dept.name} at Sanjeevan Group of Institutions, Panhala.`,
    openGraph: {
      title: `${dept.name} (${dept.short_code})`,
      description: dept.description || undefined,
      images: dept.hero_image ? [dept.hero_image] : undefined,
    },
  };
}

// Render a single feature section inline
function FeatureSection({ feature }: { feature: DepartmentFeature }) {
  return (
    <section
      className="dept-section"
      id={feature.slug}
      style={{ scrollMarginTop: "72px" }}
    >
      <div className="page-wrap">
        <div className="dept-section-header">
          <span className="dept-section-kicker">{feature.name}</span>
          <h2>{feature.name}</h2>
          {feature.short_description && (
            <p style={{ marginTop: 8, color: "#475569", maxWidth: 700 }}>
              {feature.short_description}
            </p>
          )}
        </div>

        <div className="dept-feature-body">
          {/* Cover image */}
          {feature.cover_image && (
            <div className="dept-feature-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.cover_image}
                alt={feature.name}
                className="dept-feature-cover-img"
              />
            </div>
          )}

          {/* Rich description */}
          {feature.full_description && (
            <div className="dept-feature-content cms-article">
              <RichContent document={feature.full_description as Parameters<typeof RichContent>[0]["document"]} />
            </div>
          )}

          {/* Image gallery */}
          {feature.images && feature.images.length > 0 && (
            <div className="dept-feature-gallery">
              <h3 className="dept-sub-heading">Gallery</h3>
              <div className="dept-gallery-grid">
                {feature.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt={img.caption ?? feature.name}
                    className="dept-gallery-item"
                    title={img.caption ?? undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {feature.documents && feature.documents.length > 0 && (
            <div className="dept-feature-docs">
              <h3 className="dept-sub-heading">Documents &amp; Downloads</h3>
              <div className="syllabus-list">
                {feature.documents.map((doc) => (
                  <div className="syllabus-item" key={doc.id}>
                    <div className="syllabus-info">
                      <div className="syllabus-icon">
                        <FileText size={22} />
                      </div>
                      <div className="syllabus-text">
                        <strong>{doc.display_title}</strong>
                        {(doc.file_type || doc.file_size) && (
                          <span>
                            {doc.file_type}
                            {doc.file_size ? ` · ${doc.file_size}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a
                        href={doc.file_url}
                        className="button button-navy"
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "0 14px", height: 34 }}
                      >
                        <ExternalLink size={13} /> View
                      </a>
                      <a
                        href={doc.file_url}
                        className="button button-navy"
                        download
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "0 14px", height: 34, background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}
                      >
                        <Download size={13} /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External URL */}
          {feature.external_url && (
            <div style={{ marginTop: 16 }}>
              <a
                href={feature.external_url}
                target={feature.open_in_new_page ? "_blank" : undefined}
                rel="noreferrer"
                className="button button-navy"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "0 18px", height: 38 }}
              >
                <ExternalLink size={14} /> Learn More
              </a>
            </div>
          )}

          {/* Standalone PDF link */}
          {feature.pdf_url && !feature.documents?.length && (
            <div style={{ marginTop: 16 }}>
              <a
                href={feature.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="button button-navy"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "0 18px", height: 38 }}
              >
                <FileText size={14} /> View PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = await getDepartmentBySlug(slug);
  if (!dept) notFound();

  // Fetch all CMS data in parallel
  const [features, hod, faculty, labs, gallery] = await Promise.all([
    getDepartmentFeatures(dept.id),
    getDepartmentHOD(dept.id),
    getDepartmentFaculty(dept.id),
    getDepartmentLabs(dept.id),
    getDepartmentGallery(dept.id),
  ]);

  const heroBg =
    dept.hero_image ||
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80";

  return (
    <main className="dept-detail-main">
      {/* ── Hero Banner ─────────────────────────────────────── */}
      <section
        className="dept-hero"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="dept-hero-shade" />
        <div className="page-wrap dept-hero-inner">
          <div className="dept-hero-tags">
            <span className="dept-hero-tag badge-highlight">{dept.short_code}</span>
            {dept.intake && <span className="dept-hero-tag">{dept.intake}</span>}
            {dept.duration && <span className="dept-hero-tag">{dept.duration}</span>}
            <span className="dept-hero-tag">Autonomous Institute</span>
          </div>
          <h1>{dept.name}</h1>
          {dept.description && <p className="dept-lead">{dept.description}</p>}
          <div className="dept-hero-actions">
            <a href="#overview" className="button button-gold">
              Overview <ArrowRight size={15} />
            </a>
            <Link href="/departments" className="button button-ghost-light">
              <ArrowLeft size={15} /> All Departments
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sticky Feature Nav ──────────────────────────────── */}
      <nav className="dept-nav-sticky" aria-label="Department sections">
        <div className="page-wrap dept-nav-wrap" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
          <a href="#overview" className="dept-nav-item">Overview</a>
          {hod && <a href="#hod" className="dept-nav-item">HOD</a>}
          {faculty.length > 0 && <a href="#faculty" className="dept-nav-item">Faculty</a>}
          {labs.length > 0 && <a href="#laboratories" className="dept-nav-item">Laboratories</a>}
          {features.map((f) => (
            <a key={f.id} href={`#${f.slug}`} className="dept-nav-item">
              {f.name}
            </a>
          ))}
          {gallery.length > 0 && <a href="#gallery" className="dept-nav-item">Gallery</a>}
          <a href="#contact" className="dept-nav-item">Contact</a>
        </div>
      </nav>

      {/* ── Overview ────────────────────────────────────────── */}
      <section className="dept-section" id="overview" style={{ scrollMarginTop: "72px" }}>
        <div className="page-wrap">
          <div className="dept-section-header">
            <span className="dept-section-kicker">About the Department</span>
            <h2>Department Overview</h2>
          </div>
          <div style={{ maxWidth: 860, fontSize: 16, lineHeight: 1.85, color: "#334155" }}>
            {dept.overview ? (
              <p>{dept.overview}</p>
            ) : (
              <>
                <p>
                  The Department of <strong>{dept.name}</strong> ({dept.short_code}) at
                  Sanjeevan Group of Institutions provides comprehensive engineering
                  education merging strong conceptual rigour with applied industrial
                  problem solving.
                </p>
                {(dept.intake || dept.duration) && (
                  <p style={{ marginTop: 14 }}>
                    With an intake of <strong>{dept.intake ?? "60 seats"}</strong> over a{" "}
                    <strong>{dept.duration ?? "4-year"}</strong> programme, students undergo
                    systematic training across foundational engineering sciences, specialised
                    core courses, and capstone projects.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── HOD Section ─────────────────────────────────────── */}
      {hod && (
        <section className="dept-section dept-section-alt" id="hod" style={{ scrollMarginTop: "72px" }}>
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Academic Leadership</span>
              <h2>Head of Department</h2>
            </div>
            <div className="hod-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hod.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"}
                alt={hod.name}
                className="hod-photo"
              />
              <div className="hod-info">
                <h3>{hod.name}</h3>
                {hod.designation && (
                  <span className="hod-role">{hod.designation}</span>
                )}
                {hod.qualification && (
                  <span style={{ fontSize: 13, color: "#64748b", display: "block", marginBottom: 6 }}>
                    {hod.qualification}
                    {hod.experience ? ` · ${hod.experience}` : ""}
                  </span>
                )}
                {hod.short_intro && (
                  <p className="hod-quote">&ldquo;{hod.short_intro}&rdquo;</p>
                )}
                {hod.full_message && (
                  <Link
                    href={`/departments/${slug}/hod-message`}
                    className="button button-navy"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "0 16px", height: 36, marginTop: 10 }}
                  >
                    Read Full Message <ChevronRight size={14} />
                  </Link>
                )}
                {(hod.email || hod.phone) && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#64748b", marginTop: 10 }}>
                    {hod.email && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Mail size={14} color="#c5342a" /> {hod.email}
                      </span>
                    )}
                    {hod.phone && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Phone size={14} color="#2563eb" /> {hod.phone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Faculty ─────────────────────────────────────────── */}
      {faculty.length > 0 && (
        <section className="dept-section" id="faculty" style={{ scrollMarginTop: "72px" }}>
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Faculty Expertise</span>
              <h2>Distinguished Faculty</h2>
            </div>
            <div className="faculty-grid">
              {faculty.map((f) => (
                <div className="faculty-card" key={f.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                    alt={f.name}
                    className="faculty-img"
                  />
                  <strong>{f.name}</strong>
                  {f.designation && <small className="role">{f.designation}</small>}
                  {f.qualification && <span className="qual">{f.qualification}</span>}
                  {f.experience && <span className="exp">{f.experience} Exp.</span>}
                  {f.specialization && (
                    <span style={{ fontSize: 10, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 3, marginTop: 4 }}>
                      {f.specialization}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Laboratories ────────────────────────────────────── */}
      {labs.length > 0 && (
        <section className="dept-section dept-section-alt" id="laboratories" style={{ scrollMarginTop: "72px" }}>
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Applied Facilities</span>
              <h2>Laboratories</h2>
            </div>
            <div className="labs-grid">
              {labs.map((lab) => (
                <div className="lab-card" key={lab.id}>
                  {lab.cover_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lab.cover_image}
                      alt={lab.name}
                      style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: "8px 8px 0 0", display: "block", margin: "-16px -16px 12px" }}
                    />
                  )}
                  <h4>
                    {lab.name}
                    {lab.lab_code && (
                      <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 5px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 3 }}>
                        {lab.lab_code}
                      </span>
                    )}
                  </h4>
                  {lab.description && <p>{lab.description}</p>}
                  <div className="lab-meta">
                    {lab.incharge && <span><strong>In-Charge:</strong> {lab.incharge}</span>}
                    {lab.equipment && <span><strong>Equipment:</strong> {lab.equipment}</span>}
                    {lab.facilities && <span><strong>Facilities:</strong> {lab.facilities}</span>}
                  </div>
                  {(lab.pdf_url || lab.external_url) && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      {lab.pdf_url && (
                        <a href={lab.pdf_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, color: "#1d4ed8" }}>
                          <FileText size={12} /> PDF
                        </a>
                      )}
                      {lab.external_url && (
                        <a href={lab.external_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, color: "#16a34a" }}>
                          <ExternalLink size={12} /> More Info
                        </a>
                      )}
                    </div>
                  )}
                  {/* Lab image gallery */}
                  {lab.images && lab.images.length > 0 && (
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                      {lab.images.slice(0, 6).map((img) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={img.id} src={img.image_url} alt={img.caption ?? lab.name} style={{ width: "100%", height: 64, objectFit: "cover", borderRadius: 4 }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Dynamic CMS Features ────────────────────────────── */}
      {features.map((feature, idx) => (
        <div key={feature.id} className={idx % 2 === 0 ? "" : "dept-section-alt"}>
          <FeatureSection feature={feature} />
        </div>
      ))}

      {/* ── Gallery ─────────────────────────────────────────── */}
      {gallery.length > 0 && (
        <section className="dept-section dept-section-alt" id="gallery" style={{ scrollMarginTop: "72px" }}>
          <div className="page-wrap">
            <div className="dept-section-header">
              <span className="dept-section-kicker">Campus Life</span>
              <h2>Department Gallery</h2>
            </div>
            <div className="dept-gallery-grid">
              {gallery.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.image_url}
                  alt={photo.caption ?? dept.name}
                  className="dept-gallery-item"
                  title={photo.caption ?? undefined}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contact ─────────────────────────────────────────── */}
      <section className="dept-section" id="contact" style={{ scrollMarginTop: "72px" }}>
        <div className="page-wrap">
          <div className="dept-section-header">
            <span className="dept-section-kicker">Get in Touch</span>
            <h2>Department Contact</h2>
          </div>
          <div className="contact-grid">
            {dept.contact?.cabin && (
              <div className="contact-card">
                <div className="contact-icon">📍</div>
                <div>
                  <strong>Office Location</strong>
                  <p>{dept.contact.cabin}</p>
                </div>
              </div>
            )}
            {(dept.contact?.email || dept.hod_email) && (
              <div className="contact-card">
                <div className="contact-icon"><Mail size={20} /></div>
                <div>
                  <strong>Official Email</strong>
                  <p>{dept.contact?.email || dept.hod_email}</p>
                </div>
              </div>
            )}
            {dept.contact?.office_hours && (
              <div className="contact-card">
                <div className="contact-icon">🕐</div>
                <div>
                  <strong>Working Hours</strong>
                  <p>{dept.contact.office_hours}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
