"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Home,
  X,
  ZoomIn,
} from "lucide-react";
import type { NavigationPage } from "@/lib/navigation-types";
import { RichContent } from "@/components/rich-content";
import "../dynamic-page.css";

function safeAsset(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeHref(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https:\/\//i.test(value)) return value;
  return null;
}

function PageSkeleton() {
  return (
    <main>
      <div className="dyn-hero-section" style={{ minHeight: 380 }}>
        <div className="dyn-hero-overlay" />
        <div className="page-wrap dyn-hero-content" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
          <div style={{ height: 20, width: 180, background: "rgba(255,255,255,0.1)", borderRadius: 20, marginBottom: 16 }} />
          <div style={{ height: 42, width: 480, background: "rgba(255,255,255,0.12)", borderRadius: 10, marginBottom: 14 }} />
          <div style={{ height: 20, width: 340, background: "rgba(255,255,255,0.08)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="dyn-page-body">
        <div className="page-wrap dyn-full-grid">
          <div className="dyn-card" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
            {[1, 0.7, 0.85, 0.6].map((w, i) => (
              <div key={i} style={{ height: 16, width: `${w * 100}%`, background: "#f1f5f9", borderRadius: 6, marginBottom: 12 }} />
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    </main>
  );
}

function Lightbox({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="dyn-lightbox-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dyn-lightbox-container">
        <button
          className="dyn-lightbox-close"
          onClick={onClose}
          aria-label="Close lightbox"
          type="button"
        >
          <X size={16} />
        </button>
        {images.length > 1 && (
          <button
            className="dyn-lightbox-nav dyn-lightbox-prev"
            onClick={prev}
            aria-label="Previous image"
            type="button"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <img
          src={images[current]}
          alt={`Gallery image ${current + 1} of ${images.length}`}
          className="dyn-lightbox-img"
        />
        {images.length > 1 && (
          <button
            className="dyn-lightbox-nav dyn-lightbox-next"
            onClick={next}
            aria-label="Next image"
            type="button"
          >
            <ChevronRight size={20} />
          </button>
        )}
        <p
          style={{
            color: "#94a3b8",
            fontSize: 12,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          {current + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}

export default function DynamicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [page, setPage] = useState<NavigationPage | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not-found">(
    "loading",
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setStatus("loading");
    setPage(null);
    fetch(`/api/pages/${slug}`)
      .then((res) => {
        if (res.status === 404) {
          setStatus("not-found");
          return null;
        }
        return res.json() as Promise<NavigationPage>;
      })
      .then((data) => {
        if (data) {
          setPage(data);
          setStatus("found");
        }
      })
      .catch(() => setStatus("not-found"));
  }, [slug]);

  useEffect(() => {
    if (!heroRef.current) return;
    const el = heroRef.current;
    const handler = () => {
      const scrolled = window.scrollY;
      el.style.backgroundPositionY = `calc(50% + ${scrolled * 0.28}px)`;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [status]);

  if (status === "loading") return <PageSkeleton />;

  if (status === "not-found") {
    return (
      <main>
        <div className="dyn-hero-section" style={{ minHeight: 320 }}>
          <div className="dyn-hero-overlay" />
          <div
            className="page-wrap dyn-hero-content"
            style={{ textAlign: "center", maxWidth: "100%" }}
          >
            <div
              className="dyn-badge"
              style={{ margin: "0 auto 16px" }}
            >
              <span className="dyn-badge-dot" /> 404 Page not found
            </div>
            <h1 className="dyn-hero-title">This page does not exist</h1>
            <p
              className="dyn-hero-subtitle"
              style={{ margin: "0 auto" }}
            >
              The page you are looking for may have been moved or deleted.
            </p>
          </div>
        </div>
        <div className="dyn-page-body">
          <div className="page-wrap" style={{ textAlign: "center" }}>
            <Link
              href="/"
              className="dyn-download-btn"
              style={{ display: "inline-flex", marginTop: 8 }}
            >
              <Home size={14} /> Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!page) return null;

  const heroImage = safeAsset(page.hero_image);
  const heroTitle = page.hero_heading || page.title;
  const heroSub = page.hero_subtitle;
  const ctaHref = safeHref(page.cta_url || page.cta_link);
  const ctaLabel = page.cta_label || page.cta_text;
  const videoUrl =
    page.video_url && /^https:\/\//i.test(page.video_url)
      ? page.video_url
      : null;

  const galleryImages: string[] = (() => {
    const fromTable = (page.gallery_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((g) => g.image_url);
    if (fromTable.length)
      return fromTable.map(safeAsset).filter(Boolean) as string[];
    return (page.gallery ?? []).map(safeAsset).filter(Boolean) as string[];
  })();

  const files = (() => {
    if (page.page_files && page.page_files.length) return page.page_files;
    const pdf = safeAsset(page.pdf_file);
    if (!pdf) return [];
    const name = pdf.split("/").pop() ?? "Document.pdf";
    return [{ file_name: name, file_url: pdf, file_type: "pdf" }];
  })();

  const hasSidebar = !!(files.length || videoUrl || ctaHref);

  return (
    <>
      {lightboxIndex !== null && galleryImages.length > 0 && (
        <Lightbox
          images={galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      <main>
        {/* Hero */}
        <div
          ref={heroRef}
          className="dyn-hero-section"
          style={
            heroImage
              ? { backgroundImage: `url(${JSON.stringify(heroImage)})` }
              : undefined
          }
        >
          <div className="dyn-hero-overlay" />
          <div className="page-wrap dyn-hero-content">
            <div className="dyn-badge">
              <span className="dyn-badge-dot" /> Sanjeevan Group of Institutions
            </div>
            <h1 className="dyn-hero-title">{heroTitle}</h1>
            {heroSub && <p className="dyn-hero-subtitle">{heroSub}</p>}
            <nav className="dyn-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>{page.title}</span>
            </nav>
          </div>
        </div>

        {/* Body */}
        <div className="dyn-page-body">
          <div className="page-wrap">
            <div
              className={hasSidebar ? "dyn-main-grid" : "dyn-full-grid"}
            >
              {/* Main content */}
              <div>
                <div className="dyn-card">
                  <h2 className="dyn-section-title">
                    <FileText size={18} />
                    {page.title}
                  </h2>
                  <article className="dyn-content-article">
                    <RichContent document={page.description} />
                  </article>
                </div>

                {galleryImages.length > 0 && (
                  <div className="dyn-card">
                    <h2 className="dyn-section-title">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      Photo Gallery
                    </h2>
                    <div className="dyn-gallery-grid">
                      {galleryImages.map((src, i) => (
                        <div
                          key={`${src}-${i}`}
                          className="dyn-gallery-item"
                          role="button"
                          tabIndex={0}
                          aria-label={`View image ${i + 1}`}
                          onClick={() => setLightboxIndex(i)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setLightboxIndex(i)
                          }
                        >
                          <img
                            src={src}
                            alt={`${page.title} gallery image ${i + 1}`}
                            className="dyn-gallery-img"
                            loading="lazy"
                          />
                          <div className="dyn-gallery-hover-overlay">
                            <span className="dyn-gallery-zoom-btn">
                              <ZoomIn size={16} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              {hasSidebar && (
                <aside>
                  {files.length > 0 && (
                    <div className="dyn-sidebar-card">
                      <h3
                        className="dyn-section-title"
                        style={{ fontSize: 16 }}
                      >
                        <FileText size={16} /> Documents
                      </h3>
                      {files.map((file, i) => {
                        const fileHref = safeAsset(file.file_url);
                        if (!fileHref) return null;
                        return (
                          <div className="dyn-pdf-tile" key={i}>
                            <div className="dyn-pdf-info">
                              <div className="dyn-pdf-icon-box">
                                <FileText size={18} />
                              </div>
                              <div className="dyn-pdf-details">
                                <strong>{file.file_name}</strong>
                                <span>
                                  {(file.file_type ?? "pdf").toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <a
                              className="dyn-download-btn"
                              href={fileHref}
                              target="_blank"
                              rel="noreferrer"
                              download
                            >
                              <Download size={13} /> Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {videoUrl && (
                    <div className="dyn-sidebar-card">
                      <h3
                        className="dyn-section-title"
                        style={{ fontSize: 16 }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Video
                      </h3>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="dyn-download-btn"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        <ExternalLink size={13} /> Watch video
                      </a>
                    </div>
                  )}

                  <div className="dyn-sidebar-card">
                    <h3
                      className="dyn-section-title"
                      style={{ fontSize: 16 }}
                    >
                      <ArrowUpRight size={16} /> Quick Links
                    </h3>
                    <nav
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <Link
                        href="/"
                        className="dyn-download-btn"
                        style={{ justifyContent: "space-between" }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Home size={13} /> Home
                        </span>
                        <ArrowLeft
                          size={12}
                          style={{ transform: "rotate(180deg)" }}
                        />
                      </Link>
                      <Link
                        href="/admission"
                        className="dyn-download-btn"
                        style={{
                          justifyContent: "space-between",
                          background: "#c62828",
                        }}
                      >
                        <span>Admissions open</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </nav>
                  </div>
                </aside>
              )}
            </div>

            {/* CTA Banner */}
            {ctaHref && ctaLabel && (
              <div className="dyn-cta-card">
                <div>
                  <h2 className="dyn-cta-title">{ctaLabel}</h2>
                  {page.cta_text && page.cta_text !== ctaLabel && (
                    <p className="dyn-cta-desc">{page.cta_text}</p>
                  )}
                </div>
                <Link
                  href={ctaHref}
                  className="dyn-cta-action-btn"
                  {...(ctaHref.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {ctaLabel} <ArrowUpRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
