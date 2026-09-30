import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, FileText } from "lucide-react";
import { RichContent } from "@/components/rich-content";
import { getPublishedQuickLink, getPublishedQuickLinks } from "@/lib/quick-links-data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

function safeAsset(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublishedQuickLink(slug);
  if (!item) return { title: "Quick link not found" };
  return {
    title: item.title,
    description: item.short_description || undefined,
    openGraph: {
      title: item.title,
      description: item.short_description || undefined,
      images: safeAsset(item.thumbnail_url) ? [safeAsset(item.thumbnail_url)!] : undefined,
    },
  };
}

export default async function QuickLinkPage({ params }: Params) {
  const { slug } = await params;
  const [item, allItems] = await Promise.all([
    getPublishedQuickLink(slug),
    getPublishedQuickLinks(),
  ]);
  if (!item) notFound();

  const heroImage = safeAsset(item.thumbnail_url);
  const pdf = safeAsset(item.pdf_url);
  const gallery = item.quick_link_gallery
    .map((image) => safeAsset(image.image_url))
    .filter((image): image is string => Boolean(image));
  const related = allItems
    .filter((other) => other.id !== item.id && other.category === item.category)
    .slice(0, 4);

  return (
    <main className="quick-link-detail">
      <section
        className="quick-link-detail-hero"
        style={heroImage ? { backgroundImage: `url(${JSON.stringify(heroImage)})` } : undefined}
      >
        <div className="quick-link-detail-shade" aria-hidden="true" />
        <div className="page-wrap">
          <nav className="quick-link-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span>/</span><Link href="/">Quick links</Link><span>/</span><span>{item.title}</span>
          </nav>
          {item.category && <span className="quick-link-detail-category">{item.category}</span>}
          <h1>{item.title}</h1>
          {item.short_description && <p>{item.short_description}</p>}
        </div>
      </section>

      <section className="quick-link-detail-content">
        <div className="page-wrap">
          <div className="quick-link-detail-layout">
            <article className="quick-link-detail-article">
              <RichContent document={item.full_description} />
            </article>
            {pdf && (
              <aside className="quick-link-detail-resource">
                <a href={pdf} target="_blank" rel="noreferrer"><span><FileText size={16} /> Download PDF</span><ArrowUpRight size={14} /></a>
              </aside>
            )}
          </div>
          {!!gallery.length && (
            <div className="quick-link-detail-gallery" aria-label={`${item.title} image gallery`}>
              {gallery.map((src, index) => (
                <Image key={`${src}-${index}`} src={src} alt={`${item.title} ${index + 1}`} width={520} height={360} unoptimized />
              ))}
            </div>
          )}
        </div>
      </section>

      {!!related.length && (
        <section className="quick-link-related">
          <div className="page-wrap">
            <h2>Related links</h2>
            <div className="quick-link-related-grid">
              {related.map((relatedItem) => (
                <Link className="quick-link-related-card" href={`/quick-links/${relatedItem.slug}`} key={relatedItem.id}>
                  <Image src={relatedItem.thumbnail_url} alt="" width={360} height={220} unoptimized />
                  <strong>{relatedItem.title}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
