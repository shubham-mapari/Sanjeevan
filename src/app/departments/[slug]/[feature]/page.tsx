import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import {
  getDepartmentBySlug,
  getDepartmentFeatureBySlug,
  getDepartmentFeatures,
} from "@/lib/departments-data";
import { RichContent } from "@/components/rich-content";
import "@/app/departments/departments.css";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return []; // fully dynamic
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; feature: string }>;
}): Promise<Metadata> {
  const { slug, feature: featureSlug } = await params;
  const dept = await getDepartmentBySlug(slug);
  if (!dept) return { title: "Not Found" };
  const feature = await getDepartmentFeatureBySlug(dept.id, featureSlug);
  if (!feature) return { title: "Not Found" };
  return {
    title: `${feature.name} | ${dept.name} | Sanjeevan`,
    description: feature.short_description || undefined,
    openGraph: {
      title: `${feature.name} — ${dept.name}`,
      images: feature.cover_image ? [feature.cover_image] : undefined,
    },
  };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string; feature: string }>;
}) {
  const { slug, feature: featureSlug } = await params;

  const dept = await getDepartmentBySlug(slug);
  if (!dept) notFound();

  const [feature, allFeatures] = await Promise.all([
    getDepartmentFeatureBySlug(dept.id, featureSlug),
    getDepartmentFeatures(dept.id),
  ]);

  if (!feature) notFound();

  const heroBg =
    feature.cover_image ||
    dept.hero_image ||
    "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80";

  return (
    <main className="dept-detail-main">
      {/* Hero */}
      <section
        className="dept-hero"
        style={{ backgroundImage: `url(${heroBg})`, minHeight: 260 }}
      >
        <div className="dept-hero-shade" />
        <div className="page-wrap dept-hero-inner">
          <div className="dept-hero-tags">
            <span className="dept-hero-tag badge-highlight">{dept.short_code}</span>
            <span className="dept-hero-tag">{dept.name}</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>{feature.name}</h1>
          {feature.short_description && (
            <p className="dept-lead">{feature.short_description}</p>
          )}
          <div className="dept-hero-actions">
            <Link href={`/departments/${slug}`} className="button button-ghost-light">
              <ArrowLeft size={15} /> Back to {dept.short_code}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature nav */}
      {allFeatures.length > 1 && (
        <nav className="dept-nav-sticky" aria-label="Department features">
          <div className="page-wrap dept-nav-wrap" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
            <Link href={`/departments/${slug}`} className="dept-nav-item">Overview</Link>
            {allFeatures.map((f) => (
              <Link
                key={f.id}
                href={`/departments/${slug}/${f.slug}`}
                className={`dept-nav-item${f.slug === featureSlug ? " active" : ""}`}
              >
                {f.name}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Content */}
      <section className="dept-section">
        <div className="page-wrap">
          <div style={{ maxWidth: 900 }}>
            {/* Rich description */}
            {feature.full_description ? (
              <div className="cms-article">
                <RichContent document={feature.full_description as Parameters<typeof RichContent>[0]["document"]} />
              </div>
            ) : feature.short_description ? (
              <p style={{ fontSize: 16, lineHeight: 1.85, color: "#334155" }}>
                {feature.short_description}
              </p>
            ) : (
              <p style={{ color: "#94a3b8" }}>Content coming soon.</p>
            )}
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {feature.images && feature.images.length > 0 && (
        <section className="dept-section dept-section-alt">
          <div className="page-wrap">
            <h2 className="dept-sub-heading" style={{ fontSize: 22, fontWeight: 700, color: "#0b1f4d", marginBottom: 20 }}>Gallery</h2>
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
        </section>
      )}

      {/* Documents */}
      {feature.documents && feature.documents.length > 0 && (
        <section className="dept-section">
          <div className="page-wrap">
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0b1f4d", marginBottom: 20 }}>
              Documents &amp; Downloads
            </h2>
            <div className="syllabus-list">
              {feature.documents.map((doc) => (
                <div className="syllabus-item" key={doc.id}>
                  <div className="syllabus-info">
                    <div className="syllabus-icon"><FileText size={22} /></div>
                    <div className="syllabus-text">
                      <strong>{doc.display_title}</strong>
                      {(doc.file_type || doc.file_size) && (
                        <span>{doc.file_type}{doc.file_size ? ` · ${doc.file_size}` : ""}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="button button-navy"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "0 14px", height: 34 }}>
                      <ExternalLink size={13} /> View
                    </a>
                    <a href={doc.file_url} download target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "0 14px", height: 34, background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 6, textDecoration: "none" }}>
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* External / PDF links */}
      {(feature.external_url || (feature.pdf_url && !feature.documents?.length)) && (
        <section className="dept-section">
          <div className="page-wrap">
            <div style={{ display: "flex", gap: 12 }}>
              {feature.external_url && (
                <a href={feature.external_url} target={feature.open_in_new_page ? "_blank" : undefined} rel="noreferrer"
                  className="button button-gold" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ExternalLink size={15} /> Learn More
                </a>
              )}
              {feature.pdf_url && !feature.documents?.length && (
                <a href={feature.pdf_url} target="_blank" rel="noreferrer"
                  className="button button-navy" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <FileText size={15} /> View PDF
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
