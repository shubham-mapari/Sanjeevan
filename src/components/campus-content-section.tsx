import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, Download, MapPin, Pin } from "lucide-react";
import {
  getPublishedContent,
  type CampusContentItem,
  type ContentKind,
} from "@/lib/campus-content";
import "@/app/campus-content.css";

const panels: { kind: ContentKind; title: string; description: string }[] = [
  { kind: "news", title: "Latest News", description: "News & announcements" },
  { kind: "events", title: "Latest Events", description: "What's happening on campus" },
  { kind: "downloads", title: "Downloads", description: "Forms, notices & documents" },
];

function dateLabel(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function downloadHref(item: CampusContentItem) {
  if (!item.pdf_url) return "#";
  try {
    const url = new URL(item.pdf_url);
    if (url.pathname.includes("/storage/v1/object/public/")) {
      url.searchParams.set("download", item.title);
    }
    return url.toString();
  } catch {
    return item.pdf_url;
  }
}

function ItemRow({ kind, item }: { kind: ContentKind; item: CampusContentItem }) {
  if (kind === "downloads") {
    return (
      <a className="campus-content-row" href={downloadHref(item)} download>
        <span className="campus-content-icon"><Download size={17} /></span>
        <span className="campus-content-copy">
          <strong>{item.title}</strong>
          <small>{[item.category, item.file_size].filter(Boolean).join(" · ")}</small>
        </span>
        {item.is_new && <span className="campus-content-new">NEW</span>}
      </a>
    );
  }

  const href = `/${kind}/${item.id}`;
  return (
    <Link className="campus-content-row" href={href}>
      <span className="campus-content-icon">
        {kind === "events" ? <CalendarDays size={17} /> : <ArrowUpRight size={17} />}
      </span>
      <span className="campus-content-copy">
        <strong>{item.title}</strong>
        <small>
          {kind === "events" ? (
            <>{dateLabel(item.event_date)}{item.venue ? ` · ${item.venue}` : ""}</>
          ) : (
            <>{item.category}{item.publish_date ? ` · ${dateLabel(item.publish_date)}` : ""}</>
          )}
        </small>
      </span>
      <span className="campus-content-badges">
        {item.is_pinned && <Pin size={13} aria-label="Pinned" />}
        {item.is_new && <span className="campus-content-new">NEW</span>}
      </span>
    </Link>
  );
}

function ContentPanel({
  kind,
  title,
  description,
  items,
}: {
  kind: ContentKind;
  title: string;
  description: string;
  items: CampusContentItem[];
}) {
  return (
    <section className={`campus-content-panel campus-content-${kind}`} aria-labelledby={`campus-content-${kind}`}>
      <header className="campus-content-panel-header">
        <span>{description}</span>
        <h3 id={`campus-content-${kind}`}>{title}</h3>
      </header>
      <div className="campus-content-list">
        {items.length ? items.map((item) => <ItemRow key={item.id} kind={kind} item={item} />) : (
          <p className="campus-content-empty">No published items yet.</p>
        )}
      </div>
      <Link className="campus-content-view-all" href={`/${kind}`}>
        View All <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}

export async function CampusContentSection() {
  const [news, events, downloads] = await Promise.all([
    getPublishedContent("news", 5),
    getPublishedContent("events", 5),
    getPublishedContent("downloads", 5),
  ]);
  const records = { news, events, downloads };

  return (
    <section className="campus-content-section section-pad" aria-labelledby="campus-content-title">
      <div className="page-wrap">
        <div className="campus-content-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> Campus updates</span>
            <h2 id="campus-content-title">News, events <em>&amp; resources.</em></h2>
          </div>
          <p>Stay close to the latest from Sanjeevan.</p>
        </div>
        <div className="campus-content-grid">
          {panels.map((panel) => (
            <ContentPanel key={panel.kind} {...panel} items={records[panel.kind]} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContentListing({
  kind,
  items,
}: {
  kind: ContentKind;
  items: CampusContentItem[];
}) {
  const title = kind === "news" ? "Latest News" : kind === "events" ? "Events" : "Downloads";
  return (
    <main className="content-page section-pad">
      <div className="page-wrap">
        <div className="content-page-heading">
          <span className="eyebrow"><span className="eyebrow-line" /> Sanjeevan campus</span>
          <h1>{title}</h1>
        </div>
        <div className="content-page-list">
          {items.map((item) => (
            <div className="content-page-item" key={item.id}>
              {(item.image_url || item.banner_url) && (
                <Image src={item.image_url ?? item.banner_url ?? ""} alt="" width={300} height={210} unoptimized />
              )}
              <div className="content-page-item-copy">
                <div className="content-page-item-meta">
                  <span>{kind === "events" ? dateLabel(item.event_date) : kind === "news" ? dateLabel(item.publish_date) : item.category}</span>
                  {item.is_new && <span className="campus-content-new">NEW</span>}
                  {item.is_pinned && <Pin size={14} aria-label="Pinned" />}
                </div>
                <h2>{kind === "downloads" ? (
                  <a href={downloadHref(item)} download>{item.title}</a>
                ) : (
                  <Link href={`/${kind}/${item.id}`}>{item.title}</Link>
                )}</h2>
                {kind === "events" && <p className="content-page-venue"><MapPin size={14} /> {item.venue}</p>}
                {kind !== "downloads" && <p>{item.description}</p>}
              </div>
              {kind === "downloads" && <a className="content-page-download" href={downloadHref(item)} download aria-label={`Download ${item.title}`}><Download size={19} /></a>}
            </div>
          ))}
          {!items.length && <p className="content-page-empty">No published items yet.</p>}
        </div>
      </div>
    </main>
  );
}

export function ContentDetail({
  kind,
  item,
}: {
  kind: "news" | "events";
  item: CampusContentItem;
}) {
  return (
    <main className="content-page section-pad">
      <article className="page-wrap content-detail">
        <Link className="content-detail-back" href={`/${kind}`}>← All {kind}</Link>
        {(item.image_url || item.banner_url) && <Image className="content-detail-image" src={item.image_url ?? item.banner_url ?? ""} alt="" width={1200} height={600} unoptimized />}
        <div className="content-page-item-meta">
          <span>{kind === "events" ? dateLabel(item.event_date) : dateLabel(item.publish_date)}</span>
          {item.category && <span>{item.category}</span>}
          {item.is_new && <span className="campus-content-new">NEW</span>}
        </div>
        <h1>{item.title}</h1>
        {kind === "events" && <p className="content-page-venue"><MapPin size={15} /> {item.venue}</p>}
        <p className="content-detail-description">{item.description}</p>
        {item.pdf_url && <a className="content-detail-action" href={item.pdf_url} download><Download size={16} /> Download related PDF</a>}
        {kind === "events" && item.registration_link && <a className="content-detail-action" href={item.registration_link} target="_blank" rel="noreferrer">Register <ArrowUpRight size={16} /></a>}
      </article>
    </main>
  );
}