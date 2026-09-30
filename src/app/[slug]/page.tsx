import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, FileText } from "lucide-react";
import { RichContent } from "@/components/rich-content";
import { getPublishedPage } from "@/lib/navigation-data";

function safeAsset(value: string | null) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isInternalUrl(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.seo_title || page.title,
    description: page.seo_description || undefined,
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || undefined,
      images: page.hero_image ? [page.hero_image] : undefined,
    },
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) notFound();
  const heroImage = safeAsset(page.hero_image);
  const pdfFile = safeAsset(page.pdf_file);
  const gallery = page.gallery
    .map(safeAsset)
    .filter((src): src is string => Boolean(src));
  const ctaHref =
    page.cta_url &&
    (isInternalUrl(page.cta_url) || /^https:\/\//i.test(page.cta_url))
      ? page.cta_url
      : null;

  return (
    <main>
      <section
        className="inner-hero"
        style={
          heroImage
            ? {
                backgroundImage: `linear-gradient(90deg,rgba(7,22,51,.94),rgba(9,28,66,.76)),url(${JSON.stringify(heroImage)})`,
              }
            : undefined
        }
      >
        <div className="page-wrap">
          <span className="eyebrow">
            <span className="eyebrow-line" /> Sanjeevan Group of Institutions
          </span>
          <h1>{page.title}</h1>
          <div className="breadcrumb">
            <Link href="/">Home</Link> &nbsp; / &nbsp; {page.title}
          </div>
        </div>
      </section>
      <section className="inner-content">
        <div className="page-wrap cms-page-layout">
          <article className="cms-article">
            <RichContent document={page.description} />
          </article>
          <aside className="cms-resources">
            {pdfFile && (
              <a
                className="cms-resource-link"
                href={pdfFile}
                target="_blank"
                rel="noreferrer"
              >
                <FileText size={17} /> Download document{" "}
                <ArrowUpRight size={14} />
              </a>
            )}
            {page.video_url && /^https:\/\//i.test(page.video_url) && (
              <a
                className="cms-resource-link"
                href={page.video_url}
                target="_blank"
                rel="noreferrer"
              >
                Watch video <ArrowUpRight size={14} />
              </a>
            )}
            {ctaHref && page.cta_label && (
              <Link className="button button-navy" href={ctaHref}>
                {page.cta_label} <ArrowUpRight size={16} />
              </Link>
            )}
          </aside>
        </div>
        {!!gallery.length && (
          <div className="page-wrap cms-gallery">
            {gallery.map((src, index) => (
              <div
                className="cms-gallery-image"
                key={`${src}-${index}`}
                role="img"
                aria-label={`${page.title} gallery image ${index + 1}`}
                style={{ backgroundImage: `url(${JSON.stringify(src)})` }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
